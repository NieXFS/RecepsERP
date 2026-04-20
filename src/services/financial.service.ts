import { db } from "@/lib/db";
import {
  normalizeAppointmentStatus,
  type AppointmentStoredStatus,
} from "@/lib/appointments/status";
import {
  addDaysToCivilDate,
  formatCivilDateToQuery,
  getCivilDateFromDate,
  getCivilDayRange,
  getCivilMonthRange,
  getTodayCivilDate,
  type CivilDate,
} from "@/lib/civil-date";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodValue,
} from "@/lib/payment-methods";
import type { Role } from "@/generated/prisma/enums";
import type {
  CloseCashRegisterInput,
  ManualCashTransactionInput,
  OpenCashRegisterInput,
} from "@/lib/validators/financial";
import type { ActionResult } from "@/types";

type CheckoutOptions = {
  paymentMethod?: PaymentMethodValue;
  accountId: string;
  installments?: number; // Quantidade de parcelas (ex: 3x no cartão)
  finalStatus?: "COMPLETED" | "PAID";
};

const ALERT_THRESHOLDS = {
  EXPENSE_DUE_SOON_DAYS: 2,
  COMMISSION_STALE_DAYS: 15,
  CASH_OPEN_STALE_HOURS: 12,
  STATEMENT_IDLE_DAYS: 2,
} as const;

export type FinancialAlert = {
  id:
    | "expenses_due_soon"
    | "expenses_overdue"
    | "commissions_stale"
    | "cash_open_long"
    | "statement_idle";
  severity: "info" | "warning" | "critical";
  title: string;
  ctaLabel: string;
  ctaHref: string;
  metadata?: Record<string, unknown>;
};

type StatementTypeFilter = "ALL" | "INCOME" | "EXPENSE";
type StatementStatusFilter = "ALL" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";

type AppointmentDescriptionInput = {
  customerName: string | null | undefined;
  serviceNames: string[];
  installmentNumber?: number | null;
  totalInstallments?: number | null;
};

/**
 * Monta a descrição humana de uma transação vinculada a agendamento.
 * Formato: "Cliente — Serviço" ou "Cliente — Serviço +N" / "Cliente — Serviço (i/N)".
 */
export function buildAppointmentDescription(
  input: AppointmentDescriptionInput
): string {
  const customer = input.customerName?.trim() || "Cliente avulso";
  const services = input.serviceNames.filter(Boolean);

  let servicePart: string;
  if (services.length === 0) {
    servicePart = "Atendimento";
  } else if (services.length === 1) {
    servicePart = services[0]!;
  } else {
    servicePart = `${services[0]} +${services.length - 1}`;
  }

  const hasInstallments =
    typeof input.installmentNumber === "number" &&
    typeof input.totalInstallments === "number" &&
    input.totalInstallments > 1;

  const installmentPart = hasInstallments
    ? ` (${input.installmentNumber}/${input.totalInstallments})`
    : "";

  return `${customer} — ${servicePart}${installmentPart}`;
}
type CommissionViewerScope = {
  userId: string;
  role: Role;
};

export type FinancialStatementEntry = {
  id: string;
  type: "INCOME" | "EXPENSE";
  paymentStatus: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED";
  amount: number;
  description: string | null;
  paymentMethod: string;
  accountName: string | null;
  accountType: string | null;
  effectiveDate: string;
  createdAt: string;
  paidAt: string | null;
  dueDate: string | null;
};

export type FinancialStatementSummary = {
  entradas: number;
  saidas: number;
  saldoPeriodo: number;
  totalLancamentos: number;
};

export type FinancialStatementResult = {
  summary: FinancialStatementSummary;
  entries: FinancialStatementEntry[];
};

export type CashAccountOption = {
  id: string;
  name: string;
  balance: number;
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
    expectedBalance: number;
  } | null;
  recentSessions: Array<{
    id: string;
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
  }>;
};

export type CashSessionMovement = {
  id: string;
  occurredAt: string;
  description: string;
  paymentMethod: PaymentMethodValue;
  type: "INCOME" | "EXPENSE";
  amount: number;
};

export type FinancialOverview = {
  period: {
    label: string;
    startDate: string;
    endDate: string;
  };
  summary: FinancialStatementSummary;
  previousSummary: FinancialStatementSummary;
  dailySeries: Array<{
    date: string;
    entradas: number;
    saidas: number;
  }>;
  statementTrend: Array<{
    date: string;
    count: number;
  }>;
  topProfessionals: Array<{
    id: string;
    name: string;
    revenue: number;
    appointmentCount: number;
  }>;
  topServices: Array<{
    id: string;
    name: string;
    revenue: number;
    soldCount: number;
  }>;
  commissions: {
    generatedTotal: number;
    pendingTotal: number;
    pendingCount: number;
    professionalsWithPending: number;
  };
  cash: {
    status: "OPEN" | "CLOSED";
    accountName: string | null;
    openedByName: string | null;
    openedAt: string | null;
    openingAmount: number;
    expectedBalance: number;
    lastClosedAt: string | null;
  };
  statement: {
    recentCount: number;
    lastTransactionAt: string | null;
  };
  todayCashClosing: {
    total: number;
    methods: Array<{
      paymentMethod: PaymentMethodValue;
      label: string;
      amount: number;
    }>;
  };
  recentActivities: Array<{
    id: string;
    type: "TRANSACTION" | "CASH_OPEN" | "CASH_CLOSE";
    title: string;
    description: string;
    amount: number | null;
    occurredAt: string;
  }>;
};

type FinancialActivityItem = FinancialOverview["recentActivities"][number];

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMonthLabel(date: CivilDate) {
  return new Date(date.year, date.month - 1, 1, 12, 0, 0, 0).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function getPeriodBounds(startDate: CivilDate, endDate: CivilDate) {
  const normalizedStart =
    formatCivilDateToQuery(startDate) <= formatCivilDateToQuery(endDate)
      ? startDate
      : endDate;
  const normalizedEnd =
    formatCivilDateToQuery(startDate) <= formatCivilDateToQuery(endDate)
      ? endDate
      : startDate;

  const start = getCivilDayRange(normalizedStart).start;
  const endExclusive = getCivilDayRange(normalizedEnd).endExclusive;

  return { start, endExclusive };
}

async function getCashSessionMovementTotals(
  tenantId: string,
  accountId: string,
  openedAt: Date,
  closedAt?: Date | null
) {
  const dateWindow = {
    gte: openedAt,
    lt: closedAt ?? new Date(),
  };

  const [incomeAggregate, expenseAggregate] = await Promise.all([
    db.transaction.aggregate({
      where: {
        tenantId,
        accountId,
        type: "INCOME",
        paymentStatus: "PAID",
        OR: [
          {
            createdAt: dateWindow,
          },
          {
            paidAt: dateWindow,
          },
        ],
      },
      _sum: {
        amount: true,
      },
    }),
    db.transaction.aggregate({
      where: {
        tenantId,
        accountId,
        type: "EXPENSE",
        paymentStatus: "PAID",
        OR: [
          {
            createdAt: dateWindow,
          },
          {
            paidAt: dateWindow,
          },
        ],
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    totalEntries: roundCurrency(Number(incomeAggregate._sum.amount ?? 0)),
    totalExpenses: roundCurrency(Number(expenseAggregate._sum.amount ?? 0)),
  };
}

export async function getOpenSessionTransactions(
  tenantId: string,
  accountId: string,
  openedAt: Date
): Promise<CashSessionMovement[]> {
  const transactions = await db.transaction.findMany({
    where: {
      tenantId,
      accountId,
      paymentStatus: "PAID",
      OR: [
        {
          createdAt: {
            gte: openedAt,
          },
        },
        {
          paidAt: {
            gte: openedAt,
          },
        },
      ],
    },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      paymentMethod: true,
      createdAt: true,
      paidAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return transactions
    .map((transaction) => ({
      id: transaction.id,
      occurredAt: (transaction.paidAt ?? transaction.createdAt).toISOString(),
      description:
        transaction.description ??
        (transaction.type === "INCOME" ? "Movimentacao manual de entrada" : "Movimentacao manual de saida"),
      paymentMethod: transaction.paymentMethod as PaymentMethodValue,
      type: transaction.type,
      amount: Number(transaction.amount),
    }))
    .sort((left, right) => +new Date(right.occurredAt) - +new Date(left.occurredAt));
}

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
      error instanceof Error ? error.message : "Erro ao registrar a movimentacao manual.";
    return { success: false, error: message };
  }
}

/**
 * Finaliza um agendamento executando TODO o fluxo financeiro e operacional
 * em uma única transação ACID. Se qualquer etapa falhar, TUDO sofre rollback.
 *
 * Fluxo executado (nesta ordem, dentro de $transaction):
 *
 *  1. VALIDAÇÃO — Verifica se o agendamento existe, pertence ao tenant,
 *     e está em status que permite finalização.
 *
 *  2. COBRANÇA (condicional) — Se for serviço avulso (sem pacote), cria
 *     registro(s) de Transaction (INCOME). Se tiver parcelas, cria uma
 *     Transaction por parcela com dueDate escalonado. Se for sessão de
 *     pacote, pula esta etapa (receita já foi registrada na compra do pacote).
 *
 *  3. COMISSÕES (sempre) — Independente de ser avulso ou pacote, o profissional
 *     trabalhou. Busca a taxa de comissão na ProfessionalService (ou fallback
 *     para a taxa padrão do Professional). Cria um Commission por serviço
 *     com status PENDING, calculando o split clínica vs profissional.
 *
 *  4. BAIXA DE ESTOQUE (sempre) — Para cada serviço executado, busca a ficha
 *     técnica (ServiceMaterial). Decrementa o stockQuantity do Product e
 *     registra um InventoryMovement do tipo EXIT com referência ao appointmentId.
 *
 *  5. ATUALIZAÇÃO DO CLIENTE — Incrementa visitCount e totalSpent do Customer.
 *
 *  6. STATUS — Muda o appointment para COMPLETED.
 */
export async function checkoutAppointment(
  tenantId: string,
  appointmentId: string,
  options: CheckoutOptions
): Promise<ActionResult<{ transactionIds: string[]; commissionIds: string[] }>> {
  const {
    paymentMethod = "CASH",
    accountId,
    installments = 1,
    finalStatus = "COMPLETED",
  } = options;
  const checkoutTimestamp = new Date();

  // --- Busca o agendamento com todos os dados necessários para o checkout ---
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      services: {
        include: {
          service: {
            include: {
              // Ficha técnica: quais produtos são consumidos por este serviço
              materials: { include: { product: true } },
            },
          },
        },
      },
      professional: {
        include: {
          // Tabela de comissão customizada por serviço
          services: true,
        },
      },
      customer: true,
      transaction: {
        select: {
          id: true,
          accountId: true,
          amount: true,
          paymentMethod: true,
          paymentStatus: true,
          paidAt: true,
        },
      },
    },
  });

  if (!appointment) {
    return { success: false, error: "Agendamento não encontrado." };
  }

  const normalizedStatus = normalizeAppointmentStatus(
    appointment.status as AppointmentStoredStatus
  );

  if (normalizedStatus === "PAID") {
    return { success: false, error: "Este agendamento já foi marcado como pago." };
  }

  if (normalizedStatus === "CANCELLED" || normalizedStatus === "NO_SHOW") {
    return { success: false, error: "Não é possível finalizar um agendamento cancelado ou no-show." };
  }

  const destinationAccount = await db.financialAccount.findFirst({
    where: {
      id: accountId,
      tenantId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!destinationAccount) {
    return { success: false, error: "A conta de destino selecionada não está disponível." };
  }

  if (appointment.transaction) {
    try {
      await db.$transaction(async (tx) => {
        const previousAccountId = appointment.transaction?.accountId ?? null;
        const isTransactionAlreadyPaid = appointment.transaction?.paymentStatus === "PAID";
        const transactionAmount = Number(appointment.transaction?.amount ?? 0);

        await tx.transaction.update({
          where: { id: appointment.transaction!.id },
          data: {
            accountId: destinationAccount.id,
            paymentMethod,
            paymentStatus: "PAID",
            paidAt: isTransactionAlreadyPaid
              ? appointment.transaction?.paidAt ?? checkoutTimestamp
              : checkoutTimestamp,
          },
        });

        if (transactionAmount > 0) {
          if (isTransactionAlreadyPaid && previousAccountId && previousAccountId !== destinationAccount.id) {
            await tx.financialAccount.update({
              where: { id: previousAccountId },
              data: { balance: { decrement: transactionAmount } },
            });
          }

          if (!isTransactionAlreadyPaid || previousAccountId !== destinationAccount.id) {
            await tx.financialAccount.update({
              where: { id: destinationAccount.id },
              data: { balance: { increment: transactionAmount } },
            });
          }
        }

        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: finalStatus },
        });
      });

      return {
        success: true,
        data: {
          transactionIds: [appointment.transaction.id],
          commissionIds: [],
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao concluir o checkout.";
      return { success: false, error: message };
    }
  }

  const isPackageSession = !!appointment.customerPackageId;
  const totalAmount = Number(appointment.totalPrice);
  const serviceNames = appointment.services.map((s) => s.service.name);
  const customerName = appointment.customer?.name ?? null;

  try {
    const result = await db.$transaction(async (tx) => {
      const createdTransactionIds: string[] = [];
      const createdCommissionIds: string[] = [];

      // ================================================================
      // ETAPA 1: COBRANÇA — Cria Transaction apenas se for serviço avulso
      // ================================================================
      if (!isPackageSession && totalAmount > 0) {
        if (installments > 1) {
          // Parcelamento: cria uma Transaction por parcela com vencimentos escalonados
          const installmentAmount = Math.round((totalAmount / installments) * 100) / 100;

          for (let i = 1; i <= installments; i++) {
            // Cada parcela vence 30 dias após a anterior
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30 * (i - 1));

            // Ajuste de centavos na última parcela para evitar diferença de arredondamento
            const isLastInstallment = i === installments;
            const amount = isLastInstallment
              ? totalAmount - installmentAmount * (installments - 1)
              : installmentAmount;

            const transaction = await tx.transaction.create({
              data: {
                tenantId,
                appointmentId: i === 1 ? appointmentId : null, // Apenas a 1ª parcela linka ao appointment (@unique)
                accountId: destinationAccount.id,
                type: "INCOME",
                paymentMethod,
                paymentStatus: i === 1 ? "PAID" : "PENDING", // 1ª parcela paga na hora
                amount,
                installmentNumber: i,
                totalInstallments: installments,
                dueDate,
                paidAt: i === 1 ? checkoutTimestamp : null,
                description: buildAppointmentDescription({
                  customerName,
                  serviceNames,
                  installmentNumber: i,
                  totalInstallments: installments,
                }),
              },
            });
            createdTransactionIds.push(transaction.id);
          }
        } else {
          // Pagamento à vista: uma única Transaction marcada como PAID
          const transaction = await tx.transaction.create({
            data: {
              tenantId,
              appointmentId,
              accountId: destinationAccount.id,
              type: "INCOME",
              paymentMethod,
              paymentStatus: "PAID",
              amount: totalAmount,
              installmentNumber: null,
              totalInstallments: null,
              dueDate: null,
              paidAt: checkoutTimestamp,
              description: buildAppointmentDescription({
                customerName,
                serviceNames,
              }),
            },
          });
          createdTransactionIds.push(transaction.id);
        }

        // Atualiza o saldo da conta financeira (se informada)
        // À vista: credita o total. Parcelado: credita apenas a 1ª parcela
        const creditAmount = installments > 1
          ? Math.round((totalAmount / installments) * 100) / 100
          : totalAmount;

        await tx.financialAccount.update({
          where: { id: destinationAccount.id },
          data: { balance: { increment: creditAmount } },
        });
      }

      // ================================================================
      // ETAPA 2: COMISSÕES — Sempre geradas (pacote ou avulso)
      // O profissional trabalhou, então recebe comissão independentemente
      // de como o cliente pagou (à vista, parcelado, ou via pacote).
      // ================================================================
      for (const appointmentService of appointment.services) {
        const servicePrice = Number(appointmentService.price) * appointmentService.quantity;

        // Busca taxa de comissão customizada para este serviço específico.
        // Se não existir, usa a taxa padrão do profissional.
        const professionalService = appointment.professional.services.find(
          (ps) => ps.serviceId === appointmentService.serviceId
        );

        const commissionRate = professionalService?.customCommissionPercent
          ? Number(professionalService.customCommissionPercent)
          : Number(appointment.professional.commissionPercent);

        const commissionValue = Math.round((servicePrice * commissionRate) / 100 * 100) / 100;
        const clinicValue = Math.round((servicePrice - commissionValue) * 100) / 100;

        const commission = await tx.commission.create({
          data: {
            tenantId,
            professionalId: appointment.professionalId,
            appointmentId,
            serviceAmount: servicePrice,
            commissionRate,
            commissionValue,
            clinicValue,
            status: "PENDING", // Será PAID quando a clínica fizer o acerto com o profissional
          },
        });
        createdCommissionIds.push(commission.id);
      }

      // ================================================================
      // ETAPA 3: BAIXA DE ESTOQUE — Consome insumos da ficha técnica
      // Para cada serviço executado, busca os materiais e decrementa
      // o estoque. Se o estoque ficar negativo, a transação inteira
      // sofre rollback (erro propagado pelo throw).
      // ================================================================
      for (const appointmentService of appointment.services) {
        const materials = appointmentService.service.materials;

        for (const material of materials) {
          const quantityToConsume = Number(material.quantity) * appointmentService.quantity;
          const currentStock = Number(material.product.stockQuantity);

          // Validação: impede estoque negativo
          if (currentStock < quantityToConsume) {
            throw new Error(
              `Estoque insuficiente para "${material.product.name}". ` +
              `Disponível: ${currentStock} ${material.product.unit}, ` +
              `Necessário: ${quantityToConsume} ${material.product.unit}. ` +
              `Reponha o estoque antes de finalizar este agendamento.`
            );
          }

          // Decrementa o estoque do produto
          await tx.product.update({
            where: { id: material.productId },
            data: {
              stockQuantity: { decrement: quantityToConsume },
            },
          });

          // Registra a movimentação de saída para rastreabilidade
          await tx.inventoryMovement.create({
            data: {
              tenantId,
              productId: material.productId,
              type: "EXIT",
              quantity: -quantityToConsume, // Negativo para saída
              unitCost: material.product.costPrice,
              reason: `Consumo automático — Agendamento #${appointmentId.slice(-6)}, Serviço: ${appointmentService.service.name}`,
              referenceId: appointmentId,
            },
          });
        }
      }

      // ================================================================
      // ETAPA 4: ATUALIZAÇÃO DO CLIENTE — Incrementa LTV e visitas
      // ================================================================
      await tx.customer.update({
        where: { id: appointment.customerId },
        data: {
          visitCount: { increment: 1 },
          totalSpent: { increment: totalAmount }, // Mesmo em pacote, reflete o valor do serviço
        },
      });

      // ================================================================
      // ETAPA 5: FINALIZA O AGENDAMENTO — Status operacional final
      // ================================================================
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: finalStatus },
      });

      return { transactionIds: createdTransactionIds, commissionIds: createdCommissionIds };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao finalizar agendamento.";
    return { success: false, error: message };
  }
}

/**
 * Marca comissões como PAID no acerto quinzenal/mensal com o profissional.
 * Recebe uma lista de IDs de comissões a serem pagas em lote.
 * Tudo dentro de transação: se uma falhar, nenhuma é marcada.
 */
export async function payCommissions(
  tenantId: string,
  commissionIds: string[]
): Promise<ActionResult<{ paidCount: number }>> {
  if (commissionIds.length === 0) {
    return { success: false, error: "Nenhuma comissão informada." };
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Verifica se todas as comissões existem, pertencem ao tenant e estão PENDING
      const commissions = await tx.commission.findMany({
        where: {
          id: { in: commissionIds },
          tenantId,
        },
      });

      if (commissions.length !== commissionIds.length) {
        throw new Error("Uma ou mais comissões não foram encontradas.");
      }

      const nonPending = commissions.filter((c) => c.status !== "PENDING");
      if (nonPending.length > 0) {
        throw new Error(
          `${nonPending.length} comissão(ões) não estão com status PENDING e não podem ser pagas.`
        );
      }

      // Atualiza todas as comissões para PAID em lote
      await tx.commission.updateMany({
        where: {
          id: { in: commissionIds },
          tenantId,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });

      return { paidCount: commissions.length };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao pagar comissões.";
    return { success: false, error: message };
  }
}

/**
 * Lista comissões pendentes de um profissional para o acerto financeiro.
 * Retorna o total acumulado e os detalhes por agendamento.
 */
export async function getPendingCommissions(
  tenantId: string,
  professionalId: string,
  viewer?: CommissionViewerScope
) {
  const scopedProfessionalId = await resolveScopedProfessionalId(
    tenantId,
    professionalId,
    viewer
  );

  const commissions = await db.commission.findMany({
    where: {
      tenantId,
      professionalId: scopedProfessionalId,
      status: "PENDING",
    },
    include: {
      appointment: {
        select: {
          id: true,
          startTime: true,
          customer: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalPending = commissions.reduce(
    (sum, c) => sum + Number(c.commissionValue),
    0
  );

  return {
    commissions,
    totalPending: Math.round(totalPending * 100) / 100,
    count: commissions.length,
  };
}

/**
 * Lista todos os profissionais do tenant com resumo de comissões pendentes.
 * Usado na tela de Fechamento de Comissões para exibir o painel geral.
 * Para cada profissional, retorna a soma PENDING e a lista detalhada de serviços.
 */
export async function getCommissionsSummaryByProfessional(
  tenantId: string,
  viewer?: CommissionViewerScope
) {
  const professionalScope =
    viewer?.role === "PROFESSIONAL"
      ? {
          userId: viewer.userId,
        }
      : {};

  const professionals = await db.professional.findMany({
    where: { tenantId, isActive: true, deletedAt: null, ...professionalScope },
    include: {
      user: { select: { name: true, email: true } },
      commissions: {
        where: { status: "PENDING" },
        include: {
          appointment: {
            select: {
              id: true,
              startTime: true,
              customer: { select: { name: true } },
              services: {
                include: { service: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return professionals.map((p) => {
    const totalPending = p.commissions.reduce(
      (sum, c) => sum + Number(c.commissionValue),
      0
    );
    const totalClinic = p.commissions.reduce(
      (sum, c) => sum + Number(c.clinicValue),
      0
    );

    return {
      id: p.id,
      name: p.user.name,
      email: p.user.email,
      specialty: p.specialty,
      commissionPercent: Number(p.commissionPercent),
      totalPending: Math.round(totalPending * 100) / 100,
      totalClinic: Math.round(totalClinic * 100) / 100,
      commissionCount: p.commissions.length,
      commissions: p.commissions.map((c) => ({
        id: c.id,
        date: c.appointment.startTime.toISOString(),
        customerName: c.appointment.customer?.name ?? "—",
        services: c.appointment.services.map((s) => s.service.name).join(", "),
        serviceAmount: Number(c.serviceAmount),
        commissionRate: Number(c.commissionRate),
        commissionValue: Number(c.commissionValue),
        clinicValue: Number(c.clinicValue),
      })),
    };
  });
}

async function resolveScopedProfessionalId(
  tenantId: string,
  professionalId: string,
  viewer?: CommissionViewerScope
) {
  if (!viewer || viewer.role !== "PROFESSIONAL") {
    return professionalId;
  }

  const professional = await db.professional.findFirst({
    where: {
      tenantId,
      userId: viewer.userId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!professional) {
    throw new Error("Perfil profissional não encontrado para este usuário.");
  }

  if (professional.id !== professionalId) {
    throw new Error("Profissionais só podem visualizar as próprias comissões.");
  }

  return professional.id;
}

/**
 * Realiza o acerto financeiro de um profissional em transação ACID:
 *  1. Marca todas as comissões PENDING do profissional como PAID
 *  2. Cria uma Transaction do tipo EXPENSE no caixa da clínica
 *     para registrar a saída de dinheiro (pagamento ao profissional)
 *  3. Debita o saldo da conta financeira (se informada)
 *
 * Isso garante que o fluxo de caixa reflita corretamente o pagamento.
 */
export async function settleCommissions(
  tenantId: string,
  professionalId: string,
  accountId?: string
): Promise<ActionResult<{ paidCount: number; expenseTransactionId: string }>> {
  try {
    const result = await db.$transaction(async (tx) => {
      // Busca todas as comissões PENDING deste profissional
      const pendingCommissions = await tx.commission.findMany({
        where: { tenantId, professionalId, status: "PENDING" },
      });

      if (pendingCommissions.length === 0) {
        throw new Error("Este profissional não possui comissões pendentes para acerto.");
      }

      const totalToPay = pendingCommissions.reduce(
        (sum, c) => sum + Number(c.commissionValue),
        0
      );
      const roundedTotal = Math.round(totalToPay * 100) / 100;

      // Busca nome do profissional para a descrição da transação
      const professional = await tx.professional.findFirst({
        where: { id: professionalId, tenantId },
        include: { user: { select: { name: true } } },
      });

      const profName = professional?.user.name ?? "Profissional";

      // ETAPA 1: Marca todas as comissões como PAID
      const commissionIds = pendingCommissions.map((c) => c.id);
      await tx.commission.updateMany({
        where: { id: { in: commissionIds }, tenantId },
        data: { status: "PAID", paidAt: new Date() },
      });

      // ETAPA 2: Cria Transaction EXPENSE para registrar a saída no caixa
      const expenseTransaction = await tx.transaction.create({
        data: {
          tenantId,
          accountId: accountId ?? null,
          type: "EXPENSE",
          paymentMethod: "CASH",
          paymentStatus: "PAID",
          amount: roundedTotal,
          paidAt: new Date(),
          description: `Acerto de comissões — ${profName} (${commissionIds.length} serviço${commissionIds.length > 1 ? "s" : ""})`,
        },
      });

      // ETAPA 3: Debita o saldo da conta financeira (se informada)
      if (accountId) {
        await tx.financialAccount.update({
          where: { id: accountId },
          data: { balance: { decrement: roundedTotal } },
        });
      }

      return {
        paidCount: commissionIds.length,
        expenseTransactionId: expenseTransaction.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao realizar acerto de comissões.";
    return { success: false, error: message };
  }
}

/**
 * Retorna o extrato financeiro do tenant em um intervalo de datas com resumo consolidado.
 */
export async function getFinancialStatement(
  tenantId: string,
  filters: {
    startDate: CivilDate;
    endDate: CivilDate;
    type?: StatementTypeFilter;
    status?: StatementStatusFilter;
  }
): Promise<FinancialStatementResult> {
  const { start, endExclusive } = getPeriodBounds(filters.startDate, filters.endDate);

  const where = {
    tenantId,
    ...(filters.type && filters.type !== "ALL" ? { type: filters.type } : {}),
    ...(filters.status && filters.status !== "ALL" ? { paymentStatus: filters.status } : {}),
    OR: [
      {
        paidAt: {
          gte: start,
          lt: endExclusive,
        },
      },
      {
        paidAt: null,
        createdAt: {
          gte: start,
          lt: endExclusive,
        },
      },
    ],
  };

  const transactions = await db.transaction.findMany({
    where,
    include: {
      account: {
        select: {
          name: true,
          type: true,
        },
      },
      appointment: {
        select: {
          id: true,
          customer: { select: { name: true } },
          services: {
            select: {
              service: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const entries = transactions
    .map((transaction) => {
      const resolvedDescription = transaction.appointment
        ? buildAppointmentDescription({
            customerName: transaction.appointment.customer?.name,
            serviceNames: transaction.appointment.services.map(
              (s) => s.service.name
            ),
            installmentNumber: transaction.installmentNumber,
            totalInstallments: transaction.totalInstallments,
          })
        : transaction.description;

      return {
      id: transaction.id,
      type: transaction.type,
      paymentStatus: transaction.paymentStatus,
      amount: Number(transaction.amount),
      description: resolvedDescription,
      paymentMethod: transaction.paymentMethod,
      accountName: transaction.account?.name ?? null,
      accountType: transaction.account?.type ?? null,
      effectiveDate: (transaction.paidAt ?? transaction.createdAt).toISOString(),
      createdAt: transaction.createdAt.toISOString(),
      paidAt: transaction.paidAt?.toISOString() ?? null,
      dueDate: transaction.dueDate?.toISOString() ?? null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );

  const entradas = entries
    .filter((entry) => entry.type === "INCOME")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const saidas = entries
    .filter((entry) => entry.type === "EXPENSE")
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    summary: {
      entradas: roundCurrency(entradas),
      saidas: roundCurrency(saidas),
      saldoPeriodo: roundCurrency(entradas - saidas),
      totalLancamentos: entries.length,
    },
    entries: entries.map((entry) => ({
      ...entry,
      amount: roundCurrency(entry.amount),
    })),
  };
}

/**
 * Retorna o estado atual do caixa operacional do tenant, incluindo a sessão aberta
 * e o histórico recente de aberturas/fechamentos.
 */
export async function getCashRegisterOverview(
  tenantId: string
): Promise<CashRegisterOverview> {
  const [accounts, currentSession, recentSessions] = await Promise.all([
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
    db.cashRegisterSession.findMany({
      where: {
        tenantId,
      },
      include: {
        account: {
          select: {
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
      take: 8,
    }),
  ]);

  const currentSessionWithTotals = currentSession
    ? await (async () => {
        const totals = await getCashSessionMovementTotals(
          tenantId,
          currentSession.accountId,
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
          expectedBalance: roundCurrency(
            Number(currentSession.openingAmount) + totals.totalEntries - totals.totalExpenses
          ),
        };
      })()
    : null;

  const recentSessionsWithTotals = await Promise.all(
    recentSessions.map(async (session) => {
      const totals = await getCashSessionMovementTotals(
        tenantId,
        session.accountId,
        session.openedAt,
        session.closedAt
      );

      const expectedBalance = roundCurrency(
        Number(session.openingAmount) + totals.totalEntries - totals.totalExpenses
      );
      const closingAmount = session.closingAmount != null ? Number(session.closingAmount) : null;

      return {
        id: session.id,
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
      };
    })
  );

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      balance: Number(account.balance),
    })),
    currentSession: currentSessionWithTotals,
    recentSessions: recentSessionsWithTotals,
  };
}

/**
 * Abre um novo caixa operacional para o tenant.
 * Garante que exista apenas uma sessão aberta por vez.
 */
export async function openCashRegister(
  tenantId: string,
  userId: string,
  input: OpenCashRegisterInput
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

/**
 * Fecha um caixa operacional aberto e registra o valor apurado no encerramento.
 */
export async function closeCashRegister(
  tenantId: string,
  userId: string,
  input: CloseCashRegisterInput
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
 * Consolida a home do módulo Financeiro em um único payload.
 * O recorte padrão é o mês civil atual.
 */
export async function getFinancialOverview(
  tenantId: string,
  period?: {
    startDate?: CivilDate;
    endDate?: CivilDate;
  }
): Promise<FinancialOverview> {
  const today = getTodayCivilDate();
  const startDate = period?.startDate ?? {
    year: today.year,
    month: today.month,
    day: 1,
  };
  const endDate = period?.endDate ?? today;
  const { start, endExclusive } = getPeriodBounds(startDate, endDate);
  const { start: todayStart, endExclusive: todayEndExclusive } = getCivilDayRange(today);

  const startCivil =
    formatCivilDateToQuery(startDate) <= formatCivilDateToQuery(endDate) ? startDate : endDate;
  const endCivil =
    formatCivilDateToQuery(startDate) <= formatCivilDateToQuery(endDate) ? endDate : startDate;

  const daysInPeriod = Math.max(
    1,
    Math.round((endExclusive.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  );
  const previousEndCivil = addDaysToCivilDate(startCivil, -1);
  const previousStartCivil = addDaysToCivilDate(previousEndCivil, -(daysInPeriod - 1));

  const statementTrendEndCivil = today;
  const statementTrendStartCivil = addDaysToCivilDate(today, -13);
  const { start: trendStart, endExclusive: trendEndExclusive } = getPeriodBounds(
    statementTrendStartCivil,
    statementTrendEndCivil
  );

  const [
    statement,
    previousStatement,
    cashOverview,
    commissions,
    recentTransactions,
    recentCashSessions,
    todayCashClosingGroups,
    periodPaidIncomes,
    trendTransactions,
  ] = await Promise.all([
    getFinancialStatement(tenantId, {
      startDate: startCivil,
      endDate: endCivil,
    }),
    getFinancialStatement(tenantId, {
      startDate: previousStartCivil,
      endDate: previousEndCivil,
    }),
    getCashRegisterOverview(tenantId),
    db.commission.findMany({
      where: {
        tenantId,
        OR: [
          {
            createdAt: {
              gte: start,
              lt: endExclusive,
            },
          },
          {
            paidAt: {
              gte: start,
              lt: endExclusive,
            },
          },
        ],
      },
      select: {
        commissionValue: true,
        status: true,
        professionalId: true,
      },
    }),
    db.transaction.findMany({
      where: {
        tenantId,
      },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    db.cashRegisterSession.findMany({
      where: {
        tenantId,
      },
      include: {
        account: {
          select: {
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
      take: 3,
    }),
    db.transaction.groupBy({
      by: ["paymentMethod"],
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PAID",
        paidAt: {
          gte: todayStart,
          lt: todayEndExclusive,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    db.transaction.findMany({
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PAID",
        paidAt: {
          gte: start,
          lt: endExclusive,
        },
        appointmentId: { not: null },
      },
      select: {
        id: true,
        amount: true,
        appointment: {
          select: {
            id: true,
            professionalId: true,
            professional: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            services: {
              select: {
                serviceId: true,
                price: true,
                quantity: true,
                service: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.transaction.findMany({
      where: {
        tenantId,
        OR: [
          {
            paidAt: {
              gte: trendStart,
              lt: trendEndExclusive,
            },
          },
          {
            paidAt: null,
            createdAt: {
              gte: trendStart,
              lt: trendEndExclusive,
            },
          },
        ],
      },
      select: {
        paidAt: true,
        createdAt: true,
      },
    }),
  ]);

  const generatedTotal = commissions.reduce(
    (sum, commission) => sum + Number(commission.commissionValue),
    0
  );
  const pendingCommissions = commissions.filter((commission) => commission.status === "PENDING");
  const pendingTotal = pendingCommissions.reduce(
    (sum, commission) => sum + Number(commission.commissionValue),
    0
  );
  const professionalsWithPending = new Set(
    pendingCommissions.map((commission) => commission.professionalId)
  ).size;

  const currentCash = cashOverview.currentSession;
  const lastClosedCash = cashOverview.recentSessions.find((session) => session.status === "CLOSED");
  const todayCashClosing = PAYMENT_METHOD_OPTIONS.map((option) => {
    const match = todayCashClosingGroups.find(
      (group) => group.paymentMethod === option.value
    );

    return {
      paymentMethod: option.value,
      label: PAYMENT_METHOD_LABELS[option.value],
      amount: roundCurrency(Number(match?._sum.amount ?? 0)),
    };
  }).filter((entry) => entry.amount > 0);

  const recentActivities = [
    ...recentTransactions.map((transaction) => ({
      id: `transaction-${transaction.id}`,
      type: "TRANSACTION" as const,
      title: transaction.type === "INCOME" ? "Entrada registrada" : "Saída registrada",
      description:
        transaction.description ??
        `${transaction.type === "INCOME" ? "Receita" : "Despesa"} ${transaction.account?.name ? `na conta ${transaction.account.name}` : "sem conta vinculada"}`,
      amount: Number(transaction.amount),
      occurredAt: (transaction.paidAt ?? transaction.createdAt).toISOString(),
    })),
    ...recentCashSessions.flatMap((session) => {
      const items: FinancialActivityItem[] = [
        {
          id: `cash-open-${session.id}`,
          type: "CASH_OPEN" as const,
          title: "Caixa aberto",
          description: `${session.account.name} por ${session.openedByUser.name}`,
          amount: Number(session.openingAmount),
          occurredAt: session.openedAt.toISOString(),
        },
      ];

      if (session.closedAt) {
        items.push({
          id: `cash-close-${session.id}`,
          type: "CASH_CLOSE" as const,
          title: "Caixa fechado",
          description: `${session.account.name}${session.closedByUser?.name ? ` por ${session.closedByUser.name}` : ""}`,
          amount: session.closingAmount != null ? Number(session.closingAmount) : null,
          occurredAt: session.closedAt.toISOString(),
        });
      }

      return items;
    }),
  ]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 8);

  const dailyBuckets = new Map<string, { entradas: number; saidas: number }>();
  for (let offset = 0; offset < daysInPeriod; offset += 1) {
    const key = formatCivilDateToQuery(addDaysToCivilDate(startCivil, offset));
    dailyBuckets.set(key, { entradas: 0, saidas: 0 });
  }
  for (const entry of statement.entries) {
    const civil = getCivilDateFromDate(new Date(entry.effectiveDate));
    const key = formatCivilDateToQuery(civil);
    const bucket = dailyBuckets.get(key);
    if (!bucket) continue;
    if (entry.type === "INCOME") {
      bucket.entradas += entry.amount;
    } else {
      bucket.saidas += entry.amount;
    }
  }
  const dailySeries = Array.from(dailyBuckets.entries()).map(([date, value]) => ({
    date,
    entradas: roundCurrency(value.entradas),
    saidas: roundCurrency(value.saidas),
  }));

  const trendBuckets = new Map<string, number>();
  for (let offset = 0; offset < 14; offset += 1) {
    const key = formatCivilDateToQuery(addDaysToCivilDate(statementTrendStartCivil, offset));
    trendBuckets.set(key, 0);
  }
  for (const transaction of trendTransactions) {
    const reference = transaction.paidAt ?? transaction.createdAt;
    const key = formatCivilDateToQuery(getCivilDateFromDate(reference));
    if (!trendBuckets.has(key)) continue;
    trendBuckets.set(key, (trendBuckets.get(key) ?? 0) + 1);
  }
  const statementTrend = Array.from(trendBuckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  const professionalTotals = new Map<
    string,
    { id: string; name: string; revenue: number; appointmentIds: Set<string> }
  >();
  const serviceTotals = new Map<
    string,
    { id: string; name: string; revenue: number; soldCount: number }
  >();

  for (const transaction of periodPaidIncomes) {
    const appointment = transaction.appointment;
    if (!appointment) continue;

    const amount = Number(transaction.amount);
    const professional = appointment.professional;
    if (professional) {
      const entry = professionalTotals.get(professional.id) ?? {
        id: professional.id,
        name: professional.user?.name ?? "Profissional",
        revenue: 0,
        appointmentIds: new Set<string>(),
      };
      entry.revenue += amount;
      entry.appointmentIds.add(appointment.id);
      professionalTotals.set(professional.id, entry);
    }

    const services = appointment.services ?? [];
    if (services.length === 0) continue;

    const weights = services.map((row) => {
      const unitPrice = Number(row.price ?? 0);
      const quantity = row.quantity ?? 1;
      return unitPrice * quantity;
    });
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const equalSplit = amount / services.length;

    services.forEach((row, index) => {
      const service = row.service;
      if (!service) return;
      const portion = weightTotal > 0 ? (weights[index] / weightTotal) * amount : equalSplit;
      const entry = serviceTotals.get(service.id) ?? {
        id: service.id,
        name: service.name,
        revenue: 0,
        soldCount: 0,
      };
      entry.revenue += portion;
      entry.soldCount += row.quantity ?? 1;
      serviceTotals.set(service.id, entry);
    });
  }

  const topProfessionals = Array.from(professionalTotals.values())
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      revenue: roundCurrency(entry.revenue),
      appointmentCount: entry.appointmentIds.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topServices = Array.from(serviceTotals.values())
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      revenue: roundCurrency(entry.revenue),
      soldCount: entry.soldCount,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    period: {
      label: formatMonthLabel(startDate),
      startDate: formatCivilDateToQuery(startDate),
      endDate: formatCivilDateToQuery(endDate),
    },
    summary: statement.summary,
    previousSummary: previousStatement.summary,
    dailySeries,
    statementTrend,
    topProfessionals,
    topServices,
    commissions: {
      generatedTotal: roundCurrency(generatedTotal),
      pendingTotal: roundCurrency(pendingTotal),
      pendingCount: pendingCommissions.length,
      professionalsWithPending,
    },
    cash: {
      status: currentCash ? "OPEN" : "CLOSED",
      accountName: currentCash?.accountName ?? null,
      openedByName: currentCash?.openedByName ?? null,
      openedAt: currentCash?.openedAt ?? null,
      openingAmount: currentCash?.openingAmount ?? 0,
      expectedBalance: currentCash?.expectedBalance ?? 0,
      lastClosedAt: lastClosedCash?.closedAt ?? null,
    },
    statement: {
      recentCount: statement.summary.totalLancamentos,
      lastTransactionAt:
        recentTransactions[0] != null
          ? (recentTransactions[0].paidAt ?? recentTransactions[0].createdAt).toISOString()
          : null,
    },
    todayCashClosing: {
      total: roundCurrency(
        todayCashClosing.reduce((sum, entry) => sum + entry.amount, 0)
      ),
      methods: todayCashClosing,
    },
    recentActivities,
  };
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatRelativePtBR(from: Date, to: Date = new Date()) {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 48) return `${diffHour} h`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} dias`;
}

/**
 * Computa alertas contextuais para exibir no topo do módulo Financeiro.
 * Retorna apenas os alertas ativos — se uma condição não se aplica, é omitida.
 */
export async function getFinancialAlerts(tenantId: string): Promise<FinancialAlert[]> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dueSoonEnd = new Date(
    todayStart.getTime() + (ALERT_THRESHOLDS.EXPENSE_DUE_SOON_DAYS + 1) * 24 * 60 * 60 * 1000
  );
  const commissionStaleBefore = new Date(
    now.getTime() - ALERT_THRESHOLDS.COMMISSION_STALE_DAYS * 24 * 60 * 60 * 1000
  );
  const cashStaleBefore = new Date(
    now.getTime() - ALERT_THRESHOLDS.CASH_OPEN_STALE_HOURS * 60 * 60 * 1000
  );
  const statementIdleThreshold = new Date(
    now.getTime() - ALERT_THRESHOLDS.STATEMENT_IDLE_DAYS * 24 * 60 * 60 * 1000
  );

  const [
    expensesDueSoon,
    expensesOverdue,
    commissionsStale,
    cashOpenLong,
    lastPaidTransaction,
  ] = await Promise.all([
    db.expense.aggregate({
      where: {
        tenantId,
        status: "PENDING",
        deletedAt: null,
        dueDate: {
          gte: todayStart,
          lt: dueSoonEnd,
        },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.expense.aggregate({
      where: {
        tenantId,
        status: "PENDING",
        deletedAt: null,
        dueDate: { lt: todayStart },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.commission.aggregate({
      where: {
        tenantId,
        status: "PENDING",
        createdAt: { lt: commissionStaleBefore },
      },
      _sum: { commissionValue: true },
      _count: { _all: true },
    }),
    db.cashRegisterSession.findFirst({
      where: {
        tenantId,
        status: "OPEN",
        openedAt: { lt: cashStaleBefore },
      },
      include: {
        account: { select: { name: true } },
      },
      orderBy: { openedAt: "asc" },
    }),
    db.transaction.findFirst({
      where: {
        tenantId,
        paymentStatus: "PAID",
      },
      select: { paidAt: true, createdAt: true },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  const alerts: FinancialAlert[] = [];

  const overdueCount = expensesOverdue._count?._all ?? 0;
  const overdueTotal = roundCurrency(Number(expensesOverdue._sum.amount ?? 0));
  if (overdueCount > 0) {
    alerts.push({
      id: "expenses_overdue",
      severity: "critical",
      title: `${overdueCount} despesa(s) vencida(s) — total ${formatBRL(overdueTotal)}`,
      ctaLabel: "Ver despesas",
      ctaHref: "/financeiro/despesas?filter=overdue",
      metadata: { count: overdueCount, total: overdueTotal },
    });
  }

  const dueSoonCount = expensesDueSoon._count?._all ?? 0;
  const dueSoonTotal = roundCurrency(Number(expensesDueSoon._sum.amount ?? 0));
  if (dueSoonCount > 0) {
    alerts.push({
      id: "expenses_due_soon",
      severity: "warning",
      title: `${dueSoonCount} despesa(s) vencem nos próximos ${ALERT_THRESHOLDS.EXPENSE_DUE_SOON_DAYS} dias — total ${formatBRL(dueSoonTotal)}`,
      ctaLabel: "Ver despesas",
      ctaHref: "/financeiro/despesas?filter=due_soon",
      metadata: { count: dueSoonCount, total: dueSoonTotal },
    });
  }

  const staleCommissionsCount = commissionsStale._count?._all ?? 0;
  const staleCommissionsTotal = roundCurrency(
    Number(commissionsStale._sum.commissionValue ?? 0)
  );
  if (staleCommissionsCount > 0) {
    alerts.push({
      id: "commissions_stale",
      severity: "warning",
      title: `${formatBRL(staleCommissionsTotal)} em comissões pendentes há mais de ${ALERT_THRESHOLDS.COMMISSION_STALE_DAYS} dias`,
      ctaLabel: "Ver comissões",
      ctaHref: "/financeiro/comissoes?filter=stale",
      metadata: {
        count: staleCommissionsCount,
        total: staleCommissionsTotal,
      },
    });
  }

  if (cashOpenLong) {
    const relative = formatRelativePtBR(cashOpenLong.openedAt, now);
    alerts.push({
      id: "cash_open_long",
      severity: "info",
      title: `Caixa ${cashOpenLong.account.name} aberto há ${relative} — considere fechar`,
      ctaLabel: "Ver caixa",
      ctaHref: "/financeiro/caixa",
      metadata: {
        sessionId: cashOpenLong.id,
        accountName: cashOpenLong.account.name,
        openedAt: cashOpenLong.openedAt.toISOString(),
      },
    });
  }

  const lastPaidAt =
    lastPaidTransaction?.paidAt ?? lastPaidTransaction?.createdAt ?? null;
  if (!lastPaidAt || lastPaidAt < statementIdleThreshold) {
    const daysIdle = lastPaidAt
      ? Math.max(
          ALERT_THRESHOLDS.STATEMENT_IDLE_DAYS,
          Math.floor((now.getTime() - lastPaidAt.getTime()) / (24 * 60 * 60 * 1000))
        )
      : null;
    alerts.push({
      id: "statement_idle",
      severity: "info",
      title: daysIdle
        ? `Sem movimentação no extrato há ${daysIdle} dias`
        : "Ainda não há movimentação registrada no extrato",
      ctaLabel: "Abrir extrato",
      ctaHref: "/financeiro/extrato",
      metadata: { lastPaidAt: lastPaidAt?.toISOString() ?? null },
    });
  }

  const severityOrder: Record<FinancialAlert["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

export type CommissionsOverview = {
  period: { label: string; startDate: string; endDate: string };
  generatedInPeriod: number;
  generatedInPeriodPrevious: number;
  paidInPeriod: number;
  pendingTotal: number;
  pendingProfessionalsCount: number;
};

/**
 * Sumário executivo da aba Comissões, com comparação vs. período anterior.
 */
export async function getCommissionsOverview(
  tenantId: string,
  period?: {
    startDate?: CivilDate;
    endDate?: CivilDate;
  }
): Promise<CommissionsOverview> {
  const today = getTodayCivilDate();
  const startDate = period?.startDate ?? {
    year: today.year,
    month: today.month,
    day: 1,
  };
  const endDate = period?.endDate ?? today;
  const { start, endExclusive } = getPeriodBounds(startDate, endDate);

  const startCivil =
    formatCivilDateToQuery(startDate) <= formatCivilDateToQuery(endDate)
      ? startDate
      : endDate;
  const endCivil =
    formatCivilDateToQuery(startDate) <= formatCivilDateToQuery(endDate)
      ? endDate
      : startDate;

  const daysInPeriod = Math.max(
    1,
    Math.round((endExclusive.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  );
  const previousEndCivil = addDaysToCivilDate(startCivil, -1);
  const previousStartCivil = addDaysToCivilDate(previousEndCivil, -(daysInPeriod - 1));
  const { start: previousStart, endExclusive: previousEndExclusive } = getPeriodBounds(
    previousStartCivil,
    previousEndCivil
  );

  const [
    generatedAggregate,
    previousAggregate,
    paidAggregate,
    pendingAggregate,
    pendingProfessionalsGroup,
  ] = await Promise.all([
    db.commission.aggregate({
      where: {
        tenantId,
        createdAt: { gte: start, lt: endExclusive },
      },
      _sum: { commissionValue: true },
    }),
    db.commission.aggregate({
      where: {
        tenantId,
        createdAt: { gte: previousStart, lt: previousEndExclusive },
      },
      _sum: { commissionValue: true },
    }),
    db.commission.aggregate({
      where: {
        tenantId,
        status: "PAID",
        paidAt: { gte: start, lt: endExclusive },
      },
      _sum: { commissionValue: true },
    }),
    db.commission.aggregate({
      where: {
        tenantId,
        status: "PENDING",
      },
      _sum: { commissionValue: true },
    }),
    db.commission.groupBy({
      by: ["professionalId"],
      where: {
        tenantId,
        status: "PENDING",
      },
    }),
  ]);

  return {
    period: {
      label: formatMonthLabel(startCivil),
      startDate: formatCivilDateToQuery(startCivil),
      endDate: formatCivilDateToQuery(endCivil),
    },
    generatedInPeriod: roundCurrency(Number(generatedAggregate._sum.commissionValue ?? 0)),
    generatedInPeriodPrevious: roundCurrency(
      Number(previousAggregate._sum.commissionValue ?? 0)
    ),
    paidInPeriod: roundCurrency(Number(paidAggregate._sum.commissionValue ?? 0)),
    pendingTotal: roundCurrency(Number(pendingAggregate._sum.commissionValue ?? 0)),
    pendingProfessionalsCount: pendingProfessionalsGroup.length,
  };
}

export type ExpensesOverview = {
  period: { label: string; month: number; year: number };
  paidInMonth: number;
  paidInMonthPrevious: number;
  pendingInMonth: number;
  overdueTotal: number;
  overdueCount: number;
  averageTicket: number;
  paidCount: number;
};

/**
 * Sumário executivo da aba Despesas, com comparação vs. mês anterior.
 */
export async function getExpensesOverview(
  tenantId: string,
  period: { month: number; year: number }
): Promise<ExpensesOverview> {
  const currentMonth = { year: period.year, month: period.month };
  const previousMonth =
    currentMonth.month === 1
      ? { year: currentMonth.year - 1, month: 12 }
      : { year: currentMonth.year, month: currentMonth.month - 1 };

  const { start: currentStart, endExclusive: currentEnd } = getCivilMonthRange(currentMonth);
  const { start: previousStart, endExclusive: previousEnd } = getCivilMonthRange(previousMonth);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);

  const [paidAggregate, previousPaidAggregate, pendingAggregate, overdueAggregate] =
    await Promise.all([
      db.expense.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: "PAID",
          paidAt: { gte: currentStart, lt: currentEnd },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      db.expense.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: "PAID",
          paidAt: { gte: previousStart, lt: previousEnd },
        },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: "PENDING",
          dueDate: { gte: currentStart, lt: currentEnd },
        },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: {
          tenantId,
          deletedAt: null,
          status: "PENDING",
          dueDate: { lt: todayStart },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

  const paidCount = paidAggregate._count?._all ?? 0;
  const paidInMonth = roundCurrency(Number(paidAggregate._sum.amount ?? 0));

  return {
    period: {
      label: formatMonthLabel({ ...currentMonth, day: 1 }),
      month: currentMonth.month,
      year: currentMonth.year,
    },
    paidInMonth,
    paidInMonthPrevious: roundCurrency(Number(previousPaidAggregate._sum.amount ?? 0)),
    pendingInMonth: roundCurrency(Number(pendingAggregate._sum.amount ?? 0)),
    overdueTotal: roundCurrency(Number(overdueAggregate._sum.amount ?? 0)),
    overdueCount: overdueAggregate._count?._all ?? 0,
    averageTicket: paidCount > 0 ? roundCurrency(paidInMonth / paidCount) : 0,
    paidCount,
  };
}

export type CashOverviewSummary = {
  status: "OPEN" | "CLOSED";
  accountName: string | null;
  openedAt: string | null;
  lastClosedAt: string | null;
  expectedBalance: number;
  todayEntriesCount: number;
  todayIncomes: number;
  todayExpenses: number;
  todayNet: number;
  lastClosingDifference: number | null;
};

/**
 * Sumário executivo da aba Caixa. Usa dados já disponíveis em getCashRegisterOverview
 * e amplia com métricas do dia corrente.
 */
export async function getCashOverviewSummary(
  tenantId: string
): Promise<CashOverviewSummary> {
  const overview = await getCashRegisterOverview(tenantId);
  const today = getTodayCivilDate();
  const { start: dayStart, endExclusive: dayEnd } = getCivilDayRange(today);

  const [todayIncome, todayExpense] = await Promise.all([
    db.transaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PAID",
        paidAt: { gte: dayStart, lt: dayEnd },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.transaction.aggregate({
      where: {
        tenantId,
        type: "EXPENSE",
        paymentStatus: "PAID",
        paidAt: { gte: dayStart, lt: dayEnd },
      },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const todayIncomes = roundCurrency(Number(todayIncome._sum.amount ?? 0));
  const todayExpenses = roundCurrency(Number(todayExpense._sum.amount ?? 0));
  const todayEntriesCount =
    (todayIncome._count?._all ?? 0) + (todayExpense._count?._all ?? 0);

  const currentSession = overview.currentSession;
  const lastClosedSession = overview.recentSessions.find(
    (session) => session.status === "CLOSED" && session.difference != null
  );

  return {
    status: currentSession ? "OPEN" : "CLOSED",
    accountName: currentSession?.accountName ?? null,
    openedAt: currentSession?.openedAt ?? null,
    lastClosedAt: overview.recentSessions.find((s) => s.status === "CLOSED")?.closedAt ?? null,
    expectedBalance: currentSession?.expectedBalance ?? 0,
    todayEntriesCount,
    todayIncomes,
    todayExpenses,
    todayNet: roundCurrency(todayIncomes - todayExpenses),
    lastClosingDifference: lastClosedSession?.difference ?? null,
  };
}

export type DetailedCommissionEntry = {
  id: string;
  generatedAt: string;
  professionalName: string;
  customerName: string | null;
  services: string;
  serviceAmount: number;
  commissionRate: number;
  commissionValue: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null;
};

/**
 * Lista comissões detalhadas (1 linha por comissão) com dados de profissional,
 * cliente e serviços. Usada para exportação — sem limite de registros.
 */
export async function getCommissionsDetailed(
  tenantId: string,
  filters?: {
    startDate?: CivilDate;
    endDate?: CivilDate;
    status?: "ALL" | "PENDING" | "PAID" | "CANCELLED";
    professionalId?: string;
  }
): Promise<DetailedCommissionEntry[]> {
  const dateWhere =
    filters?.startDate && filters?.endDate
      ? {
          createdAt: (() => {
            const { start, endExclusive } = getPeriodBounds(
              filters.startDate,
              filters.endDate
            );
            return { gte: start, lt: endExclusive };
          })(),
        }
      : {};

  const statusWhere =
    filters?.status && filters.status !== "ALL" ? { status: filters.status } : {};

  const professionalWhere = filters?.professionalId
    ? { professionalId: filters.professionalId }
    : {};

  const commissions = await db.commission.findMany({
    where: {
      tenantId,
      ...dateWhere,
      ...statusWhere,
      ...professionalWhere,
    },
    include: {
      professional: {
        select: {
          user: { select: { name: true } },
        },
      },
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
    orderBy: { createdAt: "desc" },
  });

  return commissions.map((commission) => ({
    id: commission.id,
    generatedAt: commission.createdAt.toISOString(),
    professionalName: commission.professional?.user?.name ?? "—",
    customerName: commission.appointment?.customer?.name ?? null,
    services:
      commission.appointment?.services
        .map((s) => s.service?.name)
        .filter((name): name is string => Boolean(name))
        .join(", ") ?? "",
    serviceAmount: roundCurrency(Number(commission.serviceAmount)),
    commissionRate: Number(commission.commissionRate),
    commissionValue: roundCurrency(Number(commission.commissionValue)),
    status: commission.status,
    paidAt: commission.paidAt?.toISOString() ?? null,
  }));
}

export type DetailedExpenseEntry = {
  id: string;
  description: string;
  categoryName: string | null;
  type: "FIXED" | "VARIABLE";
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
  accountName: string | null;
  recurrence: "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY" | "NONE";
  notes: string | null;
};

/**
 * Lista despesas detalhadas para exportação, respeitando filtros de mês,
 * status, tipo e categoria. Sem limite de registros.
 */
export async function getExpensesDetailed(
  tenantId: string,
  filters: {
    month?: { month: number; year: number };
    status?: "ALL" | "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
    type?: "ALL" | "FIXED" | "VARIABLE";
    categoryId?: string;
  }
): Promise<DetailedExpenseEntry[]> {
  const monthRange = filters.month
    ? getCivilMonthRange(filters.month)
    : null;

  const expenses = await db.expense.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(monthRange
        ? { dueDate: { gte: monthRange.start, lt: monthRange.endExclusive } }
        : {}),
      ...(filters.status && filters.status !== "ALL"
        ? { status: filters.status }
        : {}),
      ...(filters.type && filters.type !== "ALL" ? { type: filters.type } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    include: {
      category: { select: { name: true } },
      account: { select: { name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  return expenses.map((expense) => ({
    id: expense.id,
    description: expense.description,
    categoryName: expense.category?.name ?? null,
    type: expense.type,
    amount: roundCurrency(Number(expense.amount)),
    dueDate: expense.dueDate.toISOString(),
    paidAt: expense.paidAt?.toISOString() ?? null,
    status: expense.status,
    accountName: expense.account?.name ?? null,
    recurrence: expense.recurrence,
    notes: expense.notes ?? null,
  }));
}

const FORECAST_DAYS_AHEAD = 30;

export type CashFlowForecast = {
  horizon: {
    startDate: string;
    endDate: string;
    daysAhead: number;
  };
  currentBalance: number;
  projectedEndBalance: number;
  totalIncomeAhead: number;
  totalExpenseAhead: number;
  dailyProjection: Array<{
    date: string;
    plannedIncome: number;
    plannedExpense: number;
    balanceAfter: number;
  }>;
  negativeBalanceAlert: {
    date: string;
    balance: number;
  } | null;
  breakdown: {
    incomeSources: Array<{
      kind: "appointment" | "pending_transaction";
      id: string;
      date: string;
      amount: number;
      label: string;
    }>;
    expenseSources: Array<{
      id: string;
      date: string;
      amount: number;
      label: string;
      category: string;
    }>;
  };
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type ProjectedIncomeEntry = {
  kind: "appointment" | "pending_transaction";
  id: string;
  date: string;
  amount: number;
  label: string;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
};

/**
 * Entradas previstas num intervalo [from, to): agendamentos SCHEDULED/CONFIRMED
 * ainda não cobrados + transactions INCOME PENDING. Serve tanto o forecast de
 * 30 dias quanto o cálculo de projeção de fechamento da meta do mês.
 */
export async function getProjectedIncomeBetween(
  tenantId: string,
  from: Date,
  to: Date
): Promise<ProjectedIncomeEntry[]> {
  const [appointments, pendingTxs] = await Promise.all([
    db.appointment.findMany({
      where: {
        tenantId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        transaction: null,
        customerPackageId: null,
        totalPrice: { gt: 0 },
        startTime: { gte: from, lt: to },
      },
      include: {
        customer: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
      },
    }),
    db.transaction.findMany({
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PENDING",
        dueDate: { gte: from, lt: to },
      },
      include: {
        appointment: {
          select: {
            customer: { select: { name: true } },
            services: { include: { service: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  const entries: ProjectedIncomeEntry[] = [];

  for (const appointment of appointments) {
    const amount = roundCurrency(Number(appointment.totalPrice));
    if (amount <= 0) continue;
    entries.push({
      kind: "appointment",
      id: appointment.id,
      date: appointment.startTime.toISOString(),
      amount,
      label: buildAppointmentDescription({
        customerName: appointment.customer?.name,
        serviceNames: appointment.services.map((s) => s.service.name),
      }),
    });
  }

  for (const transaction of pendingTxs) {
    if (!transaction.dueDate) continue;
    const amount = roundCurrency(Number(transaction.amount));
    if (amount <= 0) continue;
    const label = transaction.appointment
      ? buildAppointmentDescription({
          customerName: transaction.appointment.customer?.name,
          serviceNames: transaction.appointment.services.map(
            (s) => s.service.name
          ),
          installmentNumber: transaction.installmentNumber,
          totalInstallments: transaction.totalInstallments,
        })
      : transaction.description ?? "Entrada prevista";
    entries.push({
      kind: "pending_transaction",
      id: transaction.id,
      date: transaction.dueDate.toISOString(),
      amount,
      label,
      installmentNumber: transaction.installmentNumber,
      totalInstallments: transaction.totalInstallments,
    });
  }

  return entries;
}

/**
 * Projeção de fluxo de caixa para os próximos 30 dias.
 * Combina saldo atual das contas com entradas previstas (via
 * getProjectedIncomeBetween) e saídas previstas (expenses PENDING).
 * Vencidas (dueDate < hoje) entram na projeção no dia de hoje — o dinheiro ainda
 * não saiu, mas é devido, e o gráfico é forward-looking.
 */
export async function getCashFlowForecast(
  tenantId: string
): Promise<CashFlowForecast> {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfHorizon = new Date(todayStart);
  endOfHorizon.setDate(endOfHorizon.getDate() + FORECAST_DAYS_AHEAD + 1);

  const [balanceAgg, projectedIncome, pendingExpenses] = await Promise.all([
    db.financialAccount.aggregate({
      where: { tenantId, isActive: true },
      _sum: { balance: true },
    }),
    getProjectedIncomeBetween(tenantId, todayStart, endOfHorizon),
    db.expense.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: "PENDING",
        dueDate: { lt: endOfHorizon },
      },
      include: { category: { select: { name: true } } },
    }),
  ]);

  const currentBalance = roundCurrency(Number(balanceAgg._sum.balance ?? 0));

  const incomeSources: CashFlowForecast["breakdown"]["incomeSources"] =
    projectedIncome.map((entry) => ({
      kind: entry.kind,
      id: entry.id,
      date: entry.date,
      amount: entry.amount,
      label: entry.label,
    }));
  const expenseSources: CashFlowForecast["breakdown"]["expenseSources"] = [];

  for (const expense of pendingExpenses) {
    const amount = roundCurrency(Number(expense.amount));
    if (amount <= 0) continue;
    // Vencidas (dueDate < hoje) são consolidadas no dia de hoje na projeção.
    const effectiveDate =
      expense.dueDate < todayStart ? todayStart : expense.dueDate;
    expenseSources.push({
      id: expense.id,
      date: effectiveDate.toISOString(),
      amount,
      label: expense.description,
      category: expense.category?.name ?? "Sem categoria",
    });
  }

  const incomeByDay = new Map<string, number>();
  const expenseByDay = new Map<string, number>();

  for (const source of incomeSources) {
    const key = toIsoDate(new Date(source.date));
    incomeByDay.set(key, (incomeByDay.get(key) ?? 0) + source.amount);
  }
  for (const source of expenseSources) {
    const key = toIsoDate(new Date(source.date));
    expenseByDay.set(key, (expenseByDay.get(key) ?? 0) + source.amount);
  }

  const dailyProjection: CashFlowForecast["dailyProjection"] = [];
  let runningBalance = currentBalance;
  let totalIncomeAhead = 0;
  let totalExpenseAhead = 0;
  let negativeBalanceAlert: CashFlowForecast["negativeBalanceAlert"] = null;

  for (let offset = 0; offset <= FORECAST_DAYS_AHEAD; offset++) {
    const cursor = new Date(todayStart);
    cursor.setDate(cursor.getDate() + offset);
    const key = toIsoDate(cursor);
    const plannedIncome = roundCurrency(incomeByDay.get(key) ?? 0);
    const plannedExpense = roundCurrency(expenseByDay.get(key) ?? 0);
    runningBalance = roundCurrency(
      runningBalance + plannedIncome - plannedExpense
    );
    totalIncomeAhead += plannedIncome;
    totalExpenseAhead += plannedExpense;

    if (!negativeBalanceAlert && runningBalance < 0) {
      negativeBalanceAlert = { date: key, balance: runningBalance };
    }

    dailyProjection.push({
      date: key,
      plannedIncome,
      plannedExpense,
      balanceAfter: runningBalance,
    });
  }

  incomeSources.sort((a, b) => a.date.localeCompare(b.date));
  expenseSources.sort((a, b) => a.date.localeCompare(b.date));

  const lastDate = new Date(todayStart);
  lastDate.setDate(lastDate.getDate() + FORECAST_DAYS_AHEAD);

  return {
    horizon: {
      startDate: toIsoDate(todayStart),
      endDate: toIsoDate(lastDate),
      daysAhead: FORECAST_DAYS_AHEAD,
    },
    currentBalance,
    projectedEndBalance: runningBalance,
    totalIncomeAhead: roundCurrency(totalIncomeAhead),
    totalExpenseAhead: roundCurrency(totalExpenseAhead),
    dailyProjection,
    negativeBalanceAlert,
    breakdown: { incomeSources, expenseSources },
  };
}
