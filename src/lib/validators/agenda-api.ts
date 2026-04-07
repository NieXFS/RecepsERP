import { z } from "zod";
import { parseCivilDate } from "@/lib/civil-date";

const isoDateTimeSchema = z.string().refine((value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}, "Data/hora inválida");

export const agendaInfoQuerySchema = z.object({
  tenantSlug: z.string().trim().min(1, "tenantSlug é obrigatório"),
});

export const availabilityQuerySchema = z.object({
  tenantSlug: z.string().trim().min(1, "tenantSlug é obrigatório"),
  date: z
    .string()
    .trim()
    .min(1, "date é obrigatório")
    .refine((value) => parseCivilDate(value) !== null, "date deve estar no formato YYYY-MM-DD"),
  serviceId: z.string().trim().min(1, "serviceId é obrigatório"),
  professionalId: z.string().trim().min(1).optional(),
});

export const bookAppointmentApiSchema = z
  .object({
    tenantSlug: z.string().trim().min(1, "tenantSlug é obrigatório"),
    customerPhone: z.string().trim().min(1).optional(),
    customerName: z.string().trim().min(1).optional(),
    serviceId: z.string().trim().min(1, "serviceId é obrigatório"),
    professionalId: z.string().trim().min(1, "professionalId é obrigatório"),
    startTime: isoDateTimeSchema,
    endTime: isoDateTimeSchema.optional(),
  })
  .refine((value) => value.customerPhone || value.customerName, {
    message: "Informe customerPhone ou customerName para identificar o cliente.",
    path: ["customerPhone"],
  });

export type AgendaInfoQuery = z.infer<typeof agendaInfoQuerySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type BookAppointmentApiInput = z.infer<typeof bookAppointmentApiSchema>;
