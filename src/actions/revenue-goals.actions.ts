"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getEffectiveUserForPermissions } from "@/lib/active-user";
import { requireAuth, requirePermission } from "@/lib/session";
import { buildUserSnapshot } from "@/lib/audit";
import { upsertRevenueGoal } from "@/services/revenue-goal.service";
import type { ActionResult } from "@/types";

const setRevenueGoalSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/u, "Selecione um mês válido (YYYY-MM)."),
  targetAmount: z
    .number({ error: "Informe um valor numérico." })
    .finite("Valor inválido.")
    .positive("Meta deve ser maior que zero."),
});

export async function setRevenueGoalAction(
  data: unknown
): Promise<ActionResult<{ month: string }>> {
  const session = await requirePermission("financeiro.geral", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();
  const parsed = setRevenueGoalSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const saved = await upsertRevenueGoal({
      tenantId: session.tenantId,
      month: parsed.data.month,
      targetAmount: parsed.data.targetAmount,
      userId: effectiveUser.id,
      actor: buildUserSnapshot(effectiveUser),
    });
    revalidatePath("/financeiro");
    return { success: true, data: { month: saved.month } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao salvar a meta de faturamento.",
    };
  }
}
