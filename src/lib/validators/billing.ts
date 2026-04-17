import { z } from "zod";

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export const createCheckoutSessionSchema = z.object({
  planId: z.string().trim().min(1, "Plano inválido."),
  referralCode: z
    .string()
    .trim()
    .max(64, "Código de indicação inválido.")
    .optional()
    .transform(normalizeOptionalText),
});

export const createBillingPortalSessionSchema = z.object({
  returnUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value),
      "URL de retorno inválida."
    )
    .optional()
    .transform(normalizeOptionalText),
});

export const billingPlanSchema = z.object({
  id: z.string().trim().optional().transform(normalizeOptionalText),
  slug: z.string().trim().min(2, "Slug obrigatório."),
  name: z.string().trim().min(2, "Nome obrigatório."),
  description: z.string().trim().optional().transform(normalizeOptionalText),
  priceMonthly: z.coerce.number().positive("Preço mensal deve ser maior que zero."),
  currency: z.string().trim().min(3).max(3).default("brl"),
  trialDays: z.coerce.number().int().min(0).max(365).default(7),
  maxUsers: z.coerce.number().int().min(1).optional(),
  maxAppointmentsMonth: z.coerce.number().int().min(1).optional(),
  featuresText: z.string().trim().min(2, "Informe as features em JSON."),
  stripeProductId: z.string().trim().optional().transform(normalizeOptionalText),
  stripePriceId: z.string().trim().optional().transform(normalizeOptionalText),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type BillingPlanInput = z.infer<typeof billingPlanSchema>;

export const tenantBillingBypassSchema = z.object({
  tenantId: z.string().trim().min(1, "Tenant inválido."),
  enabled: z.coerce.boolean(),
  reason: z
    .string()
    .trim()
    .max(500, "O motivo pode ter no máximo 500 caracteres.")
    .optional()
    .transform(normalizeOptionalText),
});

export type TenantBillingBypassInput = z.infer<typeof tenantBillingBypassSchema>;
