"use server";

import { revalidatePath } from "next/cache";
import { billingPlanSchema } from "@/lib/validators/billing";
import { requireSuperAdmin } from "@/lib/session";
import {
  savePlan,
  togglePlanActive,
  togglePlanFeatured,
} from "@/services/billing.service";
import type { ActionResult } from "@/types";

function revalidateBillingAdminPaths() {
  revalidatePath("/painel-receps/planos");
  revalidatePath("/assinar");
  revalidatePath("/api/billing/plans");
}

function parseFeaturesText(featuresText: string) {
  try {
    const parsed = JSON.parse(featuresText);

    if (parsed === null || typeof parsed === "undefined") {
      throw new Error("As features precisam ser um JSON válido.");
    }

    return parsed;
  } catch {
    throw new Error("As features precisam ser um JSON válido.");
  }
}

export async function saveBillingPlanAction(input: {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  priceMonthly: number;
  currency: string;
  trialDays: number;
  maxUsers?: number;
  maxAppointmentsMonth?: number;
  featuresText: string;
  stripeProductId?: string;
  stripePriceId?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}): Promise<ActionResult<{ planId: string }>> {
  await requireSuperAdmin();

  const parsed = billingPlanSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const plan = await savePlan({
      id: parsed.data.id,
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      priceMonthly: parsed.data.priceMonthly,
      currency: parsed.data.currency,
      trialDays: parsed.data.trialDays,
      maxUsers: parsed.data.maxUsers,
      maxAppointmentsMonth: parsed.data.maxAppointmentsMonth,
      features: parseFeaturesText(parsed.data.featuresText),
      stripeProductId: parsed.data.stripeProductId,
      stripePriceId: parsed.data.stripePriceId,
      isActive: parsed.data.isActive,
      isFeatured: parsed.data.isFeatured,
      sortOrder: parsed.data.sortOrder,
    });

    revalidateBillingAdminPaths();

    return {
      success: true,
      data: {
        planId: plan.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o plano.",
    };
  }
}

export async function toggleBillingPlanActiveAction(
  planId: string
): Promise<ActionResult<{ planId: string }>> {
  await requireSuperAdmin();

  try {
    const plan = await togglePlanActive(planId);
    revalidateBillingAdminPaths();

    return {
      success: true,
      data: {
        planId: plan.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status do plano.",
    };
  }
}

export async function toggleBillingPlanFeaturedAction(
  planId: string
): Promise<ActionResult<{ planId: string }>> {
  await requireSuperAdmin();

  try {
    const plan = await togglePlanFeatured(planId);
    revalidateBillingAdminPaths();

    return {
      success: true,
      data: {
        planId: plan.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o destaque do plano.",
    };
  }
}
