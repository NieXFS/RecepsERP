import type Stripe from "stripe";
import { Prisma } from "@/generated/prisma/client";
import type {
  InvoiceStatus,
  SubscriptionStatus,
} from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { buildAppEventUrl, trackServerEvent } from "@/lib/analytics/server-events";
import { getPlanSlugCandidates } from "@/lib/plans";
import {
  getAppUrl,
  getStripe,
  getStripeCheckoutPaymentMethodTypes,
} from "@/lib/stripe";
import {
  applyReservedRewardAfterInvoicePaid,
  createReferralForTenant,
  getGuestReferralDiscountPercent,
  getReferralByCode,
  registerReferralUse,
  releaseReservedReward,
  reserveOldestPendingRewardForInvoice,
} from "@/services/referral.service";

type TenantForCustomerCreation = {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  stripeCustomerId: string | null;
  referredByCode: string | null;
  referredByTenantId: string | null;
};

type SubscriptionAccessStatus = SubscriptionStatus | "NONE";
type SubscriptionAccessSource = "SUBSCRIPTION" | "BILLING_BYPASS" | "SUPER_ADMIN" | "NONE";

export type TenantSubscriptionAccess = {
  hasAccess: boolean;
  status: SubscriptionAccessStatus;
  reason: string;
  accessSource: SubscriptionAccessSource;
  billingBypassEnabled: boolean;
  billingBypassReason: string | null;
  billingBypassUpdatedAt: Date | null;
  isProcessing: boolean;
  shouldPoll: boolean;
};

function getStripeObjectId<T extends { id: string }>(
  value: string | T | null | undefined
) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function stripeTimestampToDate(value: number | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value * 1000);
}

function stripeAmountToDecimal(value: number | null | undefined) {
  return new Prisma.Decimal(((value ?? 0) / 100).toFixed(2));
}

function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
      return "INCOMPLETE";
    case "incomplete_expired":
      return "INCOMPLETE_EXPIRED";
    case "unpaid":
      return "UNPAID";
    case "paused":
      return "PAUSED";
    default:
      throw new Error(`Status de assinatura Stripe não suportado: ${status}`);
  }
}

function mapStripeInvoiceStatus(
  status: Stripe.Invoice.Status | null
): InvoiceStatus {
  switch (status) {
    case "draft":
      return "DRAFT";
    case "open":
      return "OPEN";
    case "paid":
      return "PAID";
    case "void":
      return "VOID";
    case "uncollectible":
      return "UNCOLLECTIBLE";
    default:
      return "OPEN";
  }
}

function getInvoicePeriod(invoice: Stripe.Invoice) {
  const firstLine = invoice.lines.data[0];
  const lineStart = stripeTimestampToDate(firstLine?.period?.start);
  const lineEnd = stripeTimestampToDate(firstLine?.period?.end);

  return {
    start: stripeTimestampToDate((invoice as Stripe.Invoice & { period_start?: number }).period_start) ?? lineStart ?? new Date(),
    end: stripeTimestampToDate((invoice as Stripe.Invoice & { period_end?: number }).period_end) ?? lineEnd ?? new Date(),
  };
}

function getStripeInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return getStripeObjectId(invoice.parent?.subscription_details?.subscription);
}

function getStripeSubscriptionCurrentPeriod(subscription: Stripe.Subscription) {
  const starts = subscription.items.data
    .map((item) => stripeTimestampToDate(item.current_period_start))
    .filter((value): value is Date => Boolean(value))
    .sort((left, right) => left.getTime() - right.getTime());
  const ends = subscription.items.data
    .map((item) => stripeTimestampToDate(item.current_period_end))
    .filter((value): value is Date => Boolean(value))
    .sort((left, right) => left.getTime() - right.getTime());

  return {
    start: starts[0] ?? new Date(),
    end: ends.at(-1) ?? new Date(),
  };
}

async function getTenantForBilling(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      email: true,
      phone: true,
      stripeCustomerId: true,
      referredByCode: true,
      referredByTenantId: true,
      subscription: {
        select: {
          id: true,
          status: true,
          stripeSubscriptionId: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  return tenant;
}

async function ensureStripeCustomerEmail(
  stripeCustomerId: string,
  customerEmail?: string | null
) {
  if (!customerEmail) {
    return;
  }

  const stripe = getStripe();
  await stripe.customers.update(stripeCustomerId, {
    email: customerEmail,
  });
}

async function resolveCheckoutReferral(
  tenant: TenantForCustomerCreation,
  referralCode?: string
) {
  const normalizedReferralCode =
    referralCode?.trim() || tenant.referredByCode?.trim() || undefined;

  if (!normalizedReferralCode) {
    return null;
  }

  const referral = await getReferralByCode(normalizedReferralCode);

  if (!referral) {
    throw new Error("Código de indicação inválido.");
  }

  if (referral.tenantId === tenant.id) {
    throw new Error("Autoindicação não é permitida.");
  }

  if (tenant.referredByTenantId && tenant.referredByTenantId !== referral.tenantId) {
    throw new Error("Este tenant já está vinculado a outra indicação.");
  }

  if (tenant.referredByCode && tenant.referredByCode !== referral.code) {
    throw new Error("Este tenant já está vinculado a outro código de indicação.");
  }

  if (!referral.stripeCouponId || !referral.stripePromotionCodeId) {
    return createReferralForTenant(referral.tenantId);
  }

  return referral;
}

async function resolveTenantIdFromStripeSubscription(stripeSubscription: Stripe.Subscription) {
  const tenantIdFromMetadata = stripeSubscription.metadata?.tenantId;

  if (tenantIdFromMetadata) {
    return tenantIdFromMetadata;
  }

  const stripeSubscriptionId = stripeSubscription.id;
  const stripeCustomerId = getStripeObjectId(stripeSubscription.customer);

  const [localSubscription, tenant] = await Promise.all([
    db.subscription.findUnique({
      where: { stripeSubscriptionId },
      select: { tenantId: true },
    }),
    stripeCustomerId
      ? db.tenant.findUnique({
          where: { stripeCustomerId },
          select: { id: true },
        })
      : null,
  ]);

  return localSubscription?.tenantId ?? tenant?.id ?? null;
}

async function resolveLocalSubscriptionForInvoice(stripeInvoice: Stripe.Invoice) {
  const stripeSubscriptionId = getStripeInvoiceSubscriptionId(stripeInvoice);

  if (!stripeSubscriptionId) {
    return null;
  }

  const existingSubscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId },
  });

  if (existingSubscription) {
    return existingSubscription;
  }

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  return syncSubscriptionFromStripe(stripeSubscription);
}

function getActiveSubscriptionReason(status: SubscriptionStatus) {
  switch (status) {
    case "TRIALING":
      return "Assinatura em trial.";
    case "ACTIVE":
      return "Assinatura ativa.";
    case "PAST_DUE":
      return "Pagamento pendente. Atualize a forma de pagamento para liberar o acesso.";
    case "CANCELED":
      return "Seu trial acabou ou a assinatura foi cancelada. Adicione uma forma de pagamento para continuar.";
    case "INCOMPLETE":
      return "Pagamento inicial incompleto.";
    case "INCOMPLETE_EXPIRED":
      return "Pagamento inicial expirado.";
    case "UNPAID":
      return "Assinatura inadimplente.";
    case "PAUSED":
      return "Assinatura pausada.";
    default:
      return "Status de assinatura desconhecido.";
  }
}

async function getDefaultPaymentMethodSummary(defaultPaymentMethodId?: string | null) {
  if (!defaultPaymentMethodId) {
    return null;
  }

  try {
    const stripe = getStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);

    if (paymentMethod.type === "card" && paymentMethod.card) {
      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        label: `${paymentMethod.card.brand.toUpperCase()} final ${paymentMethod.card.last4}`,
        expiresAt: `${String(paymentMethod.card.exp_month).padStart(2, "0")}/${paymentMethod.card.exp_year}`,
      };
    }

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      label: paymentMethod.type,
      expiresAt: null,
    };
  } catch {
    return {
      id: defaultPaymentMethodId,
      type: "unknown",
      label: defaultPaymentMethodId,
      expiresAt: null,
    };
  }
}

export async function listActivePlans() {
  return db.plan.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getActivePlanBySlug(slug: string) {
  const slugCandidates = getPlanSlugCandidates(slug);

  if (slugCandidates.length === 0) {
    return null;
  }

  return db.plan.findFirst({
    where: {
      slug: {
        in: slugCandidates,
      },
      isActive: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function listAdminPlans() {
  return db.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function savePlan(input: {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  priceMonthly: number;
  currency: string;
  trialDays: number;
  maxUsers?: number;
  maxAppointmentsMonth?: number;
  features: Prisma.InputJsonValue;
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}) {
  const planData = {
    slug: input.slug.trim(),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    priceMonthly: new Prisma.Decimal(input.priceMonthly.toFixed(2)),
    currency: input.currency.trim().toLowerCase(),
    trialDays: input.trialDays,
    maxUsers: input.maxUsers ?? null,
    maxAppointmentsMonth: input.maxAppointmentsMonth ?? null,
    features: input.features,
    stripeProductId: input.stripeProductId?.trim() || null,
    stripePriceId: input.stripePriceId?.trim() || null,
    isActive: input.isActive,
    isFeatured: input.isFeatured,
    sortOrder: input.sortOrder,
  };

  if (input.id) {
    return db.plan.update({
      where: { id: input.id },
      data: planData,
    });
  }

  return db.plan.create({
    data: planData,
  });
}

export async function togglePlanActive(planId: string) {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!plan) {
    throw new Error("Plano não encontrado.");
  }

  return db.plan.update({
    where: { id: plan.id },
    data: {
      isActive: !plan.isActive,
    },
  });
}

export async function togglePlanFeatured(planId: string) {
  const plan = await db.plan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      isFeatured: true,
    },
  });

  if (!plan) {
    throw new Error("Plano não encontrado.");
  }

  return db.plan.update({
    where: { id: plan.id },
    data: {
      isFeatured: !plan.isFeatured,
    },
  });
}

export async function createStripeCustomer(tenant: TenantForCustomerCreation) {
  if (tenant.stripeCustomerId) {
    return tenant.stripeCustomerId;
  }

  const stripe = getStripe();
  const existingCustomerByEmail =
    tenant.email
      ? (
          await stripe.customers.list({
            email: tenant.email,
            limit: 10,
          })
        ).data.find((customer) => !customer.deleted)
      : null;

  if (existingCustomerByEmail) {
    const customerAlreadyLinked = await db.tenant.findFirst({
      where: {
        stripeCustomerId: existingCustomerByEmail.id,
      },
      select: {
        id: true,
      },
    });

    if (!customerAlreadyLinked || customerAlreadyLinked.id === tenant.id) {
      await stripe.customers.update(existingCustomerByEmail.id, {
        name: tenant.name,
        email: tenant.email ?? undefined,
        phone: tenant.phone ?? undefined,
        metadata: {
          ...existingCustomerByEmail.metadata,
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
        },
      });

      await db.tenant.update({
        where: { id: tenant.id },
        data: {
          stripeCustomerId: existingCustomerByEmail.id,
        },
      });

      return existingCustomerByEmail.id;
    }
  }

  const customer = await stripe.customers.create({
    name: tenant.name,
    email: tenant.email ?? undefined,
    phone: tenant.phone ?? undefined,
    metadata: {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    },
  });

  await db.tenant.update({
    where: { id: tenant.id },
    data: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

export async function createCheckoutSession({
  tenantId,
  planId,
  referralCode,
  customerEmail,
}: {
  tenantId: string;
  planId: string;
  referralCode?: string;
  customerEmail?: string;
}) {
  const [tenant, plan] = await Promise.all([
    getTenantForBilling(tenantId),
    db.plan.findUnique({
      where: { id: planId },
    }),
  ]);

  if (!plan || !plan.isActive) {
    throw new Error("Plano indisponível para assinatura.");
  }

  if (!plan.stripePriceId) {
    throw new Error("Este plano ainda não foi configurado no Stripe.");
  }

  if (
    tenant.subscription &&
    !["CANCELED", "INCOMPLETE_EXPIRED"].includes(tenant.subscription.status)
  ) {
    throw new Error(
      "Este tenant já possui uma assinatura em andamento. Use o portal de cobrança para gerenciar alterações."
    );
  }

  const resolvedReferral = await resolveCheckoutReferral(tenant, referralCode);
  const stripeCustomerId =
    tenant.stripeCustomerId || (await createStripeCustomer(tenant));

  await ensureStripeCustomerEmail(stripeCustomerId, customerEmail ?? tenant.email);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: tenant.id,
    success_url: `${getAppUrl()}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/assinar?canceled=1`,
    allow_promotion_codes: false,
    billing_address_collection: "auto",
    payment_method_collection: "always",
    payment_method_types: getStripeCheckoutPaymentMethodTypes(),
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    metadata: {
      tenantId: tenant.id,
      planId: plan.id,
      ...(resolvedReferral ? { referralCode: resolvedReferral.code } : {}),
    },
    discounts: resolvedReferral?.stripePromotionCodeId
      ? [
          {
            promotion_code: resolvedReferral.stripePromotionCodeId,
          },
        ]
      : undefined,
    subscription_data: {
      trial_period_days: plan.trialDays,
      metadata: {
        tenantId: tenant.id,
        planId: plan.id,
        ...(resolvedReferral ? { referralCode: resolvedReferral.code } : {}),
      },
    },
  });

  return {
    id: session.id,
    url: session.url,
    guestDiscountPercent: resolvedReferral ? getGuestReferralDiscountPercent() : null,
  };
}

export async function createTrialSubscription({
  tenantId,
  planId,
  referralCode,
  customerEmail,
}: {
  tenantId: string;
  planId: string;
  referralCode?: string;
  customerEmail?: string;
}) {
  const [tenant, plan] = await Promise.all([
    getTenantForBilling(tenantId),
    db.plan.findUnique({
      where: { id: planId },
    }),
  ]);

  if (!plan || !plan.isActive) {
    throw new Error("Plano indisponível para assinatura.");
  }

  if (!plan.stripePriceId) {
    throw new Error("Este plano ainda não foi configurado no Stripe.");
  }

  if (
    tenant.subscription &&
    !["CANCELED", "INCOMPLETE_EXPIRED"].includes(tenant.subscription.status)
  ) {
    throw new Error(
      "Este tenant já possui uma assinatura em andamento. Use o portal de cobrança para gerenciar alterações."
    );
  }

  const resolvedReferral = await resolveCheckoutReferral(tenant, referralCode);
  const stripeCustomerId =
    tenant.stripeCustomerId || (await createStripeCustomer(tenant));

  await ensureStripeCustomerEmail(stripeCustomerId, customerEmail ?? tenant.email);

  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    trial_period_days: plan.trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    trial_settings: {
      end_behavior: {
        missing_payment_method: "cancel",
      },
    },
    metadata: {
      tenantId: tenant.id,
      planId: plan.id,
      planSlug: plan.slug,
      ...(resolvedReferral ? { referralCode: resolvedReferral.code } : {}),
    },
    discounts: resolvedReferral?.stripeCouponId
      ? [
          {
            coupon: resolvedReferral.stripeCouponId,
          },
        ]
      : undefined,
  });

  const localSubscription = await syncSubscriptionFromStripe(stripeSubscription);

  await trackServerEvent({
    eventName: "trial_started",
    tenantId: tenant.id,
    email: customerEmail ?? tenant.email,
    eventSourceUrl: buildAppEventUrl(`/cadastro?plan=${plan.slug}`),
    customData: {
      plan_slug: plan.slug,
      value: Number(plan.priceMonthly),
      currency: "BRL",
    },
  });

  if (resolvedReferral) {
    await registerReferralUse({
      referralCode: resolvedReferral.code,
      referredTenantId: tenant.id,
    });
  }

  return {
    subscription: localSubscription,
    onboardingUrl: `${getAppUrl()}/onboarding`,
    guestDiscountPercent: resolvedReferral ? getGuestReferralDiscountPercent() : null,
  };
}

export async function createBillingPortalSession(tenantId: string, returnUrl?: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      stripeCustomerId: true,
      subscription: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  const stripeCustomerId =
    tenant.subscription?.stripeCustomerId ?? tenant.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    throw new Error("Nenhum customer Stripe vinculado a este tenant.");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl || `${getAppUrl()}/configuracoes/assinatura`,
  });

  return session;
}

export async function syncSubscriptionFromStripe(stripeSubscription: Stripe.Subscription) {
  const tenantId = await resolveTenantIdFromStripeSubscription(stripeSubscription);
  const stripeCustomerId = getStripeObjectId(stripeSubscription.customer);
  const stripePriceId = stripeSubscription.items.data[0]?.price?.id;
  const currentPeriod = getStripeSubscriptionCurrentPeriod(stripeSubscription);
  const mappedStatus = mapStripeSubscriptionStatus(stripeSubscription.status);

  if (!tenantId) {
    throw new Error(
      `Não foi possível resolver o tenant da assinatura Stripe ${stripeSubscription.id}.`
    );
  }

  if (!stripeCustomerId) {
    throw new Error(
      `Não foi possível resolver o customer da assinatura Stripe ${stripeSubscription.id}.`
    );
  }

  if (!stripePriceId) {
    throw new Error(
      `Não foi possível resolver o price da assinatura Stripe ${stripeSubscription.id}.`
    );
  }

  const plan = await db.plan.findFirst({
    where: {
      stripePriceId,
    },
    select: {
      id: true,
    },
  });

  if (!plan) {
    throw new Error(`Nenhum plano local encontrado para o price ${stripePriceId}.`);
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      stripeCustomerId,
      ...(mappedStatus === "TRIALING" || mappedStatus === "ACTIVE"
        ? {
            isActive: true,
            lifecycleStatus: "ACTIVE",
          }
        : {}),
    },
  });

  return db.subscription.upsert({
    where: { tenantId },
    update: {
      planId: plan.id,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      status: mappedStatus,
      currentPeriodStart: currentPeriod.start,
      currentPeriodEnd: currentPeriod.end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeTimestampToDate(stripeSubscription.canceled_at),
      trialStart: stripeTimestampToDate(stripeSubscription.trial_start),
      trialEnd: stripeTimestampToDate(stripeSubscription.trial_end),
      defaultPaymentMethod: getStripeObjectId(stripeSubscription.default_payment_method),
    },
    create: {
      tenantId,
      planId: plan.id,
      stripeCustomerId,
      stripeSubscriptionId: stripeSubscription.id,
      status: mappedStatus,
      currentPeriodStart: currentPeriod.start,
      currentPeriodEnd: currentPeriod.end,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      canceledAt: stripeTimestampToDate(stripeSubscription.canceled_at),
      trialStart: stripeTimestampToDate(stripeSubscription.trial_start),
      trialEnd: stripeTimestampToDate(stripeSubscription.trial_end),
      defaultPaymentMethod: getStripeObjectId(stripeSubscription.default_payment_method),
    },
    include: {
      plan: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function syncInvoiceFromStripe(stripeInvoice: Stripe.Invoice) {
  const localSubscription = await resolveLocalSubscriptionForInvoice(stripeInvoice);

  if (!localSubscription) {
    return null;
  }

  const period = getInvoicePeriod(stripeInvoice);

  return db.invoice.upsert({
    where: { stripeInvoiceId: stripeInvoice.id },
    update: {
      subscriptionId: localSubscription.id,
      status: mapStripeInvoiceStatus(stripeInvoice.status),
      amountDue: stripeAmountToDecimal(stripeInvoice.amount_due),
      amountPaid: stripeAmountToDecimal(stripeInvoice.amount_paid),
      currency: stripeInvoice.currency,
      hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
      pdfUrl: stripeInvoice.invoice_pdf,
      periodStart: period.start,
      periodEnd: period.end,
      paidAt: stripeTimestampToDate(stripeInvoice.status_transitions?.paid_at ?? null),
    },
    create: {
      subscriptionId: localSubscription.id,
      stripeInvoiceId: stripeInvoice.id,
      status: mapStripeInvoiceStatus(stripeInvoice.status),
      amountDue: stripeAmountToDecimal(stripeInvoice.amount_due),
      amountPaid: stripeAmountToDecimal(stripeInvoice.amount_paid),
      currency: stripeInvoice.currency,
      hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
      pdfUrl: stripeInvoice.invoice_pdf,
      periodStart: period.start,
      periodEnd: period.end,
      paidAt: stripeTimestampToDate(stripeInvoice.status_transitions?.paid_at ?? null),
    },
    include: {
      subscription: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getSubscriptionStatus(
  tenantId: string
): Promise<TenantSubscriptionAccess> {
  const incompleteGraceWindowMs = 5 * 60 * 1000;
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      billingBypassEnabled: true,
      billingBypassReason: true,
      billingBypassUpdatedAt: true,
      subscription: {
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  const subscriptionStatus = tenant.subscription?.status;
  const hasSubscriptionAccess =
    subscriptionStatus === "TRIALING" || subscriptionStatus === "ACTIVE";
  const hasAccess = hasSubscriptionAccess || tenant.billingBypassEnabled;

  if (!tenant.subscription) {
    return {
      hasAccess,
      status: "NONE",
      reason: tenant.billingBypassEnabled
        ? "Acesso sem cobrança habilitado manualmente pela Receps."
        : "Nenhuma assinatura ativa encontrada para este tenant.",
      accessSource: tenant.billingBypassEnabled ? "BILLING_BYPASS" : "NONE",
      billingBypassEnabled: tenant.billingBypassEnabled,
      billingBypassReason: tenant.billingBypassReason,
      billingBypassUpdatedAt: tenant.billingBypassUpdatedAt,
      isProcessing: false,
      shouldPoll: false,
    };
  }

  const resolvedSubscriptionStatus = tenant.subscription.status;
  const lastSubscriptionChangeAt =
    tenant.subscription.updatedAt ?? tenant.subscription.createdAt;
  const isRecentIncomplete =
    resolvedSubscriptionStatus === "INCOMPLETE" &&
    Date.now() - lastSubscriptionChangeAt.getTime() <= incompleteGraceWindowMs;
  const hasBlockingIncomplete = resolvedSubscriptionStatus === "INCOMPLETE" && !isRecentIncomplete;

  return {
    hasAccess,
    status: resolvedSubscriptionStatus,
    reason:
      tenant.billingBypassEnabled && !hasSubscriptionAccess
        ? "Acesso sem cobrança habilitado manualmente pela Receps."
        : isRecentIncomplete
          ? "Estamos processando o seu pagamento. Isso costuma levar só alguns instantes."
          : hasBlockingIncomplete
            ? "Não conseguimos confirmar seu pagamento. Entre em contato para continuar."
            : getActiveSubscriptionReason(resolvedSubscriptionStatus),
    accessSource: hasSubscriptionAccess
      ? "SUBSCRIPTION"
      : tenant.billingBypassEnabled
        ? "BILLING_BYPASS"
        : "NONE",
    billingBypassEnabled: tenant.billingBypassEnabled,
    billingBypassReason: tenant.billingBypassReason,
    billingBypassUpdatedAt: tenant.billingBypassUpdatedAt,
    isProcessing: isRecentIncomplete,
    shouldPoll: isRecentIncomplete,
  };
}

export async function maybeReserveNextReferralRewardForInvoice(
  stripeInvoice: Stripe.Invoice
) {
  const stripeSubscriptionId = getStripeInvoiceSubscriptionId(stripeInvoice);

  if (!stripeSubscriptionId) {
    return {
      action: "skipped",
      reason: "invoice_without_subscription",
    };
  }

  if ((stripeInvoice.amount_due ?? 0) <= 0 && (stripeInvoice.subtotal ?? 0) <= 0) {
    return {
      action: "skipped",
      reason: "invoice_without_amount",
    };
  }

  if ((stripeInvoice.discounts?.length ?? 0) > 0) {
    return {
      action: "skipped",
      reason: "invoice_already_discounted",
    };
  }

  const subscription = await resolveLocalSubscriptionForInvoice(stripeInvoice);

  if (!subscription) {
    return {
      action: "skipped",
      reason: "local_subscription_not_found",
    };
  }

  const reward = await reserveOldestPendingRewardForInvoice(
    subscription.tenantId,
    stripeInvoice.id
  );

  if (!reward?.stripeCouponId) {
    return {
      action: "skipped",
      reason: "no_pending_reward",
    };
  }

  try {
    const stripe = getStripe();
    await stripe.invoices.update(stripeInvoice.id, {
      discounts: [{ coupon: reward.stripeCouponId }],
    });

    return {
      action: "reserved",
      rewardId: reward.id,
      stripeCouponId: reward.stripeCouponId,
    };
  } catch (error) {
    await releaseReservedReward(stripeInvoice.id);

    return {
      action: "released",
      reason:
        error instanceof Error
          ? error.message
          : "Falha ao aplicar reward reservado na invoice.",
    };
  }
}

export async function getCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer"],
  });
}

export async function getTenantBillingDashboardData(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    include: {
      subscription: {
        include: {
          plan: true,
          invoices: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 12,
          },
        },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  const access = await getSubscriptionStatus(tenantId);
  const defaultPaymentMethod = await getDefaultPaymentMethodSummary(
    tenant.subscription?.defaultPaymentMethod
  );

  return {
    tenant,
    access,
    defaultPaymentMethod,
  };
}

export async function markReservedRewardAsApplied(stripeInvoiceId: string) {
  return applyReservedRewardAfterInvoicePaid(stripeInvoiceId);
}

export async function revertReservedReward(stripeInvoiceId: string) {
  return releaseReservedReward(stripeInvoiceId);
}
