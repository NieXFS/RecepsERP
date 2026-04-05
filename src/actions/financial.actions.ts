"use server";

import { requireModuleAccess } from "@/lib/session";
import {
  checkoutAppointment,
  payCommissions,
  getPendingCommissions,
  getCommissionsSummaryByProfessional,
  settleCommissions,
} from "@/services/financial.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: finaliza um agendamento executando cobrança, comissões e baixa de estoque.
 * Chamada pela recepcionista ao clicar em "Finalizar e Cobrar" no agendamento.
 */
export async function checkoutAppointmentAction(
  appointmentId: string,
  options?: {
    paymentMethod?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "BANK_TRANSFER" | "BOLETO" | "OTHER";
    accountId?: string;
    installments?: number;
  }
): Promise<ActionResult<{ transactionIds: string[]; commissionIds: string[] }>> {
  const session = await requireModuleAccess("AGENDA");
  return checkoutAppointment(session.tenantId, appointmentId, options);
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
