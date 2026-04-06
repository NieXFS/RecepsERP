"use server";

import { requireModuleAccess } from "@/lib/session";
import { updateAppointmentStatus } from "@/services/appointment.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: ação rápida de mudança de status no dashboard.
 * Permite a recepcionista fazer check-in, iniciar atendimento,
 * ou finalizar (que dispara o checkout financeiro completo).
 */
export async function quickStatusChangeAction(
  appointmentId: string,
  newStatus: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "PAID" | "CHECKED_IN"
): Promise<ActionResult<{ status: string }>> {
  const session = await requireModuleAccess("DASHBOARD");
  return updateAppointmentStatus(session.tenantId, appointmentId, newStatus);
}
