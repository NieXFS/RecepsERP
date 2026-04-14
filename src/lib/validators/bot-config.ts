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

export type BotConfigSettingsInput = z.infer<typeof botConfigSettingsSchema>;
export type AdminBotLinkInput = z.infer<typeof adminBotLinkSchema>;
