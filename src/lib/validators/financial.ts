import { z } from "zod";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/payment-methods";

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

export const manualCashTransactionSchema = z.object({
  accountId: z.string().min(1, "Conta de destino inválida."),
  type: z.enum(["INCOME", "EXPENSE"], {
    message: "Tipo de movimentação inválido.",
  }),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  description: z.string().trim().min(1, "Informe a descrição da movimentação."),
  paymentMethod: z.enum(PAYMENT_METHOD_OPTIONS.map((option) => option.value) as [
    (typeof PAYMENT_METHOD_OPTIONS)[number]["value"],
    ...(typeof PAYMENT_METHOD_OPTIONS)[number]["value"][],
  ]),
});

export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
export type ManualCashTransactionInput = z.infer<typeof manualCashTransactionSchema>;
