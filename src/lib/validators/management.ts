import { z } from "zod";
import {
  customPermissionsSchema,
  normalizeCustomPermissions,
} from "@/lib/tenant-permissions";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const teamMemberBaseShape = {
  name: z.string().trim().min(2, "Informe o nome completo."),
  email: z.email("Informe um email válido.").transform((value) => value.toLowerCase().trim()),
  phone: optionalTrimmedString,
  role: z.enum(["ADMIN", "RECEPTIONIST", "PROFESSIONAL"]),
  actsAsProfessional: z.boolean().optional(),
  specialty: optionalTrimmedString,
  commissionPercent: z.coerce
    .number()
    .min(0, "A comissão não pode ser negativa.")
    .max(100, "A comissão deve estar entre 0 e 100.")
    .optional(),
  contractType: z.enum(["CLT", "PJ"]).optional(),
  registrationNumber: optionalTrimmedString,
  isActive: z.boolean().default(true),
  customPermissions: customPermissionsSchema.optional(),
} satisfies z.ZodRawShape;

const teamMemberBaseObject = z.object(teamMemberBaseShape);
const teamMemberCreateObject = z.object({
  ...teamMemberBaseShape,
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

/**
 * Schema compartilhado para criar e editar membros da equipe sem perder o vínculo histórico.
 */
export const teamMemberBaseSchema = teamMemberBaseObject.transform((data) => ({
  ...data,
  actsAsProfessional:
    data.role === "PROFESSIONAL"
      ? true
      : data.role === "ADMIN"
        ? Boolean(data.actsAsProfessional)
        : false,
  customPermissions: normalizeCustomPermissions(data.role, data.customPermissions),
}));

export const createTeamMemberSchema = teamMemberCreateObject.transform((data) => ({
  ...data,
  actsAsProfessional:
    data.role === "PROFESSIONAL"
      ? true
      : data.role === "ADMIN"
        ? Boolean(data.actsAsProfessional)
        : false,
  customPermissions: normalizeCustomPermissions(data.role, data.customPermissions),
}));

export const updateTeamMemberSchema = teamMemberBaseObject.transform((data) => ({
  ...data,
  actsAsProfessional:
    data.role === "PROFESSIONAL"
      ? true
      : data.role === "ADMIN"
        ? Boolean(data.actsAsProfessional)
        : false,
  customPermissions: normalizeCustomPermissions(data.role, data.customPermissions),
}));

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;

/**
 * Schema para criação e edição do catálogo de produtos do tenant.
 */
export const productSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do produto."),
  description: optionalTrimmedString,
  sku: optionalTrimmedString,
  type: z.enum(["CONSUMABLE", "RESALE", "BOTH"]),
  unit: z.string().trim().min(1, "Informe a unidade de medida.").max(20),
  costPrice: z.coerce.number().min(0, "O preço de custo não pode ser negativo."),
  salePrice: z.coerce.number().min(0, "O preço de venda não pode ser negativo."),
  stockQuantity: z.coerce.number().min(0, "O estoque atual não pode ser negativo."),
  minStock: z.coerce.number().min(0, "O estoque mínimo não pode ser negativo."),
  isActive: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

const packageServiceSchema = z.object({
  serviceId: z.string().min(1, "Selecione ao menos um serviço."),
  quantity: z.coerce
    .number()
    .int("A quantidade de sessões deve ser um número inteiro.")
    .min(1, "A quantidade de sessões deve ser maior que zero."),
});

/**
 * Schema para criação e edição de pacotes comerciais.
 */
export const packageSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do pacote."),
  description: optionalTrimmedString,
  totalSessions: z.coerce
    .number()
    .int("O total de sessões deve ser um número inteiro.")
    .min(1, "Informe pelo menos 1 sessão."),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  validityDays: z.coerce
    .number()
    .int("A validade deve ser um número inteiro.")
    .min(1, "A validade deve ser maior que zero.")
    .optional(),
  isActive: z.boolean().default(true),
  services: z.array(packageServiceSchema).min(1, "Vincule pelo menos um serviço ao pacote."),
});

export type PackageInput = z.infer<typeof packageSchema>;
