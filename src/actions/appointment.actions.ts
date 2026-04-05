"use server";

import { requireModuleAccess } from "@/lib/session";
import { createAppointmentSchema, updateAppointmentStatusSchema } from "@/lib/validators/appointment";
import { formatCivilDateToQuery, parseCivilDateFromQuery } from "@/lib/civil-date";
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  cancelAppointment,
} from "@/services/appointment.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: cria um novo agendamento.
 * Valida input com Zod, autentica o usuário e delega ao service layer
 * que verifica colisões de profissional, sala e equipamento.
 */
export async function createAppointmentAction(
  formData: unknown
): Promise<ActionResult<{ appointmentId: string }>> {
  const session = await requireModuleAccess("AGENDA");

  const parsed = createAppointmentSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  return createAppointment(session.tenantId, parsed.data);
}

/**
 * Server Action: lista agendamentos paginados do tenant do usuário logado.
 * Suporta filtros por profissional, data e status.
 */
export async function listAppointmentsAction(params: {
  page?: number;
  perPage?: number;
  professionalId?: string;
  date?: string;
  status?: string;
}) {
  const session = await requireModuleAccess("AGENDA");

  return listAppointments(session.tenantId, {
    ...params,
    date: params.date ? formatCivilDateToQuery(parseCivilDateFromQuery(params.date)) : undefined,
  });
}

/**
 * Server Action: busca um agendamento específico com todos os detalhes.
 */
export async function getAppointmentAction(appointmentId: string) {
  const session = await requireModuleAccess("AGENDA");
  return getAppointmentById(session.tenantId, appointmentId);
}

/**
 * Server Action: cancela um agendamento e devolve sessão de pacote se aplicável.
 */
export async function cancelAppointmentAction(
  appointmentId: string,
  cancellationNote?: string
): Promise<ActionResult> {
  const session = await requireModuleAccess("AGENDA");
  return cancelAppointment(session.tenantId, appointmentId, cancellationNote);
}

/**
 * Server Action: atualiza o status de um agendamento.
 * Quando o status for COMPLETED, dispara automaticamente o checkoutAppointment
 * que executa cobrança, comissões e baixa de estoque em transação ACID.
 * Para outros status, apenas atualiza o campo diretamente.
 */
export async function updateAppointmentStatusAction(
  formData: unknown
): Promise<ActionResult> {
  const session = await requireModuleAccess("AGENDA");

  const parsed = updateAppointmentStatusSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((e) => e.message).join(", "),
    };
  }

  const { appointmentId, status, cancellationNote } = parsed.data;

  if (status === "CANCELLED") {
    return cancelAppointment(session.tenantId, appointmentId, cancellationNote);
  }

  // COMPLETED dispara o fluxo completo de checkout (cobrança + comissão + estoque)
  if (status === "COMPLETED") {
    const { checkoutAppointment } = await import("@/services/financial.service");
    const result = await checkoutAppointment(session.tenantId, appointmentId);
    if (!result.success) {
      return result;
    }
    return { success: true, data: undefined };
  }

  // Para status intermediários (CONFIRMED, CHECKED_IN, IN_PROGRESS), apenas atualiza
  const { db } = await import("@/lib/db");

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, tenantId: session.tenantId },
  });

  if (!appointment) {
    return { success: false, error: "Agendamento não encontrado." };
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  return { success: true, data: undefined };
}
