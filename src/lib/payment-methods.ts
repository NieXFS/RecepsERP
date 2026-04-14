export const PAYMENT_METHOD_OPTIONS = [
  { value: "PIX", label: "Pix" },
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "BANK_TRANSFER", label: "Transferência" },
  { value: "BOLETO", label: "Boleto" },
  { value: "OTHER", label: "Outro" },
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD_OPTIONS)[number]["value"];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> =
  PAYMENT_METHOD_OPTIONS.reduce(
    (acc, option) => {
      acc[option.value] = option.label;
      return acc;
    },
    {} as Record<PaymentMethodValue, string>
  );
