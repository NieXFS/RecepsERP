import { z } from "zod";

export const CUSTOMER_GENDER_VALUES = [
  "MALE",
  "FEMALE",
  "OTHER",
  "NOT_INFORMED",
] as const;

const optionalTextField = z.string().trim().optional().or(z.literal(""));

const optionalDateField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((value) => {
    if (!value) {
      return true;
    }

    return !Number.isNaN(Date.parse(value));
  }, "Informe uma data de nascimento válida.");

/**
 * Validação do cadastro e da edição manual de clientes.
 * Nome e telefone continuam obrigatórios para preservar os fluxos rápidos da agenda.
 */
export const customerSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome completo do cliente."),
  phone: z.string().trim().min(8, "Informe um telefone ou WhatsApp válido."),
  email: optionalTextField.refine((value) => {
    if (!value) {
      return true;
    }

    return z.string().email().safeParse(value).success;
  }, "Informe um email válido."),
  document: optionalTextField,
  birthDate: optionalDateField,
  gender: z.enum(CUSTOMER_GENDER_VALUES).optional(),
  zipCode: optionalTextField,
  street: optionalTextField,
  number: optionalTextField,
  complement: optionalTextField,
  neighborhood: optionalTextField,
  city: optionalTextField,
  state: optionalTextField,
  notes: optionalTextField,
});

export const createCustomerSchema = customerSchema;
export const updateCustomerSchema = customerSchema;

export type CustomerInput = z.infer<typeof customerSchema>;
export type CreateCustomerInput = CustomerInput;
export type UpdateCustomerInput = CustomerInput;
