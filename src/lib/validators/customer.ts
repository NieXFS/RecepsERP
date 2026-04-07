import { z } from "zod";

/**
 * Validação do cadastro manual de cliente.
 * Telefone é obrigatório para manter a base pronta para os fluxos futuros de IA/WhatsApp.
 */
export const createCustomerSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo do cliente."),
  phone: z.string().trim().min(8, "Informe um telefone ou WhatsApp válido."),
  email: z
    .string()
    .trim()
    .email("Informe um email válido.")
    .optional()
    .or(z.literal("")),
  document: z.string().trim().optional().or(z.literal("")),
});

export type CreateCustomerInput = {
  name: string;
  phone: string;
  email?: string;
  document?: string;
};
