import { db } from "@/lib/db";
import {
  formatCivilDateToQuery,
  getCivilDayRange,
  parseCivilDateFromQuery,
} from "@/lib/civil-date";
import type { CreateAppointmentInput } from "@/lib/validators/appointment";
import type { ActionResult } from "@/types";

/**
 * Cria um agendamento verificando TODAS as colisões antes de inserir:
 *  1. Colisão de horário do profissional (outro agendamento no mesmo intervalo)
 *  2. Colisão de sala (outra reserva na mesma sala e horário)
 *  3. Colisão de equipamentos (equipamento já reservado no horário)
 *  4. Se for sessão de pacote, valida sessões restantes
 *
 * Usa transação Prisma para garantir atomicidade — se qualquer verificação
 * falhar após o início da inserção, tudo sofre rollback.
 */
export async function createAppointment(
  tenantId: string,
  input: CreateAppointmentInput
): Promise<ActionResult<{ appointmentId: string }>> {
  // --- Busca os serviços para calcular duração total e preço ---
  const services = await db.service.findMany({
    where: {
      id: { in: input.serviceIds },
      tenantId,
      isActive: true,
      deletedAt: null,
    },
  });

  if (services.length !== input.serviceIds.length) {
    return { success: false, error: "Um ou mais serviços selecionados não foram encontrados ou estão inativos." };
  }

  // Calcula duração total somando os minutos de cada serviço
  const totalDurationMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const startTime = new Date(input.startTime);
  const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60 * 1000);

  // Calcula preço total (soma dos preços de cada serviço)
  let totalPriceNum = 0;
  for (const s of services) {
    totalPriceNum += Number(s.price);
  }

  // Se for sessão de pacote, o preço cobrado é 0 (já foi pago no pacote)
  const isPackageSession = !!input.customerPackageId;
  const finalPrice = isPackageSession ? 0 : totalPriceNum;

  // --- Validação de pacote (se aplicável) ---
  if (input.customerPackageId) {
    const customerPackage = await db.customerPackage.findFirst({
      where: {
        id: input.customerPackageId,
        tenantId,
        customerId: input.customerId,
        isActive: true,
      },
    });

    if (!customerPackage) {
      return { success: false, error: "Pacote do cliente não encontrado ou já expirado." };
    }

    const remainingSessions = customerPackage.totalSessions - customerPackage.usedSessions;
    if (remainingSessions <= 0) {
      return { success: false, error: "Todas as sessões deste pacote já foram utilizadas." };
    }

    if (customerPackage.expiresAt && customerPackage.expiresAt < new Date()) {
      return { success: false, error: "Este pacote expirou." };
    }
  }

  // --- Verificação de colisão: utiliza transação para atomicidade ---
  try {
    const appointment = await db.$transaction(async (tx) => {
      // 1. COLISÃO DE PROFISSIONAL: verifica se o profissional tem outro agendamento
      //    que sobrepõe o intervalo [startTime, endTime)
      const professionalConflict = await tx.appointment.findFirst({
        where: {
          tenantId,
          professionalId: input.professionalId,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          // Lógica de sobreposição: existente.start < novo.end AND existente.end > novo.start
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (professionalConflict) {
        throw new Error(
          `O profissional já possui um agendamento neste horário (${professionalConflict.startTime.toLocaleString("pt-BR")} - ${professionalConflict.endTime.toLocaleString("pt-BR")}).`
        );
      }

      // 2. COLISÃO DE SALA: verifica se a sala já está reservada no horário
      if (input.roomId) {
        const roomConflict = await tx.appointment.findFirst({
          where: {
            tenantId,
            roomId: input.roomId,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        });

        if (roomConflict) {
          throw new Error(
            "A sala selecionada já está reservada neste horário. Escolha outra sala ou outro horário."
          );
        }
      }

      // 3. COLISÃO DE EQUIPAMENTOS: verifica se algum equipamento já está em uso
      //    no horário solicitado (ex: duas esteticistas tentando usar a mesma máquina de laser)
      if (input.equipmentIds && input.equipmentIds.length > 0) {
        const equipmentConflicts = await tx.appointmentEquipment.findMany({
          where: {
            equipmentId: { in: input.equipmentIds },
            appointment: {
              tenantId,
              status: { notIn: ["CANCELLED", "NO_SHOW"] },
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          },
          include: {
            equipment: true,
          },
        });

        if (equipmentConflicts.length > 0) {
          const conflictNames = [...new Set(equipmentConflicts.map((c) => c.equipment.name))];
          throw new Error(
            `Equipamento(s) indisponível(is) neste horário: ${conflictNames.join(", ")}. Escolha outro horário.`
          );
        }
      }

      // --- Todas as verificações passaram: cria o agendamento ---
      const newAppointment = await tx.appointment.create({
        data: {
          tenantId,
          customerId: input.customerId,
          professionalId: input.professionalId,
          roomId: input.roomId ?? null,
          customerPackageId: input.customerPackageId ?? null,
          startTime,
          endTime,
          totalPrice: finalPrice,
          notes: input.notes,
          services: {
            create: services.map((s) => ({
              serviceId: s.id,
              price: s.price, // Snapshot do preço no momento do agendamento
            })),
          },
          equipments:
            input.equipmentIds && input.equipmentIds.length > 0
              ? {
                  create: input.equipmentIds.map((eqId) => ({
                    equipmentId: eqId,
                  })),
                }
              : undefined,
        },
      });

      // Se for sessão de pacote, incrementa as sessões usadas
      if (input.customerPackageId) {
        const updated = await tx.customerPackage.update({
          where: { id: input.customerPackageId },
          data: { usedSessions: { increment: 1 } },
        });

        // Se atingiu o total, desativa o pacote
        if (updated.usedSessions >= updated.totalSessions) {
          await tx.customerPackage.update({
            where: { id: input.customerPackageId },
            data: { isActive: false },
          });
        }
      }

      return newAppointment;
    });

    return { success: true, data: { appointmentId: appointment.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar agendamento.";
    return { success: false, error: message };
  }
}

/**
 * Lista agendamentos de um tenant com filtros opcionais.
 * Sempre paginado para respeitar a regra de negócio de não permitir SELECT * sem limite.
 */
export async function listAppointments(
  tenantId: string,
  params: {
    page?: number;
    perPage?: number;
    professionalId?: string;
    date?: string;
    status?: string;
  }
) {
  const page = params.page ?? 1;
  const perPage = Math.min(params.perPage ?? 20, 100); // Máximo 100 por página
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { tenantId };

  if (params.professionalId) {
    where.professionalId = params.professionalId;
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.date) {
    const selectedDate = parseCivilDateFromQuery(params.date);
    const dayRange = getCivilDayRange(selectedDate);
    where.startTime = { lt: dayRange.endExclusive };
    where.endTime = { gt: dayRange.start };
  }

  const [data, total] = await Promise.all([
    db.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        professional: {
          select: { id: true, specialty: true, user: { select: { name: true } } },
        },
        services: { include: { service: { select: { name: true } } } },
        room: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
      skip,
      take: perPage,
    }),
    db.appointment.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    date: params.date ? formatCivilDateToQuery(parseCivilDateFromQuery(params.date)) : undefined,
  };
}

/**
 * Busca um agendamento por ID com todos os detalhes (serviços, equipamentos, comissões).
 */
export async function getAppointmentById(tenantId: string, appointmentId: string) {
  return db.appointment.findFirst({
    where: { id: appointmentId, tenantId },
    include: {
      customer: true,
      professional: { include: { user: { select: { name: true, email: true } } } },
      services: { include: { service: true } },
      equipments: { include: { equipment: true } },
      room: true,
      transaction: true,
      commissions: true,
      customerPackage: { include: { package: true } },
    },
  });
}

/**
 * Cancela um agendamento e, se for sessão de pacote, devolve a sessão.
 */
export async function cancelAppointment(
  tenantId: string,
  appointmentId: string,
  cancellationNote?: string
): Promise<ActionResult> {
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, tenantId },
  });

  if (!appointment) {
    return { success: false, error: "Agendamento não encontrado." };
  }

  if (appointment.status === "CANCELLED") {
    return { success: false, error: "Este agendamento já está cancelado." };
  }

  if (appointment.status === "COMPLETED") {
    return { success: false, error: "Não é possível cancelar um agendamento já finalizado." };
  }

  await db.$transaction(async (tx) => {
    await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancellationNote: cancellationNote ?? null,
      },
    });

    // Se era sessão de pacote, devolve a sessão consumida
    if (appointment.customerPackageId) {
      await tx.customerPackage.update({
        where: { id: appointment.customerPackageId },
        data: {
          usedSessions: { decrement: 1 },
          isActive: true, // Reativa caso tenha sido desativado por uso completo
        },
      });
    }
  });

  return { success: true, data: undefined };
}
