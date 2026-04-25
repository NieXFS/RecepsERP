"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getEffectiveUserForPermissions } from "@/lib/active-user";
import { requireAuth, requirePermission } from "@/lib/session";
import { buildUserSnapshot } from "@/lib/audit";
import { createCommissionPayout } from "@/services/commission-payout.service";
import type { ActionResult } from "@/types";

const createPayoutSchema = z.object({
  commissionIds: z
    .array(z.string().min(1))
    .min(1, "Selecione ao menos uma comissão."),
  financialAccountId: z.string().min(1, "Selecione a conta financeira."),
  paidAt: z
    .union([z.string().datetime(), z.date()])
    .optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Server Action: cria um acerto em lote. Marca comissões como pagas, gera o
 * CommissionPayout agrupador e a Transaction EXPENSE na conta escolhida.
 */
export async function createCommissionPayoutAction(
  data: unknown
): Promise<ActionResult<{ payoutId: string }>> {
  const session = await requirePermission("financeiro.comissoes", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();
  const parsed = createPayoutSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  try {
    const paidAt = parsed.data.paidAt
      ? typeof parsed.data.paidAt === "string"
        ? new Date(parsed.data.paidAt)
        : parsed.data.paidAt
      : undefined;

    const { payoutId } = await createCommissionPayout({
      tenantId: session.tenantId,
      userId: effectiveUser.id,
      commissionIds: parsed.data.commissionIds,
      financialAccountId: parsed.data.financialAccountId,
      paidAt,
      notes: parsed.data.notes,
      actor: buildUserSnapshot(effectiveUser),
    });

    revalidatePath("/financeiro/comissoes");
    revalidatePath("/financeiro");

    return { success: true, data: { payoutId } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao fechar o acerto de comissões.",
    };
  }
}
