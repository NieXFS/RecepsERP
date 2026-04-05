import { getAuthUserForModule } from "@/lib/session";
import { db } from "@/lib/db";
import { DailyCalendar } from "@/components/agenda/daily-calendar";
import {
  formatCivilDateToQuery,
  getCivilDayRange,
  parseCivilDateFromQuery,
} from "@/lib/civil-date";

/**
 * Página da Agenda (Server Component).
 * Busca profissionais, agendamentos do dia, serviços, clientes,
 * salas e equipamentos do tenant — e passa tudo como props para o
 * DailyCalendar (Client Component) que renderiza a grade interativa.
 */
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await getAuthUserForModule("AGENDA");
  const params = await searchParams;
  const tenantId = user.tenantId;

  // A agenda trata `date` como data civil estável, nunca como ISO ambíguo.
  const selectedDate = parseCivilDateFromQuery(params.date);
  const dayRange = getCivilDayRange(selectedDate);

  // Busca em paralelo todos os dados necessários para renderizar a agenda
  const [professionals, appointments, services, customers, rooms, equipment] =
    await Promise.all([
      // Profissionais ativos do tenant
      db.professional.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        include: {
          user: { select: { name: true } },
          services: { select: { serviceId: true, customCommissionPercent: true } },
        },
        orderBy: { user: { name: "asc" } },
      }),

      // Agendamentos do dia (não cancelados/no-show)
      db.appointment.findMany({
        where: {
          tenantId,
          startTime: { lt: dayRange.endExclusive },
          endTime: { gt: dayRange.start },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          services: { include: { service: { select: { id: true, name: true } } } },
          room: { select: { id: true, name: true } },
          equipments: { include: { equipment: { select: { id: true, name: true } } } },
        },
        orderBy: { startTime: "asc" },
      }),

      // Serviços ativos para o formulário de agendamento
      db.service.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        select: { id: true, name: true, durationMinutes: true, price: true },
        orderBy: { name: "asc" },
      }),

      // Clientes para o buscador do formulário
      db.customer.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        select: { id: true, name: true, phone: true },
        orderBy: { name: "asc" },
        take: 200,
      }),

      // Salas disponíveis
      db.room.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),

      // Equipamentos disponíveis
      db.equipment.findMany({
        where: { tenantId, isActive: true, deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  // Serializa os dados para o Client Component (Decimal → number, Date → string)
  const serializedProfessionals = professionals.map((p) => ({
    id: p.id,
    name: p.user.name,
    specialty: p.specialty,
    serviceIds: p.services.map((s) => s.serviceId),
  }));

  const serializedAppointments = appointments.map((a) => ({
    id: a.id,
    professionalId: a.professionalId,
    customerId: a.customerId,
    customerName: a.customer.name,
    customerPhone: a.customer.phone,
    roomName: a.room?.name ?? null,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    totalPrice: Number(a.totalPrice),
    services: a.services.map((s) => ({
      name: s.service.name,
      price: Number(s.price),
    })),
    equipments: a.equipments.map((e) => e.equipment.name),
  }));

  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    durationMinutes: s.durationMinutes,
    price: Number(s.price),
  }));

  return (
    <div className="flex flex-col gap-4 h-full">
      <DailyCalendar
        date={formatCivilDateToQuery(selectedDate)}
        professionals={serializedProfessionals}
        appointments={serializedAppointments}
        services={serializedServices}
        customers={customers}
        rooms={rooms}
        equipment={equipment}
      />
    </div>
  );
}
