import { db } from "@/lib/db";
import {
  APPOINTMENT_REALIZED_STATUSES,
  normalizeAppointmentStatus,
  type AppointmentStoredStatus,
} from "@/lib/appointments/status";
import {
  formatCivilDateToQuery,
  getCivilDateFromDate,
  getCivilDayRange,
  getCivilMonthRange,
  getDaysInCivilMonth,
  getTodayCivilDate,
  type CivilMonth,
} from "@/lib/civil-date";

export type MonthlyDashboardStats = {
  faturamentoMes: number;
  totalComissoes: number;
  totalDespesas: number;
  resultadoMes: number;
  totalAtendimentos: number;
  ticketMedio: number;
};

export type DailyRevenuePoint = {
  dia: string;
  label: string;
  faturamento: number;
  comissoes: number;
  despesas: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Busca os KPIs do dia para o dashboard do Tenant.
 * Retorna faturamento, ticket médio, agendamentos e novos clientes.
 */
export async function getDailyKPIs(tenantId: string) {
  const today = getTodayCivilDate();
  const { start: dayStart, endExclusive } = getCivilDayRange(today);

  const [
    todayRevenueAggregate,
    completedAppointmentsCount,
    totalAppointmentsCount,
    newCustomersCount,
  ] = await Promise.all([
    // Soma das transações INCOME efetivamente pagas no dia.
    db.transaction.aggregate({
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PAID",
        OR: [
          {
            paidAt: { gte: dayStart, lt: endExclusive },
          },
          {
            paidAt: null,
            createdAt: { gte: dayStart, lt: endExclusive },
          },
        ],
      },
      _sum: {
        amount: true,
      },
    }),

    // Atendimentos concluídos do dia (Finalizado ou Pago) para calcular ticket médio.
    db.appointment.count({
      where: {
        tenantId,
        status: { in: APPOINTMENT_REALIZED_STATUSES },
        startTime: { gte: dayStart, lt: endExclusive },
      },
    }),

    // Total de agendamentos do dia (qualquer status exceto cancelados)
    db.appointment.count({
      where: {
        tenantId,
        startTime: { gte: dayStart, lt: endExclusive },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),

    // Novos clientes cadastrados hoje
    db.customer.count({
      where: {
        tenantId,
        createdAt: { gte: dayStart, lt: endExclusive },
      },
    }),
  ]);

  const revenue = Number(todayRevenueAggregate._sum.amount ?? 0);

  const averageTicket =
    completedAppointmentsCount > 0
      ? revenue / completedAppointmentsCount
      : 0;

  return {
    revenue: Math.round(revenue * 100) / 100,
    averageTicket: Math.round(averageTicket * 100) / 100,
    totalAppointments: totalAppointmentsCount,
    completedAppointments: completedAppointmentsCount,
    newCustomers: newCustomersCount,
  };
}

/**
 * Busca agendamentos operacionais do dia.
 * Mantido para compatibilidade com consultas internas do dashboard.
 */
export async function getWaitingRoomAppointments(tenantId: string) {
  const today = getTodayCivilDate();
  const { start: dayStart, endExclusive } = getCivilDayRange(today);

  const appointments = await db.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: dayStart, lt: endExclusive },
      status: { in: ["SCHEDULED", "CONFIRMED", "WAITING", "CHECKED_IN", "IN_PROGRESS"] },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      professional: {
        select: { user: { select: { name: true } }, specialty: true },
      },
      services: { include: { service: { select: { name: true } } } },
    },
    orderBy: { startTime: "asc" },
  });

  return appointments.map((a) => ({
    id: a.id,
    customerName: a.customer.name,
    customerPhone: a.customer.phone,
    professionalName: a.professional.user.name,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: normalizeAppointmentStatus(a.status as AppointmentStoredStatus),
    totalPrice: Number(a.totalPrice),
    services: a.services.map((s) => s.service.name),
  }));
}

/**
 * Consolida as métricas mensais do tenant com base no faturamento realizado,
 * comissões do período e despesas operacionais efetivamente pagas.
 * As despesas usam a mesma origem de dados do Extrato: transactions EXPENSE
 * vinculadas a expenseId, evitando divergência com o módulo Financeiro.
 */
export async function getMonthlyStatsForTenant(
  tenantId: string,
  period: CivilMonth
): Promise<MonthlyDashboardStats> {
  const { start, endExclusive } = getCivilMonthRange(period);

  const [appointmentsAggregate, commissions, expenseTransactionsAggregate] = await Promise.all([
    db.appointment.aggregate({
      where: {
        tenantId,
        status: { in: APPOINTMENT_REALIZED_STATUSES },
        startTime: {
          gte: start,
          lt: endExclusive,
        },
      },
      _sum: {
        totalPrice: true,
      },
      _count: {
        id: true,
      },
    }),
    db.commission.findMany({
      where: {
        tenantId,
        appointment: {
          is: {
            tenantId,
            status: { in: APPOINTMENT_REALIZED_STATUSES },
            startTime: {
              gte: start,
              lt: endExclusive,
            },
          },
        },
      },
      select: {
        commissionValue: true,
      },
    }),
    db.transaction.aggregate({
      where: {
        tenantId,
        type: "EXPENSE",
        paymentStatus: "PAID",
        expenseId: {
          not: null,
        },
        paidAt: {
          gte: start,
          lt: endExclusive,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const faturamentoMes = Number(appointmentsAggregate._sum.totalPrice ?? 0);
  const totalAtendimentos = appointmentsAggregate._count.id;
  const totalComissoes = commissions.reduce(
    (sum, commission) => sum + Number(commission.commissionValue),
    0
  );
  const totalDespesas = Number(expenseTransactionsAggregate._sum.amount ?? 0);
  const resultadoMes = faturamentoMes - totalComissoes - totalDespesas;
  const ticketMedio = totalAtendimentos > 0 ? faturamentoMes / totalAtendimentos : 0;

  return {
    faturamentoMes: roundCurrency(faturamentoMes),
    totalComissoes: roundCurrency(totalComissoes),
    totalDespesas: roundCurrency(totalDespesas),
    resultadoMes: roundCurrency(resultadoMes),
    totalAtendimentos,
    ticketMedio: roundCurrency(ticketMedio),
  };
}

/**
 * Retorna a série diária do mês para o gráfico evolutivo.
 * Todos os dias do mês são retornados, inclusive os que não possuem movimento.
 * Despesas operacionais usam a mesma base do extrato financeiro.
 */
export async function getDailyRevenueForTenant(
  tenantId: string,
  period: CivilMonth
): Promise<DailyRevenuePoint[]> {
  const { start, endExclusive } = getCivilMonthRange(period);

  const [appointments, commissions, expenseTransactions] = await Promise.all([
    db.appointment.findMany({
      where: {
        tenantId,
        status: { in: APPOINTMENT_REALIZED_STATUSES },
        startTime: {
          gte: start,
          lt: endExclusive,
        },
      },
      select: {
        startTime: true,
        totalPrice: true,
      },
    }),
    db.commission.findMany({
      where: {
        tenantId,
        appointment: {
          is: {
            tenantId,
            status: { in: APPOINTMENT_REALIZED_STATUSES },
            startTime: {
              gte: start,
              lt: endExclusive,
            },
          },
        },
      },
      select: {
        commissionValue: true,
        appointment: {
          select: {
            startTime: true,
          },
        },
      },
    }),
    db.transaction.findMany({
      where: {
        tenantId,
        type: "EXPENSE",
        paymentStatus: "PAID",
        expenseId: {
          not: null,
        },
        paidAt: {
          gte: start,
          lt: endExclusive,
        },
      },
      select: {
        paidAt: true,
        amount: true,
      },
    }),
  ]);

  const points = new Map<string, DailyRevenuePoint>();

  for (let day = 1; day <= getDaysInCivilMonth(period); day += 1) {
    const civilDate = {
      year: period.year,
      month: period.month,
      day,
    };
    const key = formatCivilDateToQuery(civilDate);
    points.set(key, {
      dia: key,
      label: `${String(day).padStart(2, "0")}/${String(period.month).padStart(2, "0")}`,
      faturamento: 0,
      comissoes: 0,
      despesas: 0,
    });
  }

  for (const appointment of appointments) {
    const key = formatCivilDateToQuery(getCivilDateFromDate(appointment.startTime));
    const current = points.get(key);
    if (current) {
      current.faturamento = roundCurrency(
        current.faturamento + Number(appointment.totalPrice)
      );
    }
  }

  for (const commission of commissions) {
    const key = formatCivilDateToQuery(getCivilDateFromDate(commission.appointment.startTime));
    const current = points.get(key);
    if (current) {
      current.comissoes = roundCurrency(
        current.comissoes + Number(commission.commissionValue)
      );
    }
  }

  for (const transaction of expenseTransactions) {
    if (!transaction.paidAt) {
      continue;
    }

    const key = formatCivilDateToQuery(getCivilDateFromDate(transaction.paidAt));
    const current = points.get(key);
    if (current) {
      current.despesas = roundCurrency(
        current.despesas + Number(transaction.amount)
      );
    }
  }

  return Array.from(points.values());
}
