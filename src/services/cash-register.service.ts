import { db } from "@/lib/db";
import type { PaymentMethodValue } from "@/lib/payment-methods";
import type {
  CashMovementInput,
  CloseCashRegisterInput,
  ManualCashTransactionInput,
  OpenCashRegisterInput,
} from "@/lib/validators/financial";
import { buildAppointmentDescription } from "@/lib/appointment-description";
import { recordAudit, type AuditActor } from "@/lib/audit";
import type { ActionResult } from "@/types";

export type CashAccountOption = {
  id: string;
  name: string;
  balance: number;
};

export type CashSessionTotals = {
  totalSales: number;
  totalReinforcements: number;
  totalWithdrawals: number;
  totalOtherExpenses: number;
  totalEntries: number;
  totalExpenses: number;
};

export type CashRegisterOverview = {
  accounts: CashAccountOption[];
  currentSession: {
    id: string;
    status: "OPEN" | "CLOSED";
    accountId: string;
    accountName: string;
    openedAt: string;
    openedByName: string;
    openedByAvatarUrl: string | null;
    openingAmount: number;
    openingNotes: string | null;
    totalEntries: number;
    totalExpenses: number;
    totalSales: number;
    totalReinforcements: number;
    totalWithdrawals: number;
    totalOtherExpenses: number;
    expectedBalance: number;
  } | null;
  recentSessions: Array<{
    id: string;
    accountId: string;
    accountName: string;
    openedAt: string;
    closedAt: string | null;
    openedByName: string;
    closedByName: string | null;
    openingAmount: number;
    closingAmount: number | null;
    expectedBalance: number;
    difference: number | null;
    status: "OPEN" | "CLOSED";
    totalSales: number;
    totalReinforcements: number;
    totalWithdrawals: number;
    totalOtherExpenses: number;
  }>;
  lastClosedAccountBalances: Record<string, number>;
};

export type CashSessionMovementKind =
  | "SALE"
  | "REINFORCEMENT"
  | "WITHDRAWAL"
  | "OTHER_EXPENSE";

export type CashSessionMovement = {
  id: string;
  occurredAt: string;
  description: string;
  paymentMethod: PaymentMethodValue;
  type: "INCOME" | "EXPENSE";
  movementType: CashSessionMovementKind;
  cashMovementReason: string | null;
  amount: number;
};

export type CashSessionSummary = CashRegisterOverview["recentSessions"][number];

export type CashSessionHistoryFilters = {
  accountId?: string;
  from?: Date;
  to?: Date;
  limit?: number;
};

export type CashSessionHistoryResult = {
  sessions: CashSessionSummary[];
  hasMore: boolean;
  totalReturned: number;
};

export type CashSessionPaymentMethodSale = {
  paymentMethod: PaymentMethodValue;
  total: number;
  count: number;
};

export type CashSessionDetail = {
  id: string;
  status: "OPEN" | "CLOSED";
  accountId: string;
  accountName: string;
  openedAt: string;
  closedAt: string | null;
  openedByName: string;
  closedByName: string | null;
  openingAmount: number;
  closingAmount: number | null;
  openingNotes: string | null;
  closingNotes: string | null;
  totalSales: number;
  totalReinforcements: number;
  totalWithdrawals: number;
  totalOtherExpenses: number;
  totalEntries: number;
  totalExpenses: number;
  expectedBalance: number;
  difference: number | null;
  salesByPaymentMethod: CashSessionPaymentMethodSale[];
  movements: CashSessionMovement[];
};

const DEFAULT_HISTORY_LIMIT = 20;
const MAX_HISTORY_LIMIT = 200;

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number | string): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatSignedMoney(value: number): string {
  const absFormatted = formatMoney(Math.abs(value));
  if (value > 0) return `+${absFormatted}`;
  if (value < 0) return `-${absFormatted}`;
  return absFormatted;
}

function buildSessionTransactionFilter(
  tenantId: string,
  accountId: string,
  sessionId: string,
  openedAt: Date,
  closedAt?: Date | null
) {
  const dateWindow = {
    gte: openedAt,
    ...(closedAt ? { lt: closedAt } : {}),
  };

  return {
    tenantId,
    paymentStatus: "PAID" as const,
    OR: [
      { cashRegisterSessionId: sessionId },
      {
        cashRegisterSessionId: null,
        accountId,
        OR: [{ paidAt: dateWindow }, { createdAt: dateWindow }],
      },
    ],
  };
}

async function getCashSessionTotals(
  tenantId: string,
  accountId: string,
  sessionId: string,
  openedAt: Date,
  closedAt?: Date | null
): Promise<CashSessionTotals> {
  const where = buildSessionTransactionFilter(
    tenantId,
    accountId,
    sessionId,
    openedAt,
    closedAt
  );

  const grouped = await db.transaction.groupBy({
    by: ["type", "cashMovementType"],
    where,
    _sum: { amount: true },
  });

  let totalSales = 0;
  let totalReinforcements = 0;
  let totalWithdrawals = 0;
  let totalOtherExpenses = 0;

  for (const row of grouped) {
    const sum = Number(row._sum.amount ?? 0);
    if (row.type === "INCOME") {
      if (row.cashMovementType === "REINFORCEMENT") {
        totalReinforcements += sum;
      } else {
        totalSales += sum;
      }
    } else if (row.type === "EXPENSE") {
      if (row.cashMovementType === "WITHDRAWAL") {
        totalWithdrawals += sum;
      } else {
        totalOtherExpenses += sum;
      }
    }
  }

  const totalEntries = roundCurrency(totalSales + totalReinforcements);
  const totalExpenses = roundCurrency(totalWithdrawals + totalOtherExpenses);

  return {
    totalSales: roundCurrency(totalSales),
    totalReinforcements: roundCurrency(totalReinforcements),
    totalWithdrawals: roundCurrency(totalWithdrawals),
    totalOtherExpenses: roundCurrency(totalOtherExpenses),
    totalEntries,
    totalExpenses,
  };
}

export async function getCashSessionMovements(
  tenantId: string,
  sessionId: string
): Promise<CashSessionMovement[]> {
  const session = await db.cashRegisterSession.findFirst({
    where: { id: sessionId, tenantId },
    select: { id: true, accountId: true, openedAt: true, closedAt: true },
  });

  if (!session) return [];

  const transactions = await db.transaction.findMany({
    where: buildSessionTransactionFilter(
      tenantId,
      session.accountId,
      session.id,
      session.openedAt,
      session.closedAt
    ),
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      paymentMethod: true,
      cashMovementType: true,
      cashMovementReason: true,
      installmentNumber: true,
      totalInstallments: true,
      createdAt: true,
      paidAt: true,
      appointment: {
        select: {
          customer: { select: { name: true } },
          services: {
            select: {
              service: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return transactions
    .map((transaction) => {
      const occurredAt = (transaction.paidAt ?? transaction.createdAt).toISOString();
      const movementType: CashSessionMovementKind =
        transaction.type === "INCOME"
          ? transaction.cashMovementType === "REINFORCEMENT"
            ? "REINFORCEMENT"
            : "SALE"
          : transaction.cashMovementType === "WITHDRAWAL"
            ? "WITHDRAWAL"
            : "OTHER_EXPENSE";

      const fallbackDescription =
        movementType === "WITHDRAWAL"
          ? "Sangria"
          : movementType === "REINFORCEMENT"
            ? "Reforço"
            : transaction.type === "INCOME"
              ? "Movimentação de entrada"
              : "Movimentação de saída";

      const description = transaction.appointment
        ? buildAppointmentDescription({
            customerName: transaction.appointment.customer?.name,
            serviceNames: transaction.appointment.services.map(
              (s) => s.service.name
            ),
            installmentNumber: transaction.installmentNumber,
            totalInstallments: transaction.totalInstallments,
          })
        : (transaction.description ?? fallbackDescription);

      return {
        id: transaction.id,
        occurredAt,
        description,
        paymentMethod: transaction.paymentMethod as PaymentMethodValue,
        type: transaction.type,
        movementType,
        cashMovementReason: transaction.cashMovementReason ?? null,
        amount: Number(transaction.amount),
      };
    })
    .sort((left, right) => +new Date(right.occurredAt) - +new Date(left.occurredAt));
}

/**
 * @deprecated Prefer `getCashSessionMovements(tenantId, sessionId)`.
 * Compat shim: mantém a assinatura antiga usada por páginas do módulo Caixa
 * enquanto a sessão for passada via (accountId, openedAt).
 */
export async function getOpenSessionTransactions(
  tenantId: string,
  accountId: string,
  openedAt: Date
): Promise<CashSessionMovement[]> {
  const session = await db.cashRegisterSession.findFirst({
    where: { tenantId, accountId, openedAt },
    select: { id: true },
    orderBy: { openedAt: "desc" },
  });

  if (session) {
    return getCashSessionMovements(tenantId, session.id);
  }

  // Fallback por janela temporal (sessões legadas sem vínculo)
  const transactions = await db.transaction.findMany({
    where: {
      tenantId,
      accountId,
      paymentStatus: "PAID",
      OR: [{ paidAt: { gte: openedAt } }, { createdAt: { gte: openedAt } }],
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      paymentMethod: true,
      cashMovementType: true,
      cashMovementReason: true,
      createdAt: true,
      paidAt: true,
    },
  });

  return transactions
    .map((transaction) => {
      const occurredAt = (transaction.paidAt ?? transaction.createdAt).toISOString();
      const movementType: CashSessionMovementKind =
        transaction.type === "INCOME"
          ? transaction.cashMovementType === "REINFORCEMENT"
            ? "REINFORCEMENT"
            : "SALE"
          : transaction.cashMovementType === "WITHDRAWAL"
            ? "WITHDRAWAL"
            : "OTHER_EXPENSE";
      return {
        id: transaction.id,
        occurredAt,
        description:
          transaction.description ??
          (transaction.type === "INCOME"
            ? "Movimentação de entrada"
            : "Movimentação de saída"),
        paymentMethod: transaction.paymentMethod as PaymentMethodValue,
        type: transaction.type,
        movementType,
        cashMovementReason: transaction.cashMovementReason ?? null,
        amount: Number(transaction.amount),
      };
    })
    .sort((left, right) => +new Date(right.occurredAt) - +new Date(left.occurredAt));
}

export async function getRecentCashSessions(
  tenantId: string,
  filters: CashSessionHistoryFilters = {}
): Promise<CashSessionHistoryResult> {
  const rawLimit = filters.limit ?? DEFAULT_HISTORY_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_HISTORY_LIMIT);

  const openedAtFilter: { gte?: Date; lte?: Date } = {};
  if (filters.from) openedAtFilter.gte = filters.from;
  if (filters.to) openedAtFilter.lte = filters.to;
  const hasDateFilter = Object.keys(openedAtFilter).length > 0;

  const rows = await db.cashRegisterSession.findMany({
    where: {
      tenantId,
      ...(filters.accountId ? { accountId: filters.accountId } : {}),
      ...(hasDateFilter ? { openedAt: openedAtFilter } : {}),
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
        },
      },
      openedByUser: {
        select: {
          name: true,
        },
      },
      closedByUser: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const sessions = await Promise.all(
    page.map(async (session) => {
      const totals = await getCashSessionTotals(
        tenantId,
        session.accountId,
        session.id,
        session.openedAt,
        session.closedAt
      );

      const expectedBalance = roundCurrency(
        Number(session.openingAmount) + totals.totalEntries - totals.totalExpenses
      );
      const closingAmount = session.closingAmount != null ? Number(session.closingAmount) : null;

      return {
        id: session.id,
        accountId: session.account.id,
        accountName: session.account.name,
        openedAt: session.openedAt.toISOString(),
        closedAt: session.closedAt?.toISOString() ?? null,
        openedByName: session.openedByUser.name,
        closedByName: session.closedByUser?.name ?? null,
        openingAmount: Number(session.openingAmount),
        closingAmount,
        expectedBalance,
        difference:
          closingAmount != null ? roundCurrency(closingAmount - expectedBalance) : null,
        status: session.status,
        totalSales: totals.totalSales,
        totalReinforcements: totals.totalReinforcements,
        totalWithdrawals: totals.totalWithdrawals,
        totalOtherExpenses: totals.totalOtherExpenses,
      };
    })
  );

  return {
    sessions,
    hasMore,
    totalReturned: sessions.length,
  };
}

export async function getCashSessionDetail(
  tenantId: string,
  sessionId: string
): Promise<CashSessionDetail | null> {
  const session = await db.cashRegisterSession.findFirst({
    where: { id: sessionId, tenantId },
    include: {
      account: {
        select: { id: true, name: true },
      },
      openedByUser: {
        select: { name: true },
      },
      closedByUser: {
        select: { name: true },
      },
    },
  });

  if (!session) return null;

  const [totals, movements] = await Promise.all([
    getCashSessionTotals(
      tenantId,
      session.accountId,
      session.id,
      session.openedAt,
      session.closedAt
    ),
    getCashSessionMovements(tenantId, session.id),
  ]);

  const salesMap = new Map<PaymentMethodValue, { total: number; count: number }>();
  for (const movement of movements) {
    if (movement.movementType !== "SALE") continue;
    const existing = salesMap.get(movement.paymentMethod) ?? { total: 0, count: 0 };
    existing.total += movement.amount;
    existing.count += 1;
    salesMap.set(movement.paymentMethod, existing);
  }
  const salesByPaymentMethod = Array.from(salesMap.entries())
    .map(([paymentMethod, { total, count }]) => ({
      paymentMethod,
      total: roundCurrency(total),
      count,
    }))
    .sort((a, b) => b.total - a.total);

  const expectedBalance = roundCurrency(
    Number(session.openingAmount) + totals.totalEntries - totals.totalExpenses
  );
  const closingAmount = session.closingAmount != null ? Number(session.closingAmount) : null;

  return {
    id: session.id,
    status: session.status,
    accountId: session.account.id,
    accountName: session.account.name,
    openedAt: session.openedAt.toISOString(),
    closedAt: session.closedAt?.toISOString() ?? null,
    openedByName: session.openedByUser.name,
    closedByName: session.closedByUser?.name ?? null,
    openingAmount: Number(session.openingAmount),
    closingAmount,
    openingNotes: session.openingNotes ?? null,
    closingNotes: session.closingNotes ?? null,
    totalSales: totals.totalSales,
    totalReinforcements: totals.totalReinforcements,
    totalWithdrawals: totals.totalWithdrawals,
    totalOtherExpenses: totals.totalOtherExpenses,
    totalEntries: totals.totalEntries,
    totalExpenses: totals.totalExpenses,
    expectedBalance,
    difference: closingAmount != null ? roundCurrency(closingAmount - expectedBalance) : null,
    salesByPaymentMethod,
    movements,
  };
}

export async function getCashRegisterOverview(
  tenantId: string
): Promise<CashRegisterOverview> {
  const [accounts, currentSession, historyResult] = await Promise.all([
    db.financialAccount.findMany({
      where: {
        tenantId,
        type: "CASH",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        balance: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    db.cashRegisterSession.findFirst({
      where: {
        tenantId,
        status: "OPEN",
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        openedByUser: {
          select: {
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        openedAt: "desc",
      },
    }),
    getRecentCashSessions(tenantId, { limit: DEFAULT_HISTORY_LIMIT }),
  ]);

  const currentSessionWithTotals = currentSession
    ? await (async () => {
        const totals = await getCashSessionTotals(
          tenantId,
          currentSession.accountId,
          currentSession.id,
          currentSession.openedAt,
          null
        );

        return {
          id: currentSession.id,
          status: currentSession.status,
          accountId: currentSession.account.id,
          accountName: currentSession.account.name,
          openedAt: currentSession.openedAt.toISOString(),
          openedByName: currentSession.openedByUser.name,
          openedByAvatarUrl: currentSession.openedByUser.avatarUrl ?? null,
          openingAmount: Number(currentSession.openingAmount),
          openingNotes: currentSession.openingNotes ?? null,
          totalEntries: totals.totalEntries,
          totalExpenses: totals.totalExpenses,
          totalSales: totals.totalSales,
          totalReinforcements: totals.totalReinforcements,
          totalWithdrawals: totals.totalWithdrawals,
          totalOtherExpenses: totals.totalOtherExpenses,
          expectedBalance: roundCurrency(
            Number(currentSession.openingAmount) + totals.totalEntries - totals.totalExpenses
          ),
        };
      })()
    : null;

  const lastClosedAccountBalances: Record<string, number> = {};
  for (const session of historyResult.sessions) {
    if (
      session.status === "CLOSED" &&
      session.closingAmount != null &&
      !(session.accountId in lastClosedAccountBalances)
    ) {
      lastClosedAccountBalances[session.accountId] = session.closingAmount;
    }
  }

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balance: Number(account.balance),
    })),
    currentSession: currentSessionWithTotals,
    recentSessions: historyResult.sessions,
    lastClosedAccountBalances,
  };
}

export async function openCashRegister(
  tenantId: string,
  userId: string,
  input: OpenCashRegisterInput,
  actor?: AuditActor
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      const existingOpenSession = await tx.cashRegisterSession.findFirst({
        where: {
          tenantId,
          status: "OPEN",
        },
        select: {
          id: true,
        },
      });

      if (existingOpenSession) {
        throw new Error("Já existe um caixa aberto para este estabelecimento.");
      }

      const account = await tx.financialAccount.findFirst({
        where: {
          id: input.accountId,
          tenantId,
          isActive: true,
          type: "CASH",
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!account) {
        throw new Error("Conta caixa inválida para abertura.");
      }

      const session = await tx.cashRegisterSession.create({
        data: {
          tenantId,
          accountId: account.id,
          openedByUserId: userId,
          openingAmount: input.openingAmount,
          openingNotes: input.openingNotes ?? null,
        },
        select: {
          id: true,
        },
      });

      if (actor) {
        await recordAudit(tx, {
          tenantId,
          actor,
          action: "CASH_OPENED",
          entityType: "CashSession",
          entityId: session.id,
          summary: `Abertura de caixa em ${account.name} · valor inicial ${formatMoney(input.openingAmount)}`,
          snapshot: {
            accountId: account.id,
            accountName: account.name,
            openingAmount: input.openingAmount,
            openingNotes: input.openingNotes ?? null,
          },
        });
      }

      return {
        sessionId: session.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao abrir o caixa.";
    return { success: false, error: message };
  }
}

export async function closeCashRegister(
  tenantId: string,
  userId: string,
  input: CloseCashRegisterInput,
  actor?: AuditActor
): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      const session = await tx.cashRegisterSession.findFirst({
        where: {
          id: input.sessionId,
          tenantId,
          status: "OPEN",
        },
        select: {
          id: true,
          accountId: true,
          openingAmount: true,
          openedAt: true,
          account: { select: { name: true } },
        },
      });

      if (!session) {
        throw new Error("Nenhum caixa aberto encontrado para fechamento.");
      }

      const updated = await tx.cashRegisterSession.update({
        where: {
          id: session.id,
        },
        data: {
          status: "CLOSED",
          closedByUserId: userId,
          closingAmount: input.closingAmount,
          closingNotes: input.closingNotes ?? null,
          closedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      if (actor) {
        const totals = await getCashSessionTotals(
          tenantId,
          session.accountId,
          session.id,
          session.openedAt,
          null
        );
        const expectedBalance = roundCurrency(
          Number(session.openingAmount) + totals.totalEntries - totals.totalExpenses
        );
        const difference = roundCurrency(Number(input.closingAmount) - expectedBalance);
        await recordAudit(tx, {
          tenantId,
          actor,
          action: "CASH_CLOSED",
          entityType: "CashSession",
          entityId: session.id,
          summary: `Fechamento de caixa em ${session.account.name} · ${formatMoney(input.closingAmount)} (diferença ${formatSignedMoney(difference)})`,
          snapshot: {
            accountId: session.accountId,
            accountName: session.account.name,
            closingAmount: input.closingAmount,
            closingNotes: input.closingNotes ?? null,
            expectedBalance,
            difference,
          },
        });
      }

      return {
        sessionId: updated.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao fechar o caixa.";
    return { success: false, error: message };
  }
}

/**
 * Cria uma movimentação "livre" (Transaction genérica) vinculada a um caixa aberto.
 * Mantido para compatibilidade com o ManualTransactionModal antigo; novos fluxos
 * de sangria/reforço devem usar `recordCashMovement`.
 */
export async function createManualCashTransaction(
  tenantId: string,
  input: ManualCashTransactionInput
): Promise<ActionResult<{ transactionId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      const openSession = await tx.cashRegisterSession.findFirst({
        where: {
          tenantId,
          accountId: input.accountId,
          status: "OPEN",
        },
        select: {
          id: true,
          accountId: true,
        },
        orderBy: {
          openedAt: "desc",
        },
      });

      if (!openSession) {
        throw new Error("Nenhum caixa aberto foi encontrado para a conta selecionada.");
      }

      const paidAt = new Date();
      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          accountId: input.accountId,
          cashRegisterSessionId: openSession.id,
          type: input.type,
          paymentMethod: input.paymentMethod,
          paymentStatus: "PAID",
          amount: input.amount,
          description: input.description,
          paidAt,
        },
        select: {
          id: true,
        },
      });

      await tx.financialAccount.update({
        where: {
          id: input.accountId,
        },
        data: {
          balance:
            input.type === "INCOME"
              ? { increment: input.amount }
              : { decrement: input.amount },
        },
      });

      return {
        transactionId: transaction.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar a movimentação manual.";
    return { success: false, error: message };
  }
}

/**
 * Registra uma sangria (WITHDRAWAL) ou reforço (REINFORCEMENT) no caixa aberto.
 * Cria uma Transaction tipada com cashMovementType/cashMovementReason e ajusta
 * o saldo da conta financeira no mesmo commit.
 */
export async function recordCashMovement(
  tenantId: string,
  userId: string,
  input: CashMovementInput,
  actor?: AuditActor
): Promise<ActionResult<{ transactionId: string }>> {
  void userId;

  try {
    const result = await db.$transaction(async (tx) => {
      const session = await tx.cashRegisterSession.findFirst({
        where: {
          id: input.sessionId,
          tenantId,
        },
        select: {
          id: true,
          status: true,
          accountId: true,
        },
      });

      if (!session) {
        throw new Error("Sessão de caixa não encontrada.");
      }

      if (session.status !== "OPEN") {
        throw new Error(
          "Caixa está fechado. Abra uma nova sessão para registrar a movimentação."
        );
      }

      const now = new Date();
      const description =
        input.type === "WITHDRAWAL"
          ? `Sangria — ${input.reason}`
          : `Reforço — ${input.reason}`;

      const baseNotes = input.notes?.trim();
      const combinedDescription = baseNotes
        ? `${description} · ${baseNotes}`
        : description;

      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          accountId: session.accountId,
          cashRegisterSessionId: session.id,
          type: input.type === "WITHDRAWAL" ? "EXPENSE" : "INCOME",
          paymentMethod: "CASH",
          paymentStatus: "PAID",
          amount: input.amount,
          description: combinedDescription,
          cashMovementType: input.type,
          cashMovementReason: input.reason,
          paidAt: now,
        },
        select: {
          id: true,
        },
      });

      await tx.financialAccount.update({
        where: {
          id: session.accountId,
        },
        data: {
          balance:
            input.type === "REINFORCEMENT"
              ? { increment: input.amount }
              : { decrement: input.amount },
        },
      });

      if (actor) {
        await recordAudit(tx, {
          tenantId,
          actor,
          action: input.type === "WITHDRAWAL" ? "CASH_WITHDRAWAL" : "CASH_REINFORCEMENT",
          entityType: "CashMovement",
          entityId: transaction.id,
          summary: `${input.type === "WITHDRAWAL" ? "Sangria" : "Reforço"} de ${formatMoney(input.amount)} · ${input.reason}`,
          snapshot: {
            sessionId: session.id,
            accountId: session.accountId,
            amount: input.amount,
            reason: input.reason,
            notes: input.notes?.trim() || null,
          },
          metadata: { sessionId: session.id },
        });
      }

      return { transactionId: transaction.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao registrar a movimentação de caixa.";
    return { success: false, error: message };
  }
}

// TODO(2.3.1): transferência atômica entre contas (caixa → banco em uma única
// operação, emitindo sangria + reforço espelhados com referência cruzada).
