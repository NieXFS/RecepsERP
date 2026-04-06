import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const FINANCIAL_STATEMENT_TYPE_VALUES = [
  "ALL",
  "INCOME",
  "EXPENSE",
] as const;

export const FINANCIAL_STATEMENT_STATUS_VALUES = [
  "ALL",
  "PENDING",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "REFUNDED",
] as const;

export const openCashRegisterSchema = z.object({
  accountId: z.string().min(1, "Selecione a conta caixa."),
  openingAmount: z.coerce.number().min(0, "O valor inicial não pode ser negativo."),
  openingNotes: optionalTrimmedString,
});

export const closeCashRegisterSchema = z.object({
  sessionId: z.string().min(1, "Sessão de caixa inválida."),
  closingAmount: z.coerce.number().min(0, "O valor apurado não pode ser negativo."),
  closingNotes: optionalTrimmedString,
});

export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
