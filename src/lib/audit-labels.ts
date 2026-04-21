import type { AuditAction } from "@/generated/prisma/enums";
import type { AuditEntityType } from "@/lib/audit";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
  STATUS_CHANGE: "Mudança de status",
  PAYMENT_MARKED: "Pagamento registrado",
  CASH_OPENED: "Abertura de caixa",
  CASH_CLOSED: "Fechamento de caixa",
  COMMISSION_PAID: "Comissão paga",
  PAYOUT_CREATED: "Acerto criado",
  CASH_WITHDRAWAL: "Sangria",
  CASH_REINFORCEMENT: "Reforço",
  GOAL_SET: "Meta definida",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  Transaction: "Transação",
  Expense: "Despesa",
  CashSession: "Sessão de caixa",
  CashMovement: "Movimentação de caixa",
  CommissionPayout: "Acerto de comissões",
  Commission: "Comissão",
  RevenueGoal: "Meta de faturamento",
};

const MONEY_FIELDS = new Set([
  "amount",
  "totalAmount",
  "targetAmount",
  "openingAmount",
  "closingAmount",
  "commissionValue",
  "serviceAmount",
  "clinicValue",
]);

const DATE_FIELDS = new Set([
  "dueDate",
  "paidAt",
  "openedAt",
  "closedAt",
  "periodStart",
  "periodEnd",
  "deletedAt",
  "createdAt",
]);

const FIELD_LABELS: Record<string, string> = {
  amount: "Valor",
  totalAmount: "Total",
  targetAmount: "Meta",
  openingAmount: "Abertura",
  closingAmount: "Fechamento",
  description: "Descrição",
  status: "Status",
  paymentStatus: "Status do pagamento",
  paymentMethod: "Forma de pagamento",
  dueDate: "Vencimento",
  paidAt: "Pago em",
  openedAt: "Aberto em",
  closedAt: "Fechado em",
  categoryId: "Categoria",
  accountId: "Conta",
  type: "Tipo",
  recurrence: "Recorrência",
  notes: "Observações",
  openingNotes: "Notas de abertura",
  closingNotes: "Notas de fechamento",
  cashMovementType: "Tipo de movimento",
  cashMovementReason: "Motivo",
  month: "Mês",
  commissionCount: "Nº comissões",
  commissionRate: "Alíquota",
  commissionValue: "Comissão",
  serviceAmount: "Valor do serviço",
  clinicValue: "Valor da clínica",
};

export function labelForAuditField(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function formatAuditFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return "—";

  if (MONEY_FIELDS.has(field) && typeof value === "number") {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (DATE_FIELDS.has(field) && typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      });
    }
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}
