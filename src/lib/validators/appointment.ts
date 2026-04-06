import { z } from "zod";
import { APPOINTMENT_WORKFLOW_STATUSES } from "@/lib/appointments/status";

/** Schema de validação para criação de agendamento */
export const createAppointmentSchema = z.object({
  customerId: z.string().min(1, "Cliente é obrigatório"),
  professionalId: z.string().min(1, "Profissional é obrigatório"),
  roomId: z.string().nullable().optional(),
  customerPackageId: z.string().nullable().optional(),
  startTime: z.coerce.date({ error: "Data/hora de início é obrigatória" }),
  serviceIds: z.array(z.string()).min(1, "Selecione ao menos um serviço"),
  equipmentIds: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/** Schema para atualização de status do agendamento */
export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.union([
    z.enum(APPOINTMENT_WORKFLOW_STATUSES),
    z.literal("CHECKED_IN"),
  ]),
  cancellationNote: z.string().optional(),
});

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
