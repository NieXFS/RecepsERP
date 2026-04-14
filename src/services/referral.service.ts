import { randomInt } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getAppUrl, getStripe } from "@/lib/stripe";

type PrismaTransaction = Prisma.TransactionClient;

const GUEST_REFERRAL_DISCOUNT_PERCENT = 15;
const REFERRER_REWARD_DISCOUNT_PERCENT = 40;
const REFERRAL_CODE_ATTEMPTS = 25;

function normalizeReferralCode(code: string) {
  return code.trim().toUpperCase();
}

function buildReferralCodePrefix(tenantSlug: string) {
  const sanitizedSlug = tenantSlug
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  return sanitizedSlug || "RECEPS";
}

async function getReferralByCodeTx(
  code: string,
  tx: PrismaTransaction | typeof db = db
) {
  return tx.referral.findFirst({
    where: {
      code: {
        equals: normalizeReferralCode(code),
        mode: "insensitive",
      },
    },
    include: {
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

async function createGuestReferralArtifacts(tenantId: string, referralCode: string) {
  const stripe = getStripe();

  const coupon = await stripe.coupons.create({
    duration: "once",
    percent_off: GUEST_REFERRAL_DISCOUNT_PERCENT,
    metadata: {
      kind: "guest_referral_discount",
      tenantId,
      referralCode,
    },
  });

  const promotionCode = await stripe.promotionCodes.create({
    code: referralCode,
    promotion: {
      type: "coupon",
      coupon: coupon.id,
    },
    metadata: {
      kind: "guest_referral_discount",
      tenantId,
      referralCode,
    },
  });

  return {
    couponId: coupon.id,
    promotionCodeId: promotionCode.id,
  };
}

export async function generateReferralCode(tenantSlug: string) {
  const prefix = buildReferralCodePrefix(tenantSlug);

  for (let attempt = 0; attempt < REFERRAL_CODE_ATTEMPTS; attempt += 1) {
    const suffix = randomInt(1000, 10000).toString();
    const code = `${prefix}-${suffix}`;
    const existingReferral = await db.referral.findUnique({
      where: { code },
      select: { id: true },
    });

    if (!existingReferral) {
      return code;
    }
  }

  throw new Error("Não foi possível gerar um código de indicação único.");
}

export async function createReferralForTenant(tenantId: string) {
  const existingReferral = await db.referral.findUnique({
    where: { tenantId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (existingReferral?.stripeCouponId && existingReferral.stripePromotionCodeId) {
    return existingReferral;
  }

  const tenant = existingReferral?.tenant
    ? existingReferral.tenant
    : await db.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

  if (!tenant) {
    throw new Error("Tenant não encontrado para criação do referral.");
  }

  const referralCode = existingReferral?.code ?? (await generateReferralCode(tenant.slug));
  const artifacts = await createGuestReferralArtifacts(tenant.id, referralCode);

  const referral = existingReferral
    ? await db.referral.update({
        where: { id: existingReferral.id },
        data: {
          code: referralCode,
          stripeCouponId: artifacts.couponId,
          stripePromotionCodeId: artifacts.promotionCodeId,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })
    : await db.referral.create({
        data: {
          tenantId: tenant.id,
          code: referralCode,
          stripeCouponId: artifacts.couponId,
          stripePromotionCodeId: artifacts.promotionCodeId,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

  return referral;
}

export async function getReferralByCode(code: string) {
  return getReferralByCodeTx(code);
}

export async function registerReferralUse({
  referralCode,
  referredTenantId,
}: {
  referralCode: string;
  referredTenantId: string;
}) {
  return db.$transaction(async (tx) => {
    const [referredTenant, referral] = await Promise.all([
      tx.tenant.findUnique({
        where: { id: referredTenantId },
        select: {
          id: true,
          slug: true,
          referredByCode: true,
          referredByTenantId: true,
        },
      }),
      getReferralByCodeTx(referralCode, tx),
    ]);

    if (!referredTenant) {
      throw new Error("Tenant indicado não encontrado.");
    }

    if (!referral) {
      throw new Error("Código de indicação inválido.");
    }

    if (referral.tenantId === referredTenant.id) {
      throw new Error("Autoindicação não é permitida.");
    }

    if (
      referredTenant.referredByTenantId &&
      referredTenant.referredByTenantId !== referral.tenantId
    ) {
      throw new Error("Este tenant já está vinculado a outra indicação.");
    }

    if (referredTenant.referredByCode && referredTenant.referredByCode !== referral.code) {
      throw new Error("Este tenant já está vinculado a outro código de indicação.");
    }

    if (
      referredTenant.referredByTenantId === referral.tenantId &&
      referredTenant.referredByCode === referral.code
    ) {
      return referral;
    }

    await Promise.all([
      tx.tenant.update({
        where: { id: referredTenant.id },
        data: {
          referredByCode: referral.code,
          referredByTenantId: referral.tenantId,
        },
      }),
      tx.referral.update({
        where: { id: referral.id },
        data: {
          totalInvited: {
            increment: 1,
          },
        },
      }),
    ]);

    return referral;
  });
}

export async function convertReferralReward(referredTenantId: string) {
  return db.$transaction(async (tx) => {
    const referredTenant = await tx.tenant.findUnique({
      where: { id: referredTenantId },
      select: {
        id: true,
        referredByCode: true,
        referredByTenantId: true,
      },
    });

    if (!referredTenant?.referredByCode || !referredTenant.referredByTenantId) {
      return null;
    }

    const existingReward = await tx.referralReward.findUnique({
      where: { referredTenantId: referredTenant.id },
    });

    if (existingReward) {
      return existingReward;
    }

    const referral = await tx.referral.findFirst({
      where: {
        tenantId: referredTenant.referredByTenantId,
        code: {
          equals: referredTenant.referredByCode,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (!referral) {
      return null;
    }

    const reward = await tx.referralReward.create({
      data: {
        referralId: referral.id,
        referredTenantId: referredTenant.id,
        discountPercent: REFERRER_REWARD_DISCOUNT_PERCENT,
        status: "PENDING",
      },
    });

    await tx.referral.update({
      where: { id: referral.id },
      data: {
        totalConverted: {
          increment: 1,
        },
      },
    });

    return reward;
  });
}

export async function reserveOldestPendingRewardForInvoice(
  tenantId: string,
  stripeInvoiceId: string
) {
  const referral = await db.referral.findUnique({
    where: { tenantId },
    select: {
      id: true,
      code: true,
      tenantId: true,
    },
  });

  if (!referral) {
    return null;
  }

  const invoiceAlreadyLinked = await db.referralReward.findFirst({
    where: {
      OR: [
        { reservedInvoiceId: stripeInvoiceId },
        { appliedToInvoiceId: stripeInvoiceId },
      ],
    },
    select: {
      id: true,
      status: true,
      stripeCouponId: true,
      discountPercent: true,
      referredTenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (invoiceAlreadyLinked) {
    return invoiceAlreadyLinked;
  }

  const pendingReward = await db.referralReward.findFirst({
    where: {
      referralId: referral.id,
      status: "PENDING",
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      referredTenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!pendingReward) {
    return null;
  }

  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    duration: "once",
    percent_off: pendingReward.discountPercent,
    metadata: {
      kind: "referrer_reward",
      tenantId,
      referralId: referral.id,
      rewardId: pendingReward.id,
      stripeInvoiceId,
      referredTenantId: pendingReward.referredTenantId,
    },
  });

  const now = new Date();
  const updateResult = await db.referralReward.updateMany({
    where: {
      id: pendingReward.id,
      status: "PENDING",
      reservedInvoiceId: null,
    },
    data: {
      status: "RESERVED",
      stripeCouponId: coupon.id,
      reservedInvoiceId: stripeInvoiceId,
      reservedAt: now,
      appliedToInvoiceId: null,
      appliedAt: null,
    },
  });

  if (updateResult.count === 0) {
    return null;
  }

  return db.referralReward.findUnique({
    where: { id: pendingReward.id },
    include: {
      referredTenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function applyReservedRewardAfterInvoicePaid(stripeInvoiceId: string) {
  const reward = await db.referralReward.findFirst({
    where: {
      reservedInvoiceId: stripeInvoiceId,
      status: "RESERVED",
    },
    select: {
      id: true,
    },
  });

  if (!reward) {
    return null;
  }

  return db.referralReward.update({
    where: { id: reward.id },
    data: {
      status: "APPLIED",
      appliedToInvoiceId: stripeInvoiceId,
      appliedAt: new Date(),
    },
  });
}

export async function releaseReservedReward(stripeInvoiceId: string) {
  const reward = await db.referralReward.findFirst({
    where: {
      reservedInvoiceId: stripeInvoiceId,
      status: "RESERVED",
    },
    select: {
      id: true,
    },
  });

  if (!reward) {
    return null;
  }

  return db.referralReward.update({
    where: { id: reward.id },
    data: {
      status: "PENDING",
      stripeCouponId: null,
      reservedInvoiceId: null,
      reservedAt: null,
      appliedToInvoiceId: null,
      appliedAt: null,
    },
  });
}

export async function getReferralDashboardData(tenantId: string) {
  const referral = await createReferralForTenant(tenantId);
  const referralWithRewards = await db.referral.findUnique({
    where: { id: referral.id },
    include: {
      rewards: {
        include: {
          referredTenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!referralWithRewards) {
    throw new Error("Referral não encontrado.");
  }

  const pendingRewards = referralWithRewards.rewards.filter(
    (reward) => reward.status === "PENDING" || reward.status === "RESERVED"
  ).length;
  const appliedRewards = referralWithRewards.rewards.filter(
    (reward) => reward.status === "APPLIED"
  ).length;

  return {
    referral: referralWithRewards,
    code: referralWithRewards.code,
    shareUrl: `${getAppUrl()}/assinar?ref=${encodeURIComponent(referralWithRewards.code)}`,
    metrics: {
      totalInvited: referralWithRewards.totalInvited,
      totalConverted: referralWithRewards.totalConverted,
      pendingRewards,
      appliedRewards,
    },
  };
}

export function getGuestReferralDiscountPercent() {
  return GUEST_REFERRAL_DISCOUNT_PERCENT;
}
