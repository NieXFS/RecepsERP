import { z } from "zod";
import { BotAutomationType } from "@/generated/prisma/enums";

const AUTOMATION_TYPES = Object.values(BotAutomationType) as [
  (typeof BotAutomationType)[keyof typeof BotAutomationType],
  ...Array<(typeof BotAutomationType)[keyof typeof BotAutomationType]>,
];

export const saveAutomationSchema = z.object({
  type: z.enum(AUTOMATION_TYPES, {
    error: "Tipo de automação inválido.",
  }),
  enabled: z.coerce.boolean(),
  templateText: z
    .string()
    .trim()
    .min(1, "Informe o texto da mensagem.")
    .max(900, "O texto pode ter no máximo 900 caracteres."),
  windowDays: z.coerce
    .number()
    .int("Informe um número inteiro de dias.")
    .min(1, "Mínimo de 1 dia.")
    .max(365, "Máximo de 365 dias.")
    .optional(),
});

export type SaveAutomationInput = z.infer<typeof saveAutomationSchema>;

export const syncAutomationStatusSchema = z.object({
  type: z.enum(AUTOMATION_TYPES, {
    error: "Tipo de automação inválido.",
  }),
});

export type SyncAutomationStatusInput = z.infer<typeof syncAutomationStatusSchema>;

export const triggerAutomationTestSchema = z.object({
  type: z.enum(AUTOMATION_TYPES, {
    error: "Tipo de automação inválido.",
  }),
  to: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Informe o telefone em E.164 sem + (ex: 5521999998888)."),
  overrideValues: z.record(z.string(), z.string()).optional(),
});

export type TriggerAutomationTestInput = z.infer<typeof triggerAutomationTestSchema>;
