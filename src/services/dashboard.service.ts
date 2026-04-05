import { db } from "@/lib/db";

/**
 * Busca os KPIs do dia para o dashboard do Tenant.
 * Retorna faturamento, ticket médio, agendamentos e novos clientes.
 */
export async function getDailyKPIs(tenantId: string) {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

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
        paidAt: { gte: dayStart, lte: dayEnd },
      },
      select: { amount: true },
    }),

    // Agendamentos COMPLETED do dia (para calcular ticket médio)
    db.appointment.count({
      where: {
        tenantId,
        status: "COMPLETED",
        startTime: { gte: dayStart, lte: dayEnd },
      },
    }),

    // Total de agendamentos do dia (qualquer status exceto cancelados)
    db.appointment.count({
      where: {
        tenantId,
        startTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
    }),

    // Novos clientes cadastrados hoje
    db.customer.count({
      where: {
        tenantId,
        createdAt: { gte: dayStart, lte: dayEnd },
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
 * Busca agendamentos de hoje que estão na "sala de espera" —
 * status SCHEDULED, CONFIRMED ou CHECKED_IN — para o painel de check-in rápido.
 */
export async function getWaitingRoomAppointments(tenantId: string) {
  const today = new Date();
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);

  const appointments = await db.appointment.findMany({
    where: {
      tenantId,
      startTime: { gte: dayStart, lte: dayEnd },
      status: { in: ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] },
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
    status: a.status,
    totalPrice: Number(a.totalPrice),
    services: a.services.map((s) => s.service.name),
  }));
}
