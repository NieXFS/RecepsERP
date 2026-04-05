"use server";

import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { checkoutAppointment } from "@/services/financial.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: ação rápida de mudança de status no dashboard.
 * Permite a recepcionista fazer check-in, iniciar atendimento,
 * ou finalizar (que dispara o checkout financeiro completo).
 */
export async function quickStatusChangeAction(
  appointmentId: string,
  newStatus: "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED"
): Promise<ActionResult> {
  const session = await requireAuth();

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, tenantId: session.tenantId },
  });

  if (!appointment) {
    return { success: false, error: "Agendamento não encontrado." };
  }

  // COMPLETED dispara o checkout financeiro completo (cobrança + comissão + estoque)
  if (newStatus === "COMPLETED") {
    const result = await checkoutAppointment(session.tenantId, appointmentId);
    if (!result.success) return result;
    return { success: true, data: undefined };
  }

  // Para outros status, apenas atualiza diretamente
  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: newStatus },
  });

  return { success: true, data: undefined };
}
