"use server";

import { requireModuleAccess } from "@/lib/session";
import {
  createExpenseCategorySchema,
  expenseSchema,
  updateExpenseSchema,
} from "@/lib/validators/expenses";
import {
  cancelExpense,
  cancelExpensePayment,
  createExpense,
  createExpenseCategory,
  deleteExpense,
  getExpenseCategories,
  getMonthlyExpenses,
  markExpenseAsPaid,
  updateExpense,
} from "@/services/expense.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: lista as categorias disponíveis do tenant autenticado.
 */
export async function getExpenseCategoriesAction() {
  const session = await requireModuleAccess("COMISSOES");
  return getExpenseCategories(session.tenantId);
}

/**
 * Server Action: cria uma categoria customizada de despesa para o tenant.
 */
export async function createExpenseCategoryAction(
  data: unknown
): Promise<ActionResult<{ categoryId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  const parsed = createExpenseCategorySchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  return createExpenseCategory(session.tenantId, parsed.data);
}

/**
 * Server Action: retorna o resumo mensal das despesas do tenant.
 */
export async function getMonthlyExpensesAction(month: number, year: number) {
  const session = await requireModuleAccess("COMISSOES");
  return getMonthlyExpenses(session.tenantId, { month, year });
}

/**
 * Server Action: cria uma nova despesa operacional.
 */
export async function createExpenseAction(
  data: unknown
): Promise<ActionResult<{ expenseId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  const parsed = expenseSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  return createExpense(session.tenantId, parsed.data);
}

/**
 * Server Action: atualiza uma despesa existente sem recriar o registro.
 */
export async function updateExpenseAction(
  expenseId: string,
  data: unknown
): Promise<ActionResult<{ expenseId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  const parsed = updateExpenseSchema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  return updateExpense(session.tenantId, expenseId, parsed.data);
}

/**
 * Server Action: marca a despesa como paga e cria a saída financeira correspondente.
 */
export async function markExpenseAsPaidAction(data: {
  expenseId: string;
  accountId?: string;
}): Promise<ActionResult<{ expenseId: string; transactionId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  return markExpenseAsPaid(session.tenantId, data.expenseId, data.accountId);
}

/**
 * Server Action: estorna o pagamento de uma despesa já liquidada.
 */
export async function cancelExpensePaymentAction(
  expenseId: string
): Promise<ActionResult<{ expenseId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  return cancelExpensePayment(session.tenantId, expenseId);
}

/**
 * Server Action: cancela operacionalmente uma despesa ainda não paga.
 */
export async function cancelExpenseAction(
  expenseId: string
): Promise<ActionResult<{ expenseId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  return cancelExpense(session.tenantId, expenseId);
}

/**
 * Server Action: remove uma despesa pendente/cancelada do tenant autenticado.
 */
export async function deleteExpenseAction(
  expenseId: string
): Promise<ActionResult<{ expenseId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  return deleteExpense(session.tenantId, expenseId);
}
