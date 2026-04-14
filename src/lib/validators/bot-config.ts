import { z } from "zod";
import { BOT_TIMEZONE_OPTIONS } from "@/lib/bot-config";

const optionalTextField = z.string().trim().optional().or(z.literal(""));
const timeField = z.string().regex(/^\d{2}:\d{2}$/, "Informe um horário válido.");

export const botConfigSettingsSchema = z
  .object({
    botName: z.string().trim().min(2, "Informe o nome da atendente."),
    greetingMessage: optionalTextField,
    fallbackMessage: optionalTextField,
    botIsAlwaysActive: z.coerce.boolean(),
    botActiveStart: timeField,
    botActiveEnd: timeField,
    timezone: z.enum(
      BOT_TIMEZONE_OPTIONS.map((option) => option.value) as [
        (typeof BOT_TIMEZONE_OPTIONS)[number]["value"],
        ...(typeof BOT_TIMEZONE_OPTIONS)[number]["value"][],
      ],
      {
        error: "Selecione um timezone válido.",
      }
    ),
  })
  .refine((data) => data.botIsAlwaysActive || data.botActiveEnd > data.botActiveStart, {
    path: ["botActiveEnd"],
    message: "O fim do atendimento deve ser posterior ao início.",
  });

export const botConfigByPhoneNumberQuerySchema = z.object({
  phoneNumberId: z.string().trim().min(1, "phoneNumberId é obrigatório."),
});

export const adminBotLinkSchema = z.object({
  tenantSlug: z.string().trim().min(1, "tenantSlug é obrigatório."),
  wabaId: z.string().trim().min(1, "wabaId é obrigatório."),
  phoneNumberId: z.string().trim().min(1, "phoneNumberId é obrigatório."),
  waAccessToken: z.string().trim().min(1, "waAccessToken é obrigatório."),
  waVerifyToken: z.string().trim().min(1, "waVerifyToken é obrigatório."),
});

export const adminBotConfigSchema = z
  .object({
    tenantId: z.string().trim().min(1, "tenantId é obrigatório."),
    botName: z.string().trim().min(2, "Informe o nome da atendente."),
    systemPrompt: z
      .string()
      .trim()
      .min(20, "Informe instruções mais completas para a atendente."),
    greetingMessage: optionalTextField,
    fallbackMessage: optionalTextField,
    aiModel: z.string().trim().min(1, "Selecione um modelo de IA válido."),
    aiTemperature: z.coerce
      .number()
      .min(0, "A criatividade mínima é 0.")
      .max(1, "A criatividade máxima é 1."),
    aiMaxTokens: z.coerce
      .number()
      .int("Informe um número inteiro de tokens.")
      .min(100, "Use pelo menos 100 tokens.")
      .max(4000, "Use no máximo 4000 tokens."),
    botIsAlwaysActive: z.coerce.boolean(),
    botActiveStart: timeField,
    botActiveEnd: timeField,
    timezone: z.enum(
      BOT_TIMEZONE_OPTIONS.map((option) => option.value) as [
        (typeof BOT_TIMEZONE_OPTIONS)[number]["value"],
        ...(typeof BOT_TIMEZONE_OPTIONS)[number]["value"][],
      ],
      {
        error: "Selecione um timezone válido.",
      }
    ),
    wabaId: optionalTextField,
    phoneNumberId: optionalTextField,
    waAccessToken: optionalTextField,
    waVerifyToken: optionalTextField,
    waApiVersion: z.string().trim().min(1, "Informe a versão da API do WhatsApp."),
    openaiApiKey: optionalTextField,
    isActive: z.coerce.boolean(),
  })
  .refine((data) => data.botIsAlwaysActive || data.botActiveEnd > data.botActiveStart, {
    path: ["botActiveEnd"],
    message: "O fim do atendimento deve ser posterior ao início.",
  })
  .refine((data) => !data.isActive || Boolean(data.phoneNumberId?.trim()), {
    path: ["phoneNumberId"],
    message: "Configure o phoneNumberId antes de ativar o bot.",
  });

export type BotConfigSettingsInput = z.infer<typeof botConfigSettingsSchema>;
export type AdminBotLinkInput = z.infer<typeof adminBotLinkSchema>;
export type AdminBotConfigInput = z.infer<typeof adminBotConfigSchema>;
