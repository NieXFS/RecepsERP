import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  addMonthsToCivilMonth,
  civilDateToLocalDate,
  formatCivilDateToQuery,
  formatCivilMonthLabel,
  getCivilDateFromDate,
  getCivilMonthFromDate,
  getCivilMonthRange,
  getDaysInCivilMonth,
  parseCivilDate,
  getTodayCivilDate,
  type CivilMonth,
} from "@/lib/civil-date";
import type {
  CreateExpenseCategoryInput,
  ExpenseInput,
} from "@/lib/validators/expenses";
import type { ActionResult } from "@/types";

type PrismaTransaction = Prisma.TransactionClient;

type ExpenseCategoryRecord = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
};

type ExpenseRecord = {
  id: string;
  description: string;
  type: "FIXED" | "VARIABLE";
  amount: Prisma.Decimal | number;
  dueDate: Date;
  paidAt: Date | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  recurrence: "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY" | "NONE";
  recurrenceGroupId: string | null;
  deletedAt: Date | null;
  notes: string | null;
  categoryId: string;
  accountId: string | null;
  category: {
    name: string;
  };
  account: {
    id: string;
    name: string;
    type: "CASH" | "BANK" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "OTHER";
  } | null;
  transaction?: {
    id: string;
    accountId: string | null;
    amount: Prisma.Decimal | number;
  } | null;
};

export type ExpenseCategoryListItem = ExpenseCategoryRecord;

export type MonthlyExpense = {
  id: string;
  categoryId: string;
  category: string;
  accountId: string | null;
  accountName: string | null;
  accountType: string | null;
  description: string;
  type: "FIXED" | "VARIABLE";
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  displayStatus: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  recurrence: "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY" | "NONE";
  recurrenceGroupId: string | null;
  notes: string | null;
};

export type MonthlyExpenseSummary = {
  period: CivilMonth & { label: string };
  despesasFixas: number;
  despesasVariaveis: number;
  totalDespesas: number;
  totalPendentes: number;
  fixedPaidCount: number;
  variablePaidCount: number;
  pendingCount: number;
  expenses: MonthlyExpense[];
};

const DEFAULT_EXPENSE_CATEGORIES = [
  "Aluguel",
  "Energia elétrica",
  "Água",
  "Internet / Telefone",
  "Software / Sistemas",
  "Contador / Contabilidade",
  "Marketing / Anúncios",
  "Materiais e insumos",
  "Manutenção",
  "Salários / Pró-labore",
  "Plano de saúde",
  "Outros",
] as const;

const RECURRENCE_INTERVALS = {
  MONTHLY: 1,
  BIMONTHLY: 2,
  QUARTERLY: 3,
  SEMIANNUAL: 6,
  YEARLY: 12,
  NONE: 0,
} as const;

/**
 * Garante que o tenant possua as categorias padrão de despesas na primeira utilização.
 */
export async function ensureDefaultExpenseCategories(
  tenantId: string,
  tx: PrismaTransaction | typeof db = db
) {
  await tx.expenseCategory.createMany({
    data: DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
      tenantId,
      name,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
}

/**
 * Lista as categorias de despesas disponíveis para o tenant autenticado.
 */
export async function getExpenseCategories(
  tenantId: string
): Promise<ExpenseCategoryListItem[]> {
  await ensureDefaultExpenseCategories(tenantId);

  const categories = await db.expenseCategory.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      description: true,
      isDefault: true,
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return categories;
}

/**
 * Cria uma categoria customizada, garantindo unicidade do nome por tenant.
 */
export async function createExpenseCategory(
  tenantId: string,
  input: CreateExpenseCategoryInput
): Promise<ActionResult<{ categoryId: string }>> {
  await ensureDefaultExpenseCategories(tenantId);

  const normalizedName = input.name.trim();

  const existingCategory = await db.expenseCategory.findFirst({
    where: {
      tenantId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });

  if (existingCategory) {
    return {
      success: false,
      error: "Já existe uma categoria com este nome.",
    };
  }

  const category = await db.expenseCategory.create({
    data: {
      tenantId,
      name: normalizedName,
      description: input.description?.trim() || null,
      isDefault: false,
    },
    select: { id: true },
  });

  return {
    success: true,
    data: { categoryId: category.id },
  };
}

/**
 * Gera as ocorrências mensais pendentes de despesas recorrentes sem poluir o banco.
 * A lógica replica somente até o mês solicitado e mantém idempotência por grupo.
 */
export async function syncRecurringExpensesForMonth(
  tenantId: string,
  period: CivilMonth,
  tx: PrismaTransaction | typeof db = db
) {
  const { start } = getCivilMonthRange(period);

  const recurringExpenses = await tx.expense.findMany({
    where: {
      tenantId,
      deletedAt: null,
      type: "FIXED",
      recurrence: { not: "NONE" },
      dueDate: { lt: start },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  if (recurringExpenses.length === 0) {
    return;
  }

  const groupedExpenses = new Map<string, typeof recurringExpenses>();

  for (const expense of recurringExpenses) {
    const groupKey = expense.recurrenceGroupId ?? expense.id;
    const existingGroup = groupedExpenses.get(groupKey) ?? [];
    existingGroup.push(expense);
    groupedExpenses.set(groupKey, existingGroup);
  }

  for (const [groupKey, expenses] of groupedExpenses.entries()) {
    let latestOccurrence = expenses[expenses.length - 1];
    const interval = RECURRENCE_INTERVALS[latestOccurrence.recurrence];

    if (interval === 0) {
      continue;
    }

    while (
      compareCivilMonths(getCivilMonthFromDate(latestOccurrence.dueDate), period) < 0
    ) {
      const nextMonth = addMonthsToCivilMonth(
        getCivilMonthFromDate(latestOccurrence.dueDate),
        interval
      );

      if (compareCivilMonths(nextMonth, period) > 0) {
        break;
      }

      const existingOccurrence = await tx.expense.findFirst({
        where: {
          tenantId,
          recurrenceGroupId: groupKey,
          dueDate: {
            gte: getCivilMonthRange(nextMonth).start,
            lt: getCivilMonthRange(nextMonth).endExclusive,
          },
        },
        orderBy: { dueDate: "desc" },
      });

      if (existingOccurrence) {
        latestOccurrence = existingOccurrence;
        continue;
      }

      const nextExpense = await tx.expense.create({
        data: {
          tenantId,
          categoryId: latestOccurrence.categoryId,
          accountId: latestOccurrence.accountId,
          description: latestOccurrence.description,
          type: latestOccurrence.type,
          amount: latestOccurrence.amount,
          dueDate: buildRecurringDueDate(latestOccurrence.dueDate, nextMonth),
          paidAt: null,
          status: "PENDING",
          recurrence: latestOccurrence.recurrence,
          recurrenceGroupId: groupKey,
          notes: latestOccurrence.notes,
        },
      });

      latestOccurrence = nextExpense;
    }
  }
}

/**
 * Retorna o resumo mensal das despesas do tenant, incluindo recorrência automática
 * e status visual de vencimento.
 */
export async function getMonthlyExpenses(
  tenantId: string,
  period: CivilMonth
): Promise<MonthlyExpenseSummary> {
  await db.$transaction(async (tx) => {
    await ensureDefaultExpenseCategories(tenantId, tx);
    await syncRecurringExpensesForMonth(tenantId, period, tx);
  });

  const { start, endExclusive } = getCivilMonthRange(period);

  const expenses = await db.expense.findMany({
    where: {
      tenantId,
      deletedAt: null,
      dueDate: {
        gte: start,
        lt: endExclusive,
      },
    },
    include: {
      category: {
        select: { name: true },
      },
      account: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  const serializedExpenses = expenses.map(serializeExpense);
  const paidFixed = serializedExpenses.filter(
    (expense) => expense.type === "FIXED" && expense.status === "PAID"
  );
  const paidVariable = serializedExpenses.filter(
    (expense) => expense.type === "VARIABLE" && expense.status === "PAID"
  );
  const pendingExpenses = serializedExpenses.filter(
    (expense) =>
      expense.displayStatus === "PENDING" || expense.displayStatus === "OVERDUE"
  );

  const despesasFixas = sumExpenses(paidFixed);
  const despesasVariaveis = sumExpenses(paidVariable);
  const totalPendentes = sumExpenses(pendingExpenses);

  return {
    period: {
      ...period,
      label: capitalize(formatCivilMonthLabel(period)),
    },
    despesasFixas,
    despesasVariaveis,
    totalDespesas: roundCurrency(despesasFixas + despesasVariaveis),
    totalPendentes,
    fixedPaidCount: paidFixed.length,
    variablePaidCount: paidVariable.length,
    pendingCount: pendingExpenses.length,
    expenses: serializedExpenses,
  };
}

/**
 * Cria uma despesa operacional preservando a identidade do registro
 * e já configurando o grupo de recorrência quando aplicável.
 */
export async function createExpense(
  tenantId: string,
  input: ExpenseInput
): Promise<ActionResult<{ expenseId: string }>> {
  const dueDate = parseCivilDate(input.dueDate);

  if (!dueDate) {
    return { success: false, error: "Informe uma data de vencimento válida." };
  }

  const category = await db.expenseCategory.findFirst({
    where: {
      id: input.categoryId,
      tenantId,
    },
    select: { id: true },
  });

  if (!category) {
    return { success: false, error: "Categoria de despesa inválida." };
  }

  if (input.accountId) {
    const account = await db.financialAccount.findFirst({
      where: {
        id: input.accountId,
        tenantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!account) {
      return { success: false, error: "Conta financeira inválida para esta despesa." };
    }
  }

  const recurrenceGroupId =
    input.type === "FIXED" && input.recurrence !== "NONE"
      ? randomUUID()
      : null;

  const expense = await db.expense.create({
    data: {
      tenantId,
      categoryId: input.categoryId,
      accountId: input.accountId ?? null,
      description: input.description.trim(),
      type: input.type,
      amount: input.amount,
      dueDate: civilDateToLocalDate(dueDate, { hour: 12 }),
      status: "PENDING",
      recurrence: input.type === "FIXED" ? input.recurrence : "NONE",
      recurrenceGroupId,
      notes: input.notes?.trim() || null,
    },
    select: { id: true },
  });

  return {
    success: true,
    data: { expenseId: expense.id },
  };
}

/**
 * Atualiza uma despesa ainda não paga. Despesas liquidadas precisam ter o
 * pagamento cancelado antes de receber alterações cadastrais.
 */
export async function updateExpense(
  tenantId: string,
  expenseId: string,
  input: Partial<ExpenseInput>
): Promise<ActionResult<{ expenseId: string }>> {
  const nextDueDate = input.dueDate ? parseCivilDate(input.dueDate) : null;

  if (input.dueDate && !nextDueDate) {
    return { success: false, error: "Informe uma data de vencimento válida." };
  }

  const expense = await db.expense.findFirst({
    where: { id: expenseId, tenantId, deletedAt: null },
    select: {
      id: true,
      status: true,
      recurrenceGroupId: true,
    },
  });

  if (!expense) {
    return { success: false, error: "Despesa não encontrada." };
  }

  if (expense.status === "PAID") {
    return {
      success: false,
      error: "Cancele o pagamento antes de editar esta despesa.",
    };
  }

  if (input.categoryId) {
    const category = await db.expenseCategory.findFirst({
      where: {
        id: input.categoryId,
        tenantId,
      },
      select: { id: true },
    });

    if (!category) {
      return { success: false, error: "Categoria de despesa inválida." };
    }
  }

  if (input.accountId) {
    const account = await db.financialAccount.findFirst({
      where: {
        id: input.accountId,
        tenantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!account) {
      return { success: false, error: "Conta financeira inválida para esta despesa." };
    }
  }

  const nextType = input.type;
  const nextRecurrence =
    nextType === "VARIABLE"
      ? "NONE"
      : input.recurrence;

  await db.expense.update({
    where: { id: expenseId },
    data: {
      categoryId: input.categoryId,
      accountId: input.accountId !== undefined ? input.accountId : undefined,
      description: input.description?.trim(),
      type: nextType,
      amount: input.amount,
      dueDate: nextDueDate
        ? civilDateToLocalDate(nextDueDate, { hour: 12 })
        : undefined,
      recurrence:
        nextRecurrence ??
        (nextType === "VARIABLE" ? "NONE" : undefined),
      recurrenceGroupId:
        nextType === "VARIABLE"
          ? null
          : input.recurrence && input.recurrence !== "NONE"
            ? expense.recurrenceGroupId ?? randomUUID()
            : input.recurrence === "NONE"
              ? null
              : undefined,
      notes: input.notes != null ? input.notes.trim() || null : undefined,
      status:
        expense.status === "CANCELLED"
          ? "PENDING"
          : undefined,
    },
  });

  return {
    success: true,
    data: { expenseId },
  };
}

/**
 * Marca uma despesa como paga e registra a saída correspondente no extrato/caixa.
 */
export async function markExpenseAsPaid(
  tenantId: string,
  expenseId: string,
  accountId?: string | null
): Promise<ActionResult<{ expenseId: string; transactionId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: { id: expenseId, tenantId, deletedAt: null },
        include: {
          category: {
            select: { name: true },
          },
          account: {
            select: {
              id: true,
              type: true,
            },
          },
          transaction: {
            select: {
              id: true,
              accountId: true,
            },
          },
        },
      });

      if (!expense) {
        throw new Error("Despesa não encontrada.");
      }

      if (expense.status === "PAID") {
        throw new Error("Esta despesa já está marcada como paga.");
      }

      if (expense.status === "CANCELLED") {
        throw new Error("Reative a despesa antes de registrá-la como paga.");
      }

      if (expense.transaction) {
        throw new Error("Esta despesa já possui um lançamento financeiro vinculado.");
      }

      const resolvedAccount =
        accountId === null
          ? null
          : await resolveExpenseAccount(
              tx,
              tenantId,
              accountId ?? expense.accountId ?? undefined
            );
      const paidAt = new Date();

      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          expenseId: expense.id,
          accountId: resolvedAccount?.id ?? null,
          type: "EXPENSE",
          paymentMethod: inferPaymentMethodFromAccountType(resolvedAccount?.type),
          paymentStatus: "PAID",
          amount: expense.amount,
          dueDate: expense.dueDate,
          paidAt,
          description: buildExpenseTransactionDescription(
            expense.description,
            expense.category.name
          ),
        },
        select: {
          id: true,
          accountId: true,
        },
      });

      if (resolvedAccount?.id) {
        await tx.financialAccount.update({
          where: { id: resolvedAccount.id },
          data: {
            balance: {
              decrement: expense.amount,
            },
          },
        });
      }

      await tx.expense.update({
        where: { id: expense.id },
        data: {
          status: "PAID",
          paidAt,
        },
      });

      return {
        expenseId: expense.id,
        transactionId: transaction.id,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao registrar o pagamento da despesa.",
    };
  }
}

/**
 * Cancela o pagamento de uma despesa e remove o lançamento financeiro associado.
 */
export async function cancelExpensePayment(
  tenantId: string,
  expenseId: string
): Promise<ActionResult<{ expenseId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: { id: expenseId, tenantId, deletedAt: null },
        include: {
          transaction: {
            select: {
              id: true,
              accountId: true,
              amount: true,
            },
          },
        },
      });

      if (!expense) {
        throw new Error("Despesa não encontrada.");
      }

      if (expense.status !== "PAID") {
        throw new Error("Somente despesas pagas podem ter o pagamento cancelado.");
      }

      if (expense.transaction?.accountId) {
        await tx.financialAccount.update({
          where: { id: expense.transaction.accountId },
          data: {
            balance: {
              increment: expense.transaction.amount,
            },
          },
        });
      }

      if (expense.transaction) {
        await tx.transaction.delete({
          where: { id: expense.transaction.id },
        });
      }

      await tx.expense.update({
        where: { id: expense.id },
        data: {
          status: "PENDING",
          paidAt: null,
        },
      });

      return { expenseId: expense.id };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro ao cancelar o pagamento da despesa.",
    };
  }
}

/**
 * Cancela uma despesa ainda não paga, preservando o histórico para auditoria.
 */
export async function cancelExpense(
  tenantId: string,
  expenseId: string
): Promise<ActionResult<{ expenseId: string }>> {
  const expense = await db.expense.findFirst({
    where: { id: expenseId, tenantId, deletedAt: null },
    select: {
      id: true,
      status: true,
    },
  });

  if (!expense) {
    return { success: false, error: "Despesa não encontrada." };
  }

  if (expense.status === "PAID") {
    return {
      success: false,
      error: "Não é possível cancelar uma despesa já paga.",
    };
  }

  if (expense.status === "CANCELLED") {
    return {
      success: true,
      data: { expenseId: expense.id },
    };
  }

  await db.expense.update({
    where: { id: expense.id },
    data: { status: "CANCELLED" },
  });

  return {
    success: true,
    data: { expenseId: expense.id },
  };
}

/**
 * Exclui uma despesa somente quando ainda não houve pagamento efetivo.
 */
export async function deleteExpense(
  tenantId: string,
  expenseId: string,
  options?: {
    deleteAllFuture?: boolean;
  }
): Promise<ActionResult<{ expenseId: string; deletedCount: number }>> {
  const deleteAllFuture = options?.deleteAllFuture ?? false;

  try {
    const result = await db.$transaction(async (tx) => {
      const expense = await tx.expense.findFirst({
        where: { id: expenseId, tenantId, deletedAt: null },
        select: {
          id: true,
          status: true,
          dueDate: true,
          recurrence: true,
          recurrenceGroupId: true,
        },
      });

      if (!expense) {
        throw new Error("Despesa não encontrada.");
      }

      if (expense.status === "PAID") {
        throw new Error("Não é permitido excluir despesas já pagas.");
      }

      const deletedAt = new Date();

      if (deleteAllFuture && expense.recurrenceGroupId) {
        if (expense.status !== "PENDING") {
          throw new Error("A exclusão em cascata só pode ser aplicada em despesas pendentes.");
        }

        await tx.expense.updateMany({
          where: {
            tenantId,
            recurrenceGroupId: expense.recurrenceGroupId,
            deletedAt: null,
            status: {
              not: "PENDING",
            },
            dueDate: {
              gte: expense.dueDate,
            },
          },
          data: {
            recurrence: "NONE",
          },
        });

        const previousExpense = await tx.expense.findFirst({
          where: {
            tenantId,
            recurrenceGroupId: expense.recurrenceGroupId,
            deletedAt: null,
            dueDate: {
              lt: expense.dueDate,
            },
          },
          orderBy: {
            dueDate: "desc",
          },
          select: {
            id: true,
          },
        });

        if (previousExpense) {
          await tx.expense.update({
            where: {
              id: previousExpense.id,
            },
            data: {
              recurrence: "NONE",
            },
          });
        }

        const deletedExpenses = await tx.expense.updateMany({
          where: {
            tenantId,
            recurrenceGroupId: expense.recurrenceGroupId,
            deletedAt: null,
            status: "PENDING",
            dueDate: {
              gte: expense.dueDate,
            },
          },
          data: {
            deletedAt,
          },
        });

        return {
          expenseId: expense.id,
          deletedCount: deletedExpenses.count,
        };
      }

      await tx.expense.update({
        where: { id: expense.id },
        data: { deletedAt },
      });

      return {
        expenseId: expense.id,
        deletedCount: 1,
      };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir a despesa.",
    };
  }
}

function buildExpenseTransactionDescription(
  description: string,
  categoryName: string
) {
  return `${description} · ${categoryName}`;
}

function inferPaymentMethodFromAccountType(
  accountType?: "CASH" | "BANK" | "CREDIT_CARD" | "DEBIT_CARD" | "PIX" | "OTHER"
) {
  switch (accountType) {
    case "BANK":
      return "BANK_TRANSFER";
    case "CREDIT_CARD":
      return "CREDIT_CARD";
    case "DEBIT_CARD":
      return "DEBIT_CARD";
    case "PIX":
      return "PIX";
    case "OTHER":
      return "OTHER";
    case "CASH":
    default:
      return "CASH";
  }
}

async function resolveExpenseAccount(
  tx: PrismaTransaction,
  tenantId: string,
  accountId?: string
) {
  if (accountId) {
    const account = await tx.financialAccount.findFirst({
      where: {
        id: accountId,
        tenantId,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!account) {
      throw new Error("Conta financeira inválida para registrar a despesa.");
    }

    return account;
  }

  const openSession = await tx.cashRegisterSession.findFirst({
    where: {
      tenantId,
      status: "OPEN",
    },
    select: {
      accountId: true,
      account: {
        select: {
          id: true,
          type: true,
        },
      },
    },
    orderBy: {
      openedAt: "desc",
    },
  });

  if (openSession?.account) {
    return openSession.account;
  }

  const fallbackAccount = await tx.financialAccount.findFirst({
    where: {
      tenantId,
      isActive: true,
    },
    select: {
      id: true,
      type: true,
    },
    orderBy: [
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
  });

  return fallbackAccount;
}

function buildRecurringDueDate(currentDueDate: Date, targetMonth: CivilMonth) {
  const currentDay = getCivilDateFromDate(currentDueDate).day;
  const targetDay = Math.min(currentDay, getDaysInCivilMonth(targetMonth));

  return civilDateToLocalDate(
    {
      year: targetMonth.year,
      month: targetMonth.month,
      day: targetDay,
    },
    { hour: 12 }
  );
}

function compareCivilMonths(a: CivilMonth, b: CivilMonth) {
  return a.year === b.year ? a.month - b.month : a.year - b.year;
}

function getExpenseDisplayStatus(expense: Pick<ExpenseRecord, "status" | "dueDate">) {
  if (expense.status === "PENDING") {
    const today = formatCivilDateToQuery(getTodayCivilDate());
    const dueDate = formatCivilDateToQuery(getCivilDateFromDate(expense.dueDate));

    if (dueDate < today) {
      return "OVERDUE";
    }
  }

  return expense.status;
}

function serializeExpense(expense: ExpenseRecord): MonthlyExpense {
  return {
    id: expense.id,
    categoryId: expense.categoryId,
    category: expense.category.name,
    accountId: expense.accountId,
    accountName: expense.account?.name ?? null,
    accountType: expense.account?.type ?? null,
    description: expense.description,
    type: expense.type,
    amount: roundCurrency(Number(expense.amount)),
    dueDate: formatCivilDateToQuery(getCivilDateFromDate(expense.dueDate)),
    paidAt: expense.paidAt?.toISOString() ?? null,
    status: expense.status,
    displayStatus: getExpenseDisplayStatus(expense),
    recurrence: expense.recurrence,
    recurrenceGroupId: expense.recurrenceGroupId,
    notes: expense.notes,
  };
}

function sumExpenses(expenses: Pick<MonthlyExpense, "amount">[]) {
  return roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
