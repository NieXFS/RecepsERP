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

export const FINANCIAL_ACCOUNT_TYPE_VALUES = [
  "CASH",
  "BANK",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "PIX",
  "OTHER",
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

export const CASH_MOVEMENT_TYPE_VALUES = ["WITHDRAWAL", "REINFORCEMENT"] as const;

export const cashMovementSchema = z.object({
  sessionId: z.string().min(1, "Sessão de caixa inválida."),
  type: z.enum(CASH_MOVEMENT_TYPE_VALUES, {
    message: "Tipo de movimento inválido.",
  }),
  amount: z.coerce.number().positive("Informe um valor maior que zero."),
  reason: z
    .string()
    .trim()
    .min(1, "Informe o motivo da movimentação.")
    .max(200, "Motivo muito longo."),
  notes: optionalTrimmedString,
});

export const createFinancialAccountSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da conta."),
  type: z.enum(FINANCIAL_ACCOUNT_TYPE_VALUES).default("BANK"),
  initialBalance: z.coerce.number().min(0, "O saldo inicial não pode ser negativo."),
});

export const deactivateFinancialAccountSchema = z.object({
  accountId: z.string().min(1, "Conta financeira inválida."),
});

export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
export type ManualCashTransactionInput = z.infer<typeof manualCashTransactionSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
export type CreateFinancialAccountInput = z.infer<typeof createFinancialAccountSchema>;
export type DeactivateFinancialAccountInput = z.infer<typeof deactivateFinancialAccountSchema>;
