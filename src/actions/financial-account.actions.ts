"use server";

import { revalidatePath } from "next/cache";
import {
  isMasterRequiredError,
  MASTER_REQUIRED_MESSAGE,
  requireMasterSession,
} from "@/lib/active-user";
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

type MasterErrorResult = { success: false; error: string };

async function ensureMasterForSensitiveAction(): Promise<MasterErrorResult | null> {
  try {
    await requireMasterSession();
    return null;
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return { success: false, error: MASTER_REQUIRED_MESSAGE };
    }

    throw error;
  }
}

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
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

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
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

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
