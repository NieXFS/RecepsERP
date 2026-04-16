import { z } from "zod";
import { BUSINESS_SEGMENT_VALUES } from "@/lib/business-segments";
import {
  TENANT_SLOT_INTERVAL_OPTIONS,
  parseTimeStringToMinutes,
} from "@/lib/tenant-schedule";

const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const serviceItemSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do serviço."),
  durationMinutes: z.coerce.number().int().min(5, "Duração muito curta.").max(600, "Duração muito longa."),
  price: z.coerce.number().min(0, "Preço não pode ser negativo.").max(999999.99, "Preço muito alto."),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export const setupStepSegmentSchema = z.object({
  segment: z.enum(BUSINESS_SEGMENT_VALUES as [string, ...string[]]),
  services: z
    .array(serviceItemSchema)
    .min(1, "Cadastre pelo menos 1 serviço.")
    .max(10, "Máximo de 10 serviços nesta etapa."),
});

export type SetupStepSegmentInput = z.infer<typeof setupStepSegmentSchema>;

export const setupStepProfessionalSchema = z.object({
  specialty: z.string().trim().min(2, "Informe a especialidade.").max(80),
  registrationNumber: z.string().trim().max(40).optional().or(z.literal("")),
  commissionPercent: z.coerce
    .number()
    .min(0, "Comissão não pode ser negativa.")
    .max(100, "Comissão não pode passar de 100%.")
    .default(0),
});

export type SetupStepProfessionalInput = z.infer<typeof setupStepProfessionalSchema>;

export const setupStepBusinessHoursSchema = z
  .object({
    openingTime: z
      .string()
      .trim()
      .regex(TIME_REGEX, "Use o formato HH:MM."),
    closingTime: z
      .string()
      .trim()
      .regex(TIME_REGEX, "Use o formato HH:MM."),
    slotIntervalMinutes: z.coerce
      .number()
      .refine(
        (value) =>
          TENANT_SLOT_INTERVAL_OPTIONS.includes(
            value as (typeof TENANT_SLOT_INTERVAL_OPTIONS)[number]
          ),
        "Selecione um intervalo de agenda válido."
      ),
  })
  .refine((data) => {
    const opening = parseTimeStringToMinutes(data.openingTime);
    const closing = parseTimeStringToMinutes(data.closingTime);
    if (opening == null || closing == null) return false;
    return closing > opening;
  }, {
    message: "O horário de fechamento precisa ser depois da abertura.",
    path: ["closingTime"],
  });

export type SetupStepBusinessHoursInput = z.infer<typeof setupStepBusinessHoursSchema>;
