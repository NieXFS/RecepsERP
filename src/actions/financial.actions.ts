"use server";

import { requireModuleAccess } from "@/lib/session";
import type { PaymentMethodValue } from "@/lib/payment-methods";
import {
  checkoutAppointment,
  closeCashRegister,
  getCashRegisterOverview,
  getFinancialStatement,
  payCommissions,
  getPendingCommissions,
  getCommissionsSummaryByProfessional,
  openCashRegister,
  settleCommissions,
} from "@/services/financial.service";
import {
  closeCashRegisterSchema,
  openCashRegisterSchema,
} from "@/lib/validators/financial";
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
  const session = await requireModuleAccess("AGENDA");
  return checkoutAppointment(session.tenantId, appointmentId, {
    ...options,
    finalStatus: "PAID",
  });
}

/**
 * Server Action: marca comissões como pagas no acerto com o profissional.
 * Exige acesso efetivo ao módulo de Comissões.
 */
export async function payCommissionsAction(
  commissionIds: string[]
): Promise<ActionResult<{ paidCount: number }>> {
  const session = await requireModuleAccess("COMISSOES");

  return payCommissions(session.tenantId, commissionIds);
}

/**
 * Server Action: lista comissões pendentes de um profissional para visualização do acerto.
 */
export async function getPendingCommissionsAction(professionalId: string) {
  const session = await requireModuleAccess("COMISSOES");
  return getPendingCommissions(session.tenantId, professionalId);
}

/**
 * Server Action: retorna o painel geral de comissões agrupado por profissional.
 * Cada profissional inclui soma PENDING e lista detalhada dos serviços.
 */
export async function getCommissionsSummaryAction() {
  const session = await requireModuleAccess("COMISSOES");

  return getCommissionsSummaryByProfessional(session.tenantId);
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
  const session = await requireModuleAccess("COMISSOES");

  return settleCommissions(session.tenantId, professionalId, accountId);
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
  const session = await requireModuleAccess("COMISSOES");

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
  const session = await requireModuleAccess("COMISSOES");
  return getCashRegisterOverview(session.tenantId);
}

/**
 * Server Action: abre o caixa operacional para o tenant autenticado.
 */
export async function openCashRegisterAction(data: {
  accountId: string;
  openingAmount: number;
  openingNotes?: string;
}): Promise<ActionResult<{ sessionId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  const parsed = openCashRegisterSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return openCashRegister(session.tenantId, session.id, parsed.data);
}

/**
 * Server Action: fecha o caixa operacional aberto.
 */
export async function closeCashRegisterAction(data: {
  sessionId: string;
  closingAmount: number;
  closingNotes?: string;
}): Promise<ActionResult<{ sessionId: string }>> {
  const session = await requireModuleAccess("COMISSOES");
  const parsed = closeCashRegisterSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return closeCashRegister(session.tenantId, session.id, parsed.data);
}
