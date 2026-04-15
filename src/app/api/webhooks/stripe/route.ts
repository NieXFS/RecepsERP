import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe";
import {
  markReservedRewardAsApplied,
  maybeReserveNextReferralRewardForInvoice,
  syncInvoiceFromStripe,
  syncSubscriptionFromStripe,
} from "@/services/billing.service";
import {
  convertReferralReward,
  registerReferralUse,
  releaseReservedReward,
} from "@/services/referral.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function logStripeWebhook(
  level: "info" | "error",
  details: Record<string, unknown>
) {
  const payload = {
    source: "stripe-webhook",
    ...details,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}

async function ensureStripeEventRecord(event: Stripe.Event) {
  try {
    return await db.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return db.stripeEvent.findUnique({
        where: { stripeEventId: event.id },
      });
    }

    throw error;
  }
}

async function markStripeEventProcessed(stripeEventRecordId: string, event: Stripe.Event) {
  await db.stripeEvent.update({
    where: { id: stripeEventRecordId },
    data: {
      type: event.type,
      payload: event as unknown as Prisma.InputJsonValue,
      processed: true,
      processedAt: new Date(),
    },
  });
}

async function maybeConvertReferralRewardForPaidInvoice(stripeInvoice: Stripe.Invoice) {
  const localInvoice = await syncInvoiceFromStripe(stripeInvoice);

  if (!localInvoice || Number(localInvoice.amountPaid) <= 0) {
    return {
      action: "skipped",
      reason: "invoice_not_paid_or_missing",
      tenantId: localInvoice?.subscription.tenant.id ?? null,
    };
  }

  const tenantId = localInvoice.subscription.tenant.id;
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      referredByCode: true,
    },
  });

  if (!tenant?.referredByCode) {
    return {
      action: "skipped",
      reason: "tenant_without_referral_origin",
      tenantId,
    };
  }

  const previousRealPaidInvoices = await db.invoice.count({
    where: {
      subscriptionId: localInvoice.subscriptionId,
      stripeInvoiceId: {
        not: localInvoice.stripeInvoiceId,
      },
      status: "PAID",
      amountPaid: {
        gt: new Prisma.Decimal(0),
      },
    },
  });

  if (previousRealPaidInvoices > 0) {
    return {
      action: "skipped",
      reason: "not_first_real_invoice",
      tenantId,
    };
  }

  const reward = await convertReferralReward(tenantId);

  return {
    action: reward ? "converted" : "skipped",
    reason: reward ? null : "reward_not_created",
    tenantId,
    rewardId: reward?.id ?? null,
  };
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
  const stripe = getStripe();
  const session = event.data.object as Stripe.Checkout.Session;
  const tenantId =
    session.client_reference_id ?? session.metadata?.tenantId ?? null;
  const referralCode = session.metadata?.referralCode ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  if (!stripeSubscriptionId) {
    return {
      action: "skipped",
      tenantId,
      reason: "session_without_subscription",
    };
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  await syncSubscriptionFromStripe(stripeSubscription);

  if (tenantId && referralCode) {
    await registerReferralUse({
      referralCode,
      referredTenantId: tenantId,
    });
  }

  return {
    action: "subscription_synced",
    tenantId,
    referralCode,
  };
}

async function handleInvoiceCreatedOrFinalized(event: Stripe.Event) {
  const stripeInvoice = event.data.object as Stripe.Invoice;
  const localInvoice = await syncInvoiceFromStripe(stripeInvoice);
  const reservation = await maybeReserveNextReferralRewardForInvoice(stripeInvoice);

  return {
    action: reservation.action,
    reason: "reason" in reservation ? reservation.reason : null,
    tenantId: localInvoice?.subscription.tenant.id ?? null,
    stripeInvoiceId: stripeInvoice.id,
  };
}

async function handleInvoicePaid(event: Stripe.Event) {
  const stripeInvoice = event.data.object as Stripe.Invoice;
  const [localInvoice, referralConversion, appliedReward] = await Promise.all([
    syncInvoiceFromStripe(stripeInvoice),
    maybeConvertReferralRewardForPaidInvoice(stripeInvoice),
    markReservedRewardAsApplied(stripeInvoice.id),
  ]);

  return {
    action: "invoice_paid_processed",
    tenantId: localInvoice?.subscription.tenant.id ?? referralConversion.tenantId ?? null,
    stripeInvoiceId: stripeInvoice.id,
    referralAction: referralConversion.action,
    referralReason: referralConversion.reason,
    appliedRewardId: appliedReward?.id ?? null,
  };
}

async function handleInvoiceFailure(event: Stripe.Event) {
  const stripeInvoice = event.data.object as Stripe.Invoice;
  const [localInvoice, releasedReward] = await Promise.all([
    syncInvoiceFromStripe(stripeInvoice),
    releaseReservedReward(stripeInvoice.id),
  ]);

  return {
    action: releasedReward ? "reserved_reward_released" : "invoice_synced",
    tenantId: localInvoice?.subscription.tenant.id ?? null,
    stripeInvoiceId: stripeInvoice.id,
    rewardId: releasedReward?.id ?? null,
  };
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      return handleCheckoutSessionCompleted(event);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const localSubscription = await syncSubscriptionFromStripe(subscription);

      return {
        action: "subscription_synced",
        tenantId: localSubscription.tenant.id,
        stripeSubscriptionId: subscription.id,
      };
    }
    case "invoice.created":
    case "invoice.finalized":
      return handleInvoiceCreatedOrFinalized(event);
    case "invoice.paid":
      return handleInvoicePaid(event);
    case "invoice.payment_failed":
    case "invoice.voided":
    case "invoice.marked_uncollectible":
      return handleInvoiceFailure(event);
    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;

      return {
        action: "trial_will_end_logged",
        tenantId: subscription.metadata?.tenantId ?? null,
        stripeSubscriptionId: subscription.id,
      };
    }
    default:
      return {
        action: "ignored",
        reason: "event_not_handled",
        tenantId: null,
      };
  }
}

export async function POST(request: Request) {
  const stripeSignature = request.headers.get("stripe-signature");

  if (!stripeSignature) {
    return NextResponse.json(
      { error: "Stripe signature ausente." },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      stripeSignature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    logStripeWebhook("error", {
      action: "signature_verification_failed",
      error: error instanceof Error ? error.message : "unknown_signature_error",
    });

    return NextResponse.json(
      {
        error: "Assinatura de webhook inválida.",
      },
      { status: 400 }
    );
  }

  const stripeEventRecord = await ensureStripeEventRecord(event);

  if (!stripeEventRecord) {
    return NextResponse.json(
      {
        error: "Não foi possível registrar o evento Stripe.",
      },
      { status: 500 }
    );
  }

  if (stripeEventRecord.processed) {
    logStripeWebhook("info", {
      type: event.type,
      stripeEventId: event.id,
      tenantId: null,
      action: "duplicate_ignored",
    });

    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const result = await handleStripeEvent(event);

    await markStripeEventProcessed(stripeEventRecord.id, event);

    logStripeWebhook("info", {
      type: event.type,
      stripeEventId: event.id,
      tenantId: result.tenantId ?? null,
      action: result.action,
      reason: "reason" in result ? result.reason ?? null : null,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    logStripeWebhook("error", {
      type: event.type,
      stripeEventId: event.id,
      tenantId: null,
      action: "processing_failed",
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : { message: "unknown_processing_error" },
    });

    return NextResponse.json(
      {
        error: "Falha ao processar webhook Stripe.",
      },
      { status: 500 }
    );
  }
}
