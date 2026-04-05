import { z } from "zod";

/** Schema público para captura de lead do ERP antes da aprovação comercial. */
export const createAccessRequestSchema = z.object({
  businessName: z.string().trim().min(2, "Informe o nome do negócio"),
  ownerName: z.string().trim().min(2, "Informe o nome do responsável"),
  email: z.email("Informe um email válido").transform((value) => value.toLowerCase().trim()),
  phone: z
    .string()
    .trim()
    .max(30, "Telefone muito longo")
    .optional()
    .transform((value) => value || undefined),
  notes: z
    .string()
    .trim()
    .max(1000, "Observações muito longas")
    .optional()
    .transform((value) => value || undefined),
});

export type CreateAccessRequestInput = z.infer<typeof createAccessRequestSchema>;

/** Schema interno para geração manual de convite controlado para um novo tenant. */
export const createTenantInvitationSchema = z.object({
  businessName: z.string().trim().min(2, "Informe o nome do negócio"),
  recipientName: z.string().trim().min(2, "Informe o nome do responsável"),
  email: z.email("Informe um email válido").transform((value) => value.toLowerCase().trim()),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});

export type CreateTenantInvitationInput = z.infer<typeof createTenantInvitationSchema>;

/** Schema interno para gerar convite para um tenant já existente. */
export const createTenantAdminInvitationSchema = z.object({
  tenantId: z.string().min(1, "Tenant inválido"),
  recipientName: z.string().trim().min(2, "Informe o nome do responsável"),
  email: z.email("Informe um email válido").transform((value) => value.toLowerCase().trim()),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
});

export type CreateTenantAdminInvitationInput = z.infer<
  typeof createTenantAdminInvitationSchema
>;

/** Schema público para ativação de conta a partir de um convite válido. */
export const acceptTenantInvitationSchema = z.object({
  token: z.string().trim().min(10, "Convite inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type AcceptTenantInvitationInput = z.infer<typeof acceptTenantInvitationSchema>;
