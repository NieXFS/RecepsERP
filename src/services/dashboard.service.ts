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
  lucroMes: number;
  totalAtendimentos: number;
  ticketMedio: number;
};

export type DailyRevenuePoint = {
  dia: string;
  label: string;
  faturamento: number;
  comissoes: number;
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
    todayTransactions,
    completedAppointmentsCount,
    totalAppointmentsCount,
    newCustomersCount,
  ] = await Promise.all([
    // Soma das transações INCOME pagas do dia
    db.transaction.findMany({
      where: {
        tenantId,
        type: "INCOME",
        paymentStatus: "PAID",
        paidAt: { gte: dayStart, lt: endExclusive },
      },
      select: { amount: true },
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

  const revenue = todayTransactions.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

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
 * Consolida as métricas mensais reais do tenant com base em atendimentos concluídos
 * e comissões geradas para esses atendimentos no período selecionado.
 */
export async function getMonthlyStatsForTenant(
  tenantId: string,
  period: CivilMonth
): Promise<MonthlyDashboardStats> {
  const { start, endExclusive } = getCivilMonthRange(period);

  const [appointmentsAggregate, commissions] = await Promise.all([
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
  ]);

  const faturamentoMes = Number(appointmentsAggregate._sum.totalPrice ?? 0);
  const totalAtendimentos = appointmentsAggregate._count.id;
  const totalComissoes = commissions.reduce(
    (sum, commission) => sum + Number(commission.commissionValue),
    0
  );
  const lucroMes = faturamentoMes - totalComissoes;
  const ticketMedio = totalAtendimentos > 0 ? faturamentoMes / totalAtendimentos : 0;

  return {
    faturamentoMes: roundCurrency(faturamentoMes),
    totalComissoes: roundCurrency(totalComissoes),
    lucroMes: roundCurrency(lucroMes),
    totalAtendimentos,
    ticketMedio: roundCurrency(ticketMedio),
  };
}

/**
 * Retorna a série diária do mês para o gráfico evolutivo.
 * Todos os dias do mês são retornados, inclusive os que não possuem movimento.
 */
export async function getDailyRevenueForTenant(
  tenantId: string,
  period: CivilMonth
): Promise<DailyRevenuePoint[]> {
  const { start, endExclusive } = getCivilMonthRange(period);

  const [appointments, commissions] = await Promise.all([
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

  return Array.from(points.values());
}
