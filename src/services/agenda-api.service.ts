import { db } from "@/lib/db";
import { createAppointment } from "@/services/appointment.service";
import {
  civilDateToLocalDate,
  getCivilDayRange,
  parseCivilDate,
} from "@/lib/civil-date";
import {
  generateTimeSlots,
  getTenantScheduleBounds,
  normalizeTenantScheduleConfig,
  type TenantScheduleConfig,
} from "@/lib/tenant-schedule";
import type {
  AgendaInfoQuery,
  AvailabilityQuery,
  BookAppointmentApiInput,
} from "@/lib/validators/agenda-api";

type AgendaApiTenant = {
  id: string;
  slug: string;
  name: string;
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: number;
};

type AvailabilitySlot = {
  label: string;
  startTime: Date;
  endTime: Date;
};

function formatTimeLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function buildAvailabilitySlots(
  date: string,
  durationMinutes: number,
  scheduleConfig: TenantScheduleConfig
): AvailabilitySlot[] {
  const civilDate = parseCivilDate(date);

  if (!civilDate) {
    return [];
  }

  const dayRange = getCivilDayRange(civilDate);
  const normalizedSchedule = normalizeTenantScheduleConfig(scheduleConfig);
  const slots = generateTimeSlots(normalizedSchedule);
  const scheduleBounds = getTenantScheduleBounds(normalizedSchedule);

  return slots
    .map((slot) => {
      const startTime = civilDateToLocalDate(civilDate, {
        hour: slot.hour,
        minute: slot.minute,
        second: 0,
        millisecond: 0,
      });
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      return {
        label: slot.label,
        startTime,
        endTime,
      };
    })
    .filter((slot) => {
      const closingBoundary = civilDateToLocalDate(civilDate, {
        hour: Math.floor(scheduleBounds.endMinutes / 60),
        minute: scheduleBounds.endMinutes % 60,
        second: 0,
        millisecond: 0,
      });

      return slot.startTime >= dayRange.start && slot.endTime <= closingBoundary;
    });
}

function isAppointmentBlocking(
  appointment: { startTime: Date; endTime: Date; professionalId: string },
  professionalId: string,
  startTime: Date,
  endTime: Date
) {
  return (
    appointment.professionalId === professionalId &&
    appointment.startTime < endTime &&
    appointment.endTime > startTime
  );
}

async function getActiveTenantBySlug(tenantSlug: string): Promise<AgendaApiTenant | null> {
  return db.tenant.findFirst({
    where: {
      slug: tenantSlug,
      isActive: true,
      lifecycleStatus: { not: "SUSPENDED" },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      openingTime: true,
      closingTime: true,
      slotIntervalMinutes: true,
    },
  });
}

async function getActiveServiceForTenant(tenantId: string, serviceId: string) {
  return db.service.findFirst({
    where: {
      id: serviceId,
      tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      price: true,
      professionals: {
        select: {
          professionalId: true,
        },
      },
    },
  });
}

async function getEligibleProfessionals(
  tenantId: string,
  serviceId: string,
  professionalId?: string
) {
  return db.professional.findMany({
    where: {
      tenantId,
      id: professionalId,
      isActive: true,
      deletedAt: null,
      services: {
        some: {
          serviceId,
        },
      },
      user: {
        isActive: true,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      specialty: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });
}

function isLikelySchedulingConflict(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("neste horário") ||
    normalized.includes("indisponível") ||
    normalized.includes("reservada")
  );
}

async function findOrCreateCustomer(
  tenantId: string,
  customerPhone?: string,
  customerName?: string
) {
  const normalizedPhone = customerPhone?.trim() || null;
  const normalizedName = customerName?.trim() || null;

  if (normalizedPhone) {
    const customerByPhone = await db.customer.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        phone: normalizedPhone,
      },
    });

    if (customerByPhone) {
      if (!customerByPhone.isActive) {
        return db.customer.update({
          where: { id: customerByPhone.id },
          data: { isActive: true },
        });
      }

      return customerByPhone;
    }
  }

  if (normalizedName) {
    const customerByName = await db.customer.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        name: {
          equals: normalizedName,
          mode: "insensitive",
        },
      },
    });

    if (customerByName) {
      if (!customerByName.isActive || (!customerByName.phone && normalizedPhone)) {
        return db.customer.update({
          where: { id: customerByName.id },
          data: {
            isActive: true,
            phone: customerByName.phone ?? normalizedPhone,
          },
        });
      }

      return customerByName;
    }
  }

  const fallbackName = normalizedName || `Cliente WhatsApp ${normalizedPhone ?? "sem identificação"}`;

  return db.customer.create({
    data: {
      tenantId,
      name: fallbackName,
      phone: normalizedPhone,
      isActive: true,
    },
  });
}

export async function getAgendaInfoForBot(params: AgendaInfoQuery) {
  const tenant = await getActiveTenantBySlug(params.tenantSlug);

  if (!tenant) {
    return { error: "Tenant não encontrado ou indisponível." as const };
  }

  const [services, professionals] = await Promise.all([
    db.service.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        price: true,
      },
      orderBy: { name: "asc" },
    }),
    db.professional.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        deletedAt: null,
        user: {
          isActive: true,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        specialty: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    }),
  ]);

  return {
    tenant,
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
    })),
    professionals: professionals.map((professional) => ({
      id: professional.id,
      name: professional.user.name,
      specialty: professional.specialty,
    })),
  };
}

export async function getAgendaAvailabilityForBot(params: AvailabilityQuery) {
  const tenant = await getActiveTenantBySlug(params.tenantSlug);

  if (!tenant) {
    return { error: "Tenant não encontrado ou indisponível." as const };
  }

  const service = await getActiveServiceForTenant(tenant.id, params.serviceId);

  if (!service) {
    return { error: "Serviço não encontrado ou indisponível." as const };
  }

  const professionals = await getEligibleProfessionals(
    tenant.id,
    params.serviceId,
    params.professionalId
  );

  if (params.professionalId && professionals.length === 0) {
    return {
      error: "O profissional informado não está ativo ou não pode realizar este serviço." as const,
    };
  }

  if (professionals.length === 0) {
    return {
      error: "Não há profissionais ativos habilitados para este serviço." as const,
    };
  }

  const civilDate = parseCivilDate(params.date);

  if (!civilDate) {
    return { error: "Data inválida." as const };
  }

  const dayRange = getCivilDayRange(civilDate);
  const appointments = await db.appointment.findMany({
    where: {
      tenantId: tenant.id,
      professionalId: { in: professionals.map((professional) => professional.id) },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startTime: { lt: dayRange.endExclusive },
      endTime: { gt: dayRange.start },
    },
    select: {
      professionalId: true,
      startTime: true,
      endTime: true,
    },
  });

  const candidateSlots = buildAvailabilitySlots(
    params.date,
    service.durationMinutes,
    tenant
  );
  const availableTimes = candidateSlots
    .filter((slot) =>
      professionals.some(
        (professional) =>
          !appointments.some((appointment) =>
            isAppointmentBlocking(
              appointment,
              professional.id,
              slot.startTime,
              slot.endTime
            )
          )
      )
    )
    .map((slot) => slot.label);

  return {
    tenant,
    service: {
      id: service.id,
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
    },
    professionalId: params.professionalId ?? null,
    date: params.date,
    availableTimes,
  };
}

export async function bookAppointmentForBot(input: BookAppointmentApiInput) {
  const tenant = await getActiveTenantBySlug(input.tenantSlug);

  if (!tenant) {
    return { status: 404 as const, error: "Tenant não encontrado ou indisponível." };
  }

  const service = await getActiveServiceForTenant(tenant.id, input.serviceId);

  if (!service) {
    return { status: 404 as const, error: "Serviço não encontrado ou indisponível." };
  }

  const professionals = await getEligibleProfessionals(
    tenant.id,
    input.serviceId,
    input.professionalId
  );

  if (professionals.length === 0) {
    return {
      status: 400 as const,
      error: "O profissional informado não está ativo ou não pode realizar este serviço.",
    };
  }

  const startTime = new Date(input.startTime);

  if (Number.isNaN(startTime.getTime())) {
    return { status: 400 as const, error: "startTime inválido." };
  }

  const expectedEndTime = new Date(
    startTime.getTime() + service.durationMinutes * 60 * 1000
  );

  if (input.endTime) {
    const informedEndTime = new Date(input.endTime);

    if (Number.isNaN(informedEndTime.getTime())) {
      return { status: 400 as const, error: "endTime inválido." };
    }

    if (informedEndTime.getTime() !== expectedEndTime.getTime()) {
      return {
        status: 400 as const,
        error:
          "endTime não corresponde à duração configurada para o serviço informado.",
      };
    }
  }

  const customer = await findOrCreateCustomer(
    tenant.id,
    input.customerPhone,
    input.customerName
  );

  const booking = await createAppointment(tenant.id, {
    customerId: customer.id,
    professionalId: input.professionalId,
    serviceIds: [input.serviceId],
    startTime,
    roomId: null,
    equipmentIds: [],
    notes: "Agendamento criado via API externa da IA.",
  });

  if (!booking.success) {
    return {
      status: isLikelySchedulingConflict(booking.error) ? (409 as const) : (400 as const),
      error: booking.error,
    };
  }

  const appointment = await db.appointment.findFirst({
    where: {
      id: booking.data.appointmentId,
      tenantId: tenant.id,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      professional: {
        select: {
          id: true,
          specialty: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      services: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) {
    return {
      status: 500 as const,
      error: "Agendamento criado, mas não foi possível carregar os dados de retorno.",
    };
  }

  return {
    status: 200 as const,
    data: {
      id: appointment.id,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      customer: {
        id: appointment.customer.id,
        name: appointment.customer.name,
        phone: appointment.customer.phone,
      },
      professional: {
        id: appointment.professional.id,
        name: appointment.professional.user.name,
        specialty: appointment.professional.specialty,
      },
      services: appointment.services.map((serviceItem) => ({
        id: serviceItem.service.id,
        name: serviceItem.service.name,
      })),
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      status: appointment.status,
      totalPrice: Number(appointment.totalPrice),
    },
  };
}
