"use server";

import { revalidatePath } from "next/cache";
import { getEffectiveUserForPermissions } from "@/lib/active-user";
import { requireAuth, requireModuleAccess, requirePermission } from "@/lib/session";
import type { PaymentMethodValue } from "@/lib/payment-methods";
import {
  checkoutAppointment,
  closeCashRegister,
  createManualCashTransaction,
  getCashRegisterOverview,
  getCashSessionDetail,
  getFinancialStatement,
  payCommissions,
  getPendingCommissions,
  getCommissionsSummaryByProfessional,
  openCashRegister,
  recordCashMovement,
  settleCommissions,
} from "@/services/financial.service";
import {
  cashMovementSchema,
  closeCashRegisterSchema,
  manualCashTransactionSchema,
  openCashRegisterSchema,
} from "@/lib/validators/financial";
import { buildUserSnapshot } from "@/lib/audit";
import type { ActionResult } from "@/types";

/**
 * Server Action: finaliza um agendamento executando cobrança, comissões e baixa de estoque.
 * Chamada pela recepcionista ao clicar em "Finalizar e Cobrar" no agendamento.
 */
export async function checkoutAppointmentAction(
  appointmentId: string,
  options: {
    paymentMethod?: PaymentMethodValue;
    accountId: string;
    installments?: number;
  }
): Promise<ActionResult<{ transactionIds: string[]; commissionIds: string[] }>> {
  const session = await requireModuleAccess("AGENDA", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();
  return checkoutAppointment(
    session.tenantId,
    appointmentId,
    {
      ...options,
      finalStatus: "PAID",
    },
    buildUserSnapshot(effectiveUser)
  );
}

/**
 * Server Action: marca comissões como pagas no acerto com o profissional.
 * Exige acesso efetivo ao módulo de Comissões.
 */
export async function payCommissionsAction(
  commissionIds: string[]
): Promise<ActionResult<{ paidCount: number }>> {
  const session = await requirePermission("financeiro.comissoes", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();

  return payCommissions(session.tenantId, commissionIds, buildUserSnapshot(effectiveUser));
}

/**
 * Server Action: lista comissões pendentes de um profissional para visualização do acerto.
 */
export async function getPendingCommissionsAction(professionalId: string) {
  const session = await requirePermission("financeiro.comissoes", "view");
  return getPendingCommissions(session.tenantId, professionalId, {
    userId: session.id,
    role: session.role,
  });
}

/**
 * Server Action: retorna o painel geral de comissões agrupado por profissional.
 * Cada profissional inclui soma PENDING e lista detalhada dos serviços.
 */
export async function getCommissionsSummaryAction() {
  const session = await requirePermission("financeiro.comissoes", "view");

  return getCommissionsSummaryByProfessional(session.tenantId, {
    userId: session.id,
    role: session.role,
  });
}

/**
 * Server Action: realiza o acerto financeiro completo de um profissional.
 * Marca comissões PENDING → PAID e cria Transaction EXPENSE no caixa.
 * Exige acesso efetivo ao módulo de Comissões.
 */
export async function settleCommissionsAction(
  professionalId: string,
  accountId?: string
): Promise<ActionResult<{ paidCount: number; expenseTransactionId: string }>> {
  const session = await requirePermission("financeiro.comissoes", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();

  return settleCommissions(session.tenantId, professionalId, accountId, buildUserSnapshot(effectiveUser));
}

/**
 * Server Action: busca o extrato financeiro do período informado.
 * Mantém o escopo isolado por tenant e reutiliza a permissão do módulo Financeiro.
 */
export async function getFinancialStatementAction(
  startDate: { year: number; month: number; day: number },
  endDate: { year: number; month: number; day: number },
  options?: {
    type?: "ALL" | "INCOME" | "EXPENSE";
    status?: "ALL" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
  }
) {
  const session = await requirePermission("financeiro.extrato", "view");

  return getFinancialStatement(session.tenantId, {
    startDate,
    endDate,
    type: options?.type,
    status: options?.status,
  });
}

/**
 * Server Action: retorna o estado operacional do caixa do tenant.
 */
export async function getCashRegisterOverviewAction() {
  const session = await requirePermission("financeiro.caixa", "view");
  return getCashRegisterOverview(session.tenantId);
}

/**
 * Server Action: detalhe de uma sessão de caixa (para drill-down no histórico).
 * Leitura pura — não invalida caches.
 */
export async function getCashSessionDetailAction(sessionId: string) {
  const session = await requirePermission("financeiro.caixa", "view");
  return getCashSessionDetail(session.tenantId, sessionId);
}

/**
 * Server Action: abre o caixa operacional para o tenant autenticado.
 */
export async function openCashRegisterAction(data: {
  accountId: string;
  openingAmount: number;
  openingNotes?: string;
}): Promise<ActionResult<{ sessionId: string }>> {
  const session = await requirePermission("financeiro.caixa", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();
  const parsed = openCashRegisterSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return openCashRegister(
    session.tenantId,
    effectiveUser.id,
    parsed.data,
    buildUserSnapshot(effectiveUser)
  );
}

/**
 * Server Action: fecha o caixa operacional aberto.
 */
export async function closeCashRegisterAction(data: {
  sessionId: string;
  closingAmount: number;
  closingNotes?: string;
}): Promise<ActionResult<{ sessionId: string }>> {
  const session = await requirePermission("financeiro.caixa", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();
  const parsed = closeCashRegisterSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return closeCashRegister(
    session.tenantId,
    effectiveUser.id,
    parsed.data,
    buildUserSnapshot(effectiveUser)
  );
}

/**
 * Server Action: registra uma movimentação "livre" diretamente no caixa aberto.
 * Mantido para compatibilidade; novos fluxos de sangria/reforço devem usar
 * `recordCashMovementAction`.
 */
export async function createManualCashTransactionAction(data: {
  accountId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  paymentMethod: PaymentMethodValue;
}): Promise<ActionResult<{ transactionId: string }>> {
  const session = await requirePermission("financeiro.caixa", "edit");
  const parsed = manualCashTransactionSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados invalidos." };
  }

  return createManualCashTransaction(session.tenantId, parsed.data);
}

/**
 * Server Action: registra uma sangria ou reforço vinculado à sessão de caixa aberta.
 */
export async function recordCashMovementAction(data: {
  sessionId: string;
  type: "WITHDRAWAL" | "REINFORCEMENT";
  amount: number;
  reason: string;
  notes?: string;
}): Promise<ActionResult<{ transactionId: string }>> {
  const session = await requirePermission("financeiro.caixa", "edit");
  await requireAuth();
  const effectiveUser = await getEffectiveUserForPermissions();
  const parsed = cashMovementSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const result = await recordCashMovement(
    session.tenantId,
    effectiveUser.id,
    parsed.data,
    buildUserSnapshot(effectiveUser)
  );

  if (result.success) {
    revalidatePath("/financeiro/caixa");
    revalidatePath("/financeiro");
  }

  return result;
}
