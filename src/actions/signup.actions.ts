"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { startUserSession } from "@/lib/auth-session";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral-cookie";
import { TENANT_MODULE_VALUES } from "@/lib/tenant-modules";
import { getDefaultCustomPermissions } from "@/lib/tenant-permissions";
import { signupSchema, type SignupInput } from "@/lib/validators/signup";
import {
  createStripeCustomer,
  createTrialSubscription,
} from "@/services/billing.service";
import { ensureDefaultFinancialAccount } from "@/services/onboarding.service";
import { getReferralByCode } from "@/services/referral.service";

function getReferralCookieOptions() {
  const secure =
    process.env.NEXTAUTH_URL?.startsWith("https://") ?? Boolean(process.env.VERCEL);

  return {
    path: "/",
    sameSite: "lax" as const,
    secure,
    httpOnly: false,
  };
}

function slugify(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "tenant";
}

async function generateUniqueTenantSlug(businessName: string) {
  const baseSlug = slugify(businessName);
  let candidate = baseSlug;
  let attempt = 1;

  while (
    await db.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    attempt += 1;
    candidate = `${baseSlug}-${attempt}`;
  }

  return candidate;
}

type SignupResult =
  | { success: true; redirectUrl: string }
  | { success: false; error: string };

export async function signupAction(input: {
  businessName: string;
  cnpj: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  planSlug: string;
  referralCode?: string;
}): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Não foi possível validar seus dados.",
    };
  }

  const data = parsed.data;
  let createdTenantId: string | null = null;

  try {
    const [plan, existingUser, existingTenantByCnpj, validatedReferral] = await Promise.all([
      db.plan.findFirst({
        where: {
          slug: data.planSlug,
          isActive: true,
        },
        select: {
          id: true,
          slug: true,
          stripePriceId: true,
        },
      }),
      db.user.findUnique({
        where: { email: data.email },
        select: { id: true },
      }),
      db.tenant.findFirst({
        where: { cnpj: data.cnpj },
        select: { id: true },
      }),
      data.referralCode ? getReferralByCode(data.referralCode) : null,
    ]);

    if (!plan) {
      return {
        success: false,
        error: "Plano inválido. Escolha um plano disponível para continuar.",
      };
    }

    if (!plan.stripePriceId) {
      return {
        success: false,
        error: "Este plano ainda não está pronto para assinatura.",
      };
    }

    if (existingUser) {
      return {
        success: false,
        error: "Já existe uma conta com esse email. Faça login pra continuar assinatura.",
      };
    }

    if (existingTenantByCnpj) {
      return {
        success: false,
        error: "Esse CNPJ já tem conta no Receps. Faça login pra continuar.",
      };
    }

    if (data.referralCode && !validatedReferral) {
      return {
        success: false,
        error: "Código de indicação inválido.",
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const customPermissions = getDefaultCustomPermissions("ADMIN");
    const tenantSlug = await generateUniqueTenantSlug(data.businessName);

    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.businessName.trim(),
          slug: tenantSlug,
          source: "LEAD",
          lifecycleStatus: "INCOMPLETE",
          isActive: true,
          cnpj: data.cnpj,
          email: data.email,
          phone: data.phone,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          cnpj: true,
          email: true,
          phone: true,
          stripeCustomerId: true,
          referredByCode: true,
          referredByTenantId: true,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.ownerName.trim(),
          email: data.email,
          phone: data.phone,
          passwordHash,
          role: "ADMIN",
          customPermissions,
        },
        select: {
          id: true,
          tenantId: true,
          name: true,
          email: true,
          role: true,
          globalRole: true,
        },
      });

      await tx.userModulePermission.createMany({
        data: TENANT_MODULE_VALUES.map((module) => ({
          userId: user.id,
          module,
          isAllowed: true,
        })),
      });

      await ensureDefaultFinancialAccount(tenant.id, tx);

      return {
        tenant,
        user,
        planId: plan.id,
        referralCode: validatedReferral?.code,
      };
    });

    createdTenantId = result.tenant.id;

    await createStripeCustomer(result.tenant);

    await createTrialSubscription({
      tenantId: result.tenant.id,
      planId: result.planId,
      referralCode: result.referralCode,
      customerEmail: result.user.email,
    });

    await startUserSession(result.user);

    const cookieStore = await cookies();
    cookieStore.set(REFERRAL_COOKIE_NAME, "", {
      ...getReferralCookieOptions(),
      maxAge: 0,
    });

    return {
      success: true,
      redirectUrl: "/onboarding",
    };
  } catch (error) {
    console.error("[signupAction]", error);

    if (createdTenantId) {
      try {
        await db.tenant.delete({
          where: { id: createdTenantId },
        });
      } catch (cleanupError) {
        console.error("[signupAction][cleanup]", cleanupError);
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível criar sua conta agora. Tente novamente em instantes.",
    };
  }
}

export async function signupAndCreateCheckoutAction(
  input: SignupInput & {
    businessName: string;
  }
) {
  return signupAction(input);
}
