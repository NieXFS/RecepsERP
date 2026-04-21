import { db } from "@/lib/db";
import { recordAudit, type AuditActor } from "@/lib/audit";
import { getProjectedIncomeBetween } from "@/services/financial.service";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export type PacingStatus = "behind" | "on_track" | "ahead";

export type RevenueGoalRecord = {
  id: string;
  month: string;
  targetAmount: number;
  createdBy: { id: string; name: string | null } | null;
};

export type RevenueGoalProgress = {
  goal: RevenueGoalRecord;
  month: string;
  targetAmount: number;
  realizedAmount: number;
  pendingIncomeAmount: number;
  projectedAmount: number;
  remainingAmount: number;
  percentAchieved: number;
  percentProjected: number;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  dailyPaceRealized: number;
  pacingStatus: PacingStatus;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function resolveMonthAnchor(reference?: Date): string {
  const base = reference ?? new Date();
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function parseMonth(month: string): { year: number; monthIndex: number } {
  if (!MONTH_REGEX.test(month)) {
    throw new Error("Formato de mês inválido. Use YYYY-MM.");
  }
  const [yearStr, monthStr] = month.split("-");
  return { year: Number(yearStr), monthIndex: Number(monthStr) - 1 };
}

function getMonthRange(month: string): { start: Date; end: Date; daysInMonth: number } {
  const { year, monthIndex } = parseMonth(month);
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return { start, end, daysInMonth };
}

/**
 * Retorna a meta de faturamento do mês-âncora (default: hoje).
 */
export async function getCurrentRevenueGoal(
  tenantId: string,
  reference?: Date
): Promise<RevenueGoalRecord | null> {
  const month = resolveMonthAnchor(reference);
  const record = await db.revenueGoal.findUnique({
    where: { tenantId_month: { tenantId, month } },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!record) return null;
  return {
    id: record.id,
    month: record.month,
    targetAmount: roundCurrency(Number(record.targetAmount)),
    createdBy: record.createdBy
      ? { id: record.createdBy.id, name: record.createdBy.name }
      : null,
  };
}

type UpsertRevenueGoalInput = {
  tenantId: string;
  month: string;
  targetAmount: number;
  userId: string;
  actor?: AuditActor;
};

/**
 * Cria ou atualiza a meta do mês para o tenant. Usa o índice composto
 * (tenantId, month) para garantir unicidade.
 */
export async function upsertRevenueGoal(
  input: UpsertRevenueGoalInput
): Promise<RevenueGoalRecord> {
  if (!MONTH_REGEX.test(input.month)) {
    throw new Error("Formato de mês inválido. Use YYYY-MM.");
  }
  if (!Number.isFinite(input.targetAmount) || input.targetAmount <= 0) {
    throw new Error("Meta deve ser maior que zero.");
  }

  const amount = roundCurrency(input.targetAmount);

  const record = await db.$transaction(async (tx) => {
    const previous = await tx.revenueGoal.findUnique({
      where: { tenantId_month: { tenantId: input.tenantId, month: input.month } },
      select: { targetAmount: true },
    });

    const saved = await tx.revenueGoal.upsert({
      where: { tenantId_month: { tenantId: input.tenantId, month: input.month } },
      update: {
        targetAmount: amount,
        createdById: input.userId,
      },
      create: {
        tenantId: input.tenantId,
        month: input.month,
        targetAmount: amount,
        createdById: input.userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (input.actor) {
      const previousAmount = previous ? Number(previous.targetAmount) : null;
      const formattedAmount = amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const summary = previousAmount == null
        ? `Meta de ${input.month} definida em ${formattedAmount}`
        : `Meta de ${input.month} atualizada para ${formattedAmount}`;
      await recordAudit(tx, {
        tenantId: input.tenantId,
        actor: input.actor,
        action: "GOAL_SET",
        entityType: "RevenueGoal",
        entityId: saved.id,
        summary,
        changes: previousAmount != null && previousAmount !== amount
          ? { targetAmount: { from: previousAmount, to: amount } }
          : undefined,
        snapshot: {
          month: input.month,
          targetAmount: amount,
        },
      });
    }

    return saved;
  });

  return {
    id: record.id,
    month: record.month,
    targetAmount: roundCurrency(Number(record.targetAmount)),
    createdBy: record.createdBy
      ? { id: record.createdBy.id, name: record.createdBy.name }
      : null,
  };
}

function computePacingStatus(
  realized: number,
  target: number,
  daysElapsed: number,
  daysInMonth: number
): PacingStatus {
  if (target <= 0 || daysInMonth <= 0) return "on_track";
  const elapsedRatio = Math.min(Math.max(daysElapsed / daysInMonth, 0), 1);
  const expected = target * elapsedRatio;
  if (expected <= 0) {
    return realized > 0 ? "ahead" : "on_track";
  }
  const achievedRatio = realized / expected;
  if (achievedRatio < 0.9) return "behind";
  if (achievedRatio > 1.1) return "ahead";
  return "on_track";
}

/**
 * Calcula o progresso da meta do mês corrente: realizado, pendente, projeção,
 * ritmo diário e status de pacing (±10pp vs ritmo esperado).
 */
export async function getRevenueGoalProgress(
  tenantId: string
): Promise<RevenueGoalProgress | null> {
  const goal = await getCurrentRevenueGoal(tenantId);
  if (!goal) return null;

  const { start, end, daysInMonth } = getMonthRange(goal.month);
  const now = new Date();

  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );

  const isCurrentMonth =
    now.getFullYear() === start.getFullYear() &&
    now.getMonth() === start.getMonth();

  const daysElapsed = isCurrentMonth
    ? Math.min(now.getDate(), daysInMonth)
    : now >= end
      ? daysInMonth
      : 0;
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0);

  const [realizedAgg, pendingEntries] = await Promise.all([
    db.transaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PAID",
        OR: [
          { paidAt: { gte: start, lt: end } },
          {
            AND: [
              { paidAt: null },
              { createdAt: { gte: start, lt: end } },
            ],
          },
        ],
      },
      _sum: { amount: true },
    }),
    isCurrentMonth && tomorrowStart < end
      ? getProjectedIncomeBetween(tenantId, tomorrowStart, end)
      : Promise.resolve([]),
  ]);

  const realizedAmount = roundCurrency(Number(realizedAgg._sum.amount ?? 0));
  const pendingIncomeAmount = roundCurrency(
    pendingEntries.reduce((acc, entry) => acc + entry.amount, 0)
  );
  const projectedAmount = roundCurrency(
    Math.max(realizedAmount + pendingIncomeAmount, realizedAmount)
  );
  const remainingAmount = roundCurrency(
    Math.max(goal.targetAmount - realizedAmount, 0)
  );

  const percentAchieved =
    goal.targetAmount > 0 ? (realizedAmount / goal.targetAmount) * 100 : 0;
  const percentProjected =
    goal.targetAmount > 0 ? (projectedAmount / goal.targetAmount) * 100 : 0;

  const dailyPaceRealized = roundCurrency(
    daysElapsed > 0 ? realizedAmount / daysElapsed : 0
  );

  const pacingStatus = computePacingStatus(
    realizedAmount,
    goal.targetAmount,
    daysElapsed,
    daysInMonth
  );

  return {
    goal,
    month: goal.month,
    targetAmount: goal.targetAmount,
    realizedAmount,
    pendingIncomeAmount,
    projectedAmount,
    remainingAmount,
    percentAchieved,
    percentProjected,
    daysElapsed,
    daysRemaining,
    daysInMonth,
    dailyPaceRealized,
    pacingStatus,
  };
}
