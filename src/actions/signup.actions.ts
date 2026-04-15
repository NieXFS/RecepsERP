"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { TENANT_MODULE_VALUES } from "@/lib/tenant-modules";
import { getDefaultCustomPermissions } from "@/lib/tenant-permissions";
import { startUserSession } from "@/lib/auth-session";
import { REFERRAL_COOKIE_NAME } from "@/lib/referral-cookie";
import { createCheckoutSession, createStripeCustomer } from "@/services/billing.service";
import { ensureDefaultFinancialAccount } from "@/services/onboarding.service";

const signupSchema = z.object({
  clinicName: z.string().trim().min(3, "Informe o nome da clínica."),
  ownerName: z.string().trim().min(2, "Informe o seu nome."),
  email: z.email("Informe um email válido.").transform((value) => value.trim().toLowerCase()),
  phone: z.string().trim().min(10, "Informe um telefone válido."),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  planSlug: z.string().trim().min(1, "Plano inválido."),
  referralCode: z.string().trim().max(64, "Código de indicação inválido.").optional(),
});

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

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Informe um telefone válido.");
  }

  if (digits.startsWith("55")) {
    if (digits.length !== 12 && digits.length !== 13) {
      throw new Error("Informe um telefone brasileiro válido.");
    }

    return `+${digits}`;
  }

  if (digits.length !== 10 && digits.length !== 11) {
    throw new Error("Informe um telefone brasileiro válido.");
  }

  return `+55${digits}`;
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

export async function signupAndCreateCheckoutAction(input: {
  clinicName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  planSlug: string;
  referralCode?: string;
}): Promise<{ success: true; checkoutUrl: string } | { success: false; error: string }> {
  const parsed = signupSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Não foi possível validar seus dados.",
    };
  }

  const data = parsed.data;
  let normalizedPhone: string;

  try {
    normalizedPhone = normalizePhone(data.phone);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Informe um telefone válido.",
    };
  }

  const referralCode = data.referralCode?.trim() || undefined;
  let createdTenantId: string | null = null;

  try {
    const plan = await db.plan.findFirst({
      where: {
        slug: data.planSlug,
        isActive: true,
      },
      select: {
        id: true,
        stripePriceId: true,
      },
    });

    if (!plan) {
      return {
        success: false,
        error: "Plano inválido. Escolha um plano disponível para continuar.",
      };
    }

    if (!plan.stripePriceId) {
      return {
        success: false,
        error: "Este plano ainda não está pronto para checkout.",
      };
    }

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Já existe uma conta com esse email. Faça login pra continuar assinatura.",
      };
    }

    const validatedReferral =
      referralCode
        ? await db.referral.findFirst({
            where: {
              code: {
                equals: referralCode,
                mode: "insensitive",
              },
            },
            select: {
              code: true,
            },
          })
        : null;

    if (referralCode && !validatedReferral) {
      return {
        success: false,
        error: "Código de indicação inválido.",
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const customPermissions = getDefaultCustomPermissions("ADMIN");
    const tenantSlug = await generateUniqueTenantSlug(data.clinicName);

    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.clinicName.trim(),
          slug: tenantSlug,
          source: "MANUAL_INVITE",
          lifecycleStatus: "INCOMPLETE",
          isActive: true,
          email: data.email,
          phone: normalizedPhone,
        },
        select: {
          id: true,
          name: true,
          slug: true,
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
          phone: normalizedPhone,
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

    const checkoutSession = await createCheckoutSession({
      tenantId: result.tenant.id,
      planId: result.planId,
      referralCode: result.referralCode,
      customerEmail: result.user.email,
    });

    if (!checkoutSession.url) {
      throw new Error("Não foi possível gerar o link de pagamento.");
    }

    await startUserSession(result.user);

    const cookieStore = await cookies();
    cookieStore.set(REFERRAL_COOKIE_NAME, "", {
      ...getReferralCookieOptions(),
      maxAge: 0,
    });

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
    };
  } catch (error) {
    console.error("[signupAndCreateCheckoutAction]", error);

    if (createdTenantId) {
      try {
        await db.tenant.delete({
          where: { id: createdTenantId },
        });
      } catch (cleanupError) {
        console.error("[signupAndCreateCheckoutAction][cleanup]", cleanupError);
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
