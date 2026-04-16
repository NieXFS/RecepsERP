import { z } from "zod";
import { isValidCnpj, normalizeCnpj } from "@/lib/cnpj";
import { isValidBrazilPhone, normalizeBrazilPhone } from "@/lib/phone";

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export const signupSchema = z.object({
  businessName: z.string().trim().min(3, "Informe o nome do negócio."),
  cnpj: z
    .string()
    .trim()
    .min(1, "Informe o CNPJ.")
    .refine((value) => isValidCnpj(value), "CNPJ inválido.")
    .transform((value) => normalizeCnpj(value)),
  ownerName: z.string().trim().min(2, "Informe o seu nome."),
  email: z
    .string()
    .trim()
    .email("Informe um email válido.")
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .refine((value) => isValidBrazilPhone(value), "Informe um telefone brasileiro válido.")
    .transform((value) => normalizeBrazilPhone(value)),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  planSlug: z.string().trim().min(1, "Plano inválido."),
  acceptLegal: z
    .boolean()
    .refine((value) => value, "Você precisa aceitar os termos."),
  referralCode: z
    .string()
    .trim()
    .max(64, "Código de indicação inválido.")
    .optional()
    .transform(normalizeOptionalText),
});

export type SignupInput = z.infer<typeof signupSchema>;
