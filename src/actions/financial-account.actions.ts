"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/session";
import {
  createFinancialAccountSchema,
  deactivateFinancialAccountSchema,
} from "@/lib/validators/financial";
import {
  createFinancialAccount,
  deactivateFinancialAccount,
} from "@/services/financial-account.service";
import type { ActionResult } from "@/types";

function revalidateFinancialAccountConsumers() {
  revalidatePath("/configuracoes/contas");
  revalidatePath("/agenda");
  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro/comissoes");
  revalidatePath("/financeiro/despesas");
}

export async function createFinancialAccountAction(data: {
  name: string;
  type?: "CASH" | "BANK" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "OTHER";
  initialBalance?: number;
}): Promise<ActionResult<{ accountId: string }>> {
  const user = await requireAdmin();
  const parsed = createFinancialAccountSchema.safeParse({
    ...data,
    initialBalance: data.initialBalance ?? 0,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  const result = await createFinancialAccount(user.tenantId, parsed.data);

  if (result.success) {
    revalidateFinancialAccountConsumers();
  }

  return result;
}

export async function deactivateFinancialAccountAction(
  accountId: string
): Promise<ActionResult<{ accountId: string }>> {
  const user = await requireAdmin();
  const parsed = deactivateFinancialAccountSchema.safeParse({ accountId });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Conta invalida." };
  }

  const result = await deactivateFinancialAccount(user.tenantId, parsed.data);

  if (result.success) {
    revalidateFinancialAccountConsumers();
  }

  return result;
}
