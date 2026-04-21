import { db } from "@/lib/db";
import { buildPayoutDescription } from "@/lib/commission-format";
import { recordAudit, type AuditActor } from "@/lib/audit";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export type PayableCommission = {
  id: string;
  professionalId: string;
  professionalName: string;
  commissionValue: number;
  serviceAmount: number;
  commissionRate: number;
  serviceDescription: string;
  customerName: string;
  occurredAt: string;
  createdAt: string;
};

export type PayoutPreviewCommission = {
  id: string;
  amount: number;
  baseAmount: number;
  percentage: number;
  serviceDescription: string;
  customerName: string;
  occurredAt: string;
};

export type PayoutPreview = {
  professional: { id: string; name: string };
  totalAmount: number;
  commissionCount: number;
  periodStart: string;
  periodEnd: string;
  commissions: PayoutPreviewCommission[];
};

export type PayoutHistoryCommission = {
  id: string;
  amount: number;
  baseAmount: number;
  percentage: number;
  serviceDescription: string;
  customerName: string;
  occurredAt: string;
};

export type PayoutHistoryItem = {
  id: string;
  totalAmount: number;
  commissionCount: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
  notes: string | null;
  professional: { id: string; name: string };
  financialAccount: { id: string; name: string; type: string } | null;
  transaction: { id: string; description: string | null } | null;
  createdBy: { id: string; name: string | null } | null;
  commissions: PayoutHistoryCommission[];
};

type CommissionFilters = {
  professionalId?: string;
  from?: Date;
  to?: Date;
};

function buildServiceDescription(
  services: Array<{ service: { name: string } }>
): string {
  const names = services.map((s) => s.service.name).filter(Boolean);
  if (names.length === 0) return "Atendimento";
  if (names.length === 1) return names[0]!;
  return `${names[0]} +${names.length - 1}`;
}

/**
 * Lista todas as comissões com status PENDING e sem payoutId ligado,
 * ordenadas por profissional e depois por createdAt, pra facilitar
 * o agrupamento visual na UI de seleção.
 */
export async function getPayableCommissions(
  tenantId: string,
  filters?: CommissionFilters
): Promise<PayableCommission[]> {
  const commissions = await db.commission.findMany({
    where: {
      tenantId,
      status: "PENDING",
      payoutId: null,
      ...(filters?.professionalId
        ? { professionalId: filters.professionalId }
        : {}),
      ...(filters?.from || filters?.to
        ? {
            appointment: {
              startTime: {
                ...(filters?.from ? { gte: filters.from } : {}),
                ...(filters?.to ? { lt: filters.to } : {}),
              },
            },
          }
        : {}),
    },
    include: {
      professional: { select: { id: true, user: { select: { name: true } } } },
      appointment: {
        select: {
          startTime: true,
          customer: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
      },
    },
    orderBy: [
      { professional: { user: { name: "asc" } } },
      { createdAt: "asc" },
    ],
  });

  return commissions.map((c) => ({
    id: c.id,
    professionalId: c.professionalId,
    professionalName: c.professional.user.name,
    commissionValue: roundCurrency(Number(c.commissionValue)),
    serviceAmount: roundCurrency(Number(c.serviceAmount)),
    commissionRate: Number(c.commissionRate),
    serviceDescription: buildServiceDescription(c.appointment.services),
    customerName: c.appointment.customer?.name ?? "Cliente avulso",
    occurredAt: c.appointment.startTime.toISOString(),
    createdAt: c.createdAt.toISOString(),
  }));
}

/**
 * Valida um conjunto de commissionIds e retorna o preview agregado para
 * exibição no dialog de acerto. Lança erro se algo estiver inconsistente.
 */
export async function getCommissionPayoutPreview(
  tenantId: string,
  commissionIds: string[]
): Promise<PayoutPreview> {
  if (commissionIds.length === 0) {
    throw new Error("Selecione ao menos uma comissão.");
  }

  const commissions = await db.commission.findMany({
    where: { id: { in: commissionIds }, tenantId },
    include: {
      professional: { select: { id: true, user: { select: { name: true } } } },
      appointment: {
        select: {
          startTime: true,
          customer: { select: { name: true } },
          services: { include: { service: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (commissions.length !== commissionIds.length) {
    throw new Error("Uma ou mais comissões não foram encontradas.");
  }

  const alreadyPaid = commissions.filter(
    (c) => c.status !== "PENDING" || c.payoutId !== null
  );
  if (alreadyPaid.length > 0) {
    throw new Error(
      `${alreadyPaid.length} comissão(ões) já foram pagas ou não estão mais pendentes.`
    );
  }

  const professionalIds = Array.from(
    new Set(commissions.map((c) => c.professionalId))
  );
  if (professionalIds.length > 1) {
    throw new Error(
      "Selecione comissões de apenas um profissional por vez."
    );
  }

  const professional = commissions[0]!.professional;
  const totalAmount = roundCurrency(
    commissions.reduce((sum, c) => sum + Number(c.commissionValue), 0)
  );
  const sortedDates = commissions
    .map((c) => c.appointment.startTime.getTime())
    .sort((a, b) => a - b);
  const periodStart = new Date(sortedDates[0]!);
  const periodEnd = new Date(sortedDates[sortedDates.length - 1]!);

  return {
    professional: {
      id: professional.id,
      name: professional.user.name,
    },
    totalAmount,
    commissionCount: commissions.length,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    commissions: commissions.map((c) => ({
      id: c.id,
      amount: roundCurrency(Number(c.commissionValue)),
      baseAmount: roundCurrency(Number(c.serviceAmount)),
      percentage: Number(c.commissionRate),
      serviceDescription: buildServiceDescription(c.appointment.services),
      customerName: c.appointment.customer?.name ?? "Cliente avulso",
      occurredAt: c.appointment.startTime.toISOString(),
    })),
  };
}

type CreateCommissionPayoutInput = {
  tenantId: string;
  userId: string;
  commissionIds: string[];
  financialAccountId: string;
  paidAt?: Date;
  notes?: string;
  actor?: AuditActor;
};

/**
 * Fecha um acerto em lote: marca as comissões como PAID, cria o CommissionPayout
 * agrupador e a Transaction EXPENSE na conta financeira escolhida — tudo numa
 * única transação Prisma (rollback se qualquer passo falhar).
 */
export async function createCommissionPayout(
  input: CreateCommissionPayoutInput
): Promise<{ payoutId: string }> {
  if (input.commissionIds.length === 0) {
    throw new Error("Selecione ao menos uma comissão.");
  }
  if (!input.financialAccountId) {
    throw new Error("Selecione a conta financeira de saída.");
  }

  const paidAt = input.paidAt ?? new Date();

  return db.$transaction(async (tx) => {
    const account = await tx.financialAccount.findFirst({
      where: {
        id: input.financialAccountId,
        tenantId: input.tenantId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!account) {
      throw new Error("Conta financeira não disponível. Selecione outra.");
    }

    const commissions = await tx.commission.findMany({
      where: { id: { in: input.commissionIds }, tenantId: input.tenantId },
      include: {
        professional: { select: { id: true, user: { select: { name: true } } } },
        appointment: { select: { startTime: true } },
      },
    });

    if (commissions.length !== input.commissionIds.length) {
      throw new Error("Uma ou mais comissões não foram encontradas.");
    }

    const invalid = commissions.filter(
      (c) => c.status !== "PENDING" || c.payoutId !== null
    );
    if (invalid.length > 0) {
      throw new Error(
        `${invalid.length} comissão(ões) já foram pagas ou não estão mais pendentes.`
      );
    }

    const professionalIds = Array.from(
      new Set(commissions.map((c) => c.professionalId))
    );
    if (professionalIds.length > 1) {
      throw new Error(
        "Todas as comissões do acerto devem ser de um mesmo profissional."
      );
    }

    const professional = commissions[0]!.professional;
    const totalAmount = roundCurrency(
      commissions.reduce((sum, c) => sum + Number(c.commissionValue), 0)
    );
    if (totalAmount <= 0) {
      throw new Error(
        "O total das comissões selecionadas é zero — nada a pagar."
      );
    }
    const sortedDates = commissions
      .map((c) => c.appointment.startTime.getTime())
      .sort((a, b) => a - b);
    const periodStart = new Date(sortedDates[0]!);
    const periodEnd = new Date(sortedDates[sortedDates.length - 1]!);

    const payout = await tx.commissionPayout.create({
      data: {
        tenantId: input.tenantId,
        professionalId: professional.id,
        totalAmount,
        commissionCount: commissions.length,
        periodStart,
        periodEnd,
        financialAccountId: input.financialAccountId,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        paidAt,
        createdById: input.userId,
      },
    });

    const updated = await tx.commission.updateMany({
      where: {
        id: { in: input.commissionIds },
        tenantId: input.tenantId,
        status: "PENDING",
        payoutId: null,
      },
      data: {
        status: "PAID",
        paidAt,
        payoutId: payout.id,
      },
    });

    if (updated.count !== commissions.length) {
      throw new Error(
        "Comissões alteradas por outro usuário durante o acerto. Atualize a tela e tente novamente."
      );
    }

    const transaction = await tx.transaction.create({
      data: {
        tenantId: input.tenantId,
        accountId: input.financialAccountId,
        type: "EXPENSE",
        paymentStatus: "PAID",
        amount: totalAmount,
        paidAt,
        description: buildPayoutDescription(
          professional.user.name,
          periodStart,
          periodEnd
        ),
      },
    });

    await tx.commissionPayout.update({
      where: { id: payout.id },
      data: { transactionId: transaction.id },
    });

    if (input.actor) {
      const formattedTotal = totalAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      await recordAudit(tx, {
        tenantId: input.tenantId,
        actor: input.actor,
        action: "PAYOUT_CREATED",
        entityType: "CommissionPayout",
        entityId: payout.id,
        summary: `Acerto de ${professional.user.name} · ${commissions.length} comissão(ões) · ${formattedTotal}`,
        snapshot: {
          professionalId: professional.id,
          professionalName: professional.user.name,
          totalAmount,
          commissionCount: commissions.length,
          commissionIds: input.commissionIds,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          financialAccountId: input.financialAccountId,
        },
        metadata: { transactionId: transaction.id },
      });

      for (const commission of commissions) {
        await recordAudit(tx, {
          tenantId: input.tenantId,
          actor: input.actor,
          action: "COMMISSION_PAID",
          entityType: "Commission",
          entityId: commission.id,
          summary: `Comissão paga no acerto de ${professional.user.name}`,
          metadata: { payoutId: payout.id },
        });
      }
    }

    // TODO: implementar undo de payout (desligar commissions, reverter transação, apagar payout)

    return { payoutId: payout.id };
  });
}

/**
 * Lista acertos fechados do tenant (com relations populadas para UI).
 */
export async function getCommissionPayoutHistory(
  tenantId: string,
  filters?: CommissionFilters
): Promise<PayoutHistoryItem[]> {
  const payouts = await db.commissionPayout.findMany({
    where: {
      tenantId,
      ...(filters?.professionalId
        ? { professionalId: filters.professionalId }
        : {}),
      ...(filters?.from || filters?.to
        ? {
            paidAt: {
              ...(filters?.from ? { gte: filters.from } : {}),
              ...(filters?.to ? { lt: filters.to } : {}),
            },
          }
        : {}),
    },
    include: {
      professional: { select: { id: true, user: { select: { name: true } } } },
      financialAccount: { select: { id: true, name: true, type: true } },
      transaction: { select: { id: true, description: true } },
      createdBy: { select: { id: true, name: true } },
      commissions: {
        include: {
          appointment: {
            select: {
              startTime: true,
              customer: { select: { name: true } },
              services: { include: { service: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  return payouts.map((p) => ({
    id: p.id,
    totalAmount: roundCurrency(Number(p.totalAmount)),
    commissionCount: p.commissionCount,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    paidAt: p.paidAt.toISOString(),
    notes: p.notes,
    professional: {
      id: p.professional.id,
      name: p.professional.user.name,
    },
    financialAccount: p.financialAccount
      ? {
          id: p.financialAccount.id,
          name: p.financialAccount.name,
          type: p.financialAccount.type,
        }
      : null,
    transaction: p.transaction
      ? { id: p.transaction.id, description: p.transaction.description }
      : null,
    createdBy: p.createdBy
      ? { id: p.createdBy.id, name: p.createdBy.name }
      : null,
    commissions: p.commissions.map((c) => ({
      id: c.id,
      amount: roundCurrency(Number(c.commissionValue)),
      baseAmount: roundCurrency(Number(c.serviceAmount)),
      percentage: Number(c.commissionRate),
      serviceDescription: buildServiceDescription(c.appointment.services),
      customerName: c.appointment.customer?.name ?? "Cliente avulso",
      occurredAt: c.appointment.startTime.toISOString(),
    })),
  }));
}

/**
 * Retorna um payout específico com relações populadas.
 */
export async function getCommissionPayoutById(
  tenantId: string,
  id: string
): Promise<PayoutHistoryItem | null> {
  const list = await getCommissionPayoutHistory(tenantId);
  return list.find((p) => p.id === id) ?? null;
}
