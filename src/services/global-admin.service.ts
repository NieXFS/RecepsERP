import { db } from "@/lib/db";
import type {
  AccessRequestStatus,
  Role,
  TenantLifecycleStatus,
  TenantSource,
  TenantInvitationStatus,
} from "@/generated/prisma/enums";
import type { ActionResult } from "@/types";
import {
  createTenantInvitation,
  DEFAULT_FINANCIAL_ACCOUNT_NAME,
  expirePendingInvitations,
} from "@/services/onboarding.service";

export type GlobalTenantStatus =
  | "ACTIVE"
  | "SUSPENDED"
  | "INVITE_PENDING"
  | "INCOMPLETE";

export type GlobalTenantListParams = {
  search?: string;
  status?: GlobalTenantStatus | "ALL";
  sort?: "createdAt_desc" | "createdAt_asc" | "name_asc" | "name_desc";
};

export type GlobalLeadListParams = {
  search?: string;
  status?: AccessRequestStatus | "ALL";
};

export type GlobalInvitationListParams = {
  search?: string;
  status?: TenantInvitationStatus | "ALL";
};

type TenantSnapshot = Awaited<ReturnType<typeof loadTenantSnapshots>>[number];

/**
 * Lista tenants reais da base da Receps com status global derivado,
 * pronto para busca, filtros e visão consolidada do painel interno.
 */
export async function listGlobalTenants(params: GlobalTenantListParams = {}) {
  const tenants = await loadTenantSnapshots(params);
  const mapped = tenants.map(mapTenantToListItem);

  if (params.status && params.status !== "ALL") {
    return mapped.filter((tenant) => tenant.globalStatus === params.status);
  }

  return mapped;
}

/**
 * Monta o overview executivo do painel global da Receps.
 * Consolida contagens e recortes recentes de leads, convites e tenants.
 */
export async function getRecepsOverview() {
  const [tenants, leads, invitations, totalUsers] = await Promise.all([
    listGlobalTenants({ sort: "createdAt_desc" }),
    listGlobalLeads(),
    listGlobalInvitations(),
    db.user.count({
      where: {
        globalRole: null,
        tenant: {
          users: {
            none: {
              globalRole: "SUPER_ADMIN",
            },
          },
        },
      },
    }),
  ]);

  const activeTenants = tenants.filter((tenant) => tenant.globalStatus === "ACTIVE");
  const suspendedTenants = tenants.filter((tenant) => tenant.globalStatus === "SUSPENDED");
  const incompleteTenants = tenants.filter((tenant) => tenant.globalStatus === "INCOMPLETE");
  const invitePendingTenants = tenants.filter(
    (tenant) => tenant.globalStatus === "INVITE_PENDING"
  );

  return {
    metrics: {
      pendingLeads: leads.filter((lead) => lead.status === "PENDING").length,
      pendingInvitations: invitations.filter((invitation) => invitation.status === "PENDING")
        .length,
      activeTenants: activeTenants.length,
      suspendedTenants: suspendedTenants.length,
      incompleteTenants: incompleteTenants.length,
      totalTenants: tenants.length,
      totalUsers,
    },
    recentLeads: leads.slice(0, 5),
    recentInvitations: invitations.slice(0, 5),
    recentTenants: tenants.slice(0, 5),
    tenantsAwaitingActivation: [...invitePendingTenants, ...incompleteTenants]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 5),
    operationalTenants: activeTenants.slice(0, 5),
  };
}

/**
 * Lista leads do funil comercial com status explícito, busca textual e vínculos
 * com tenant/invites quando a solicitação já avançou no onboarding.
 */
export async function listGlobalLeads(params: GlobalLeadListParams = {}) {
  const search = params.search?.trim();

  return db.accessRequest.findMany({
    where: {
      ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      ...(search
        ? {
            OR: [
              { businessName: { contains: search, mode: "insensitive" } },
              { ownerName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          source: true,
          lifecycleStatus: true,
          isActive: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      invitations: {
        select: {
          id: true,
          email: true,
          status: true,
          createdAt: true,
          expiresAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Lista convites emitidos pela operação global da Receps,
 * com busca por tenant, email e vínculo com lead quando existir.
 */
export async function listGlobalInvitations(
  params: GlobalInvitationListParams = {}
) {
  await expirePendingInvitations();
  const search = params.search?.trim();

  return db.tenantInvitation.findMany({
    where: {
      tenant: {
        users: {
          none: {
            globalRole: "SUPER_ADMIN",
          },
        },
      },
      ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { recipientName: { contains: search, mode: "insensitive" } },
              { tenant: { name: { contains: search, mode: "insensitive" } } },
              { tenant: { slug: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          source: true,
          lifecycleStatus: true,
          isActive: true,
        },
      },
      accessRequest: {
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          status: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Retorna o detalhe global de um tenant com usuários, histórico de convites,
 * sinais operacionais e a classificação de status derivado do cliente.
 */
export async function getTenantDetail(tenantId: string) {
  await expirePendingInvitations();

  const tenant = await db.tenant.findFirst({
    where: {
      id: tenantId,
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
    },
    include: {
      users: {
        where: {
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          recipientName: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          acceptedAt: true,
          roleToGrant: true,
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      accessRequests: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          businessName: true,
          ownerName: true,
          email: true,
          phone: true,
          notes: true,
          status: true,
          createdAt: true,
          approvedAt: true,
          convertedAt: true,
        },
      },
      financialAccounts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          createdAt: true,
        },
      },
      subscription: {
        include: {
          plan: true,
          invoices: {
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            take: 5,
          },
        },
      },
      referral: {
        include: {
          rewards: {
            include: {
              referredTenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          },
        },
      },
      referredByTenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      referredTenants: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          referredByCode: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          users: true,
          financialAccounts: true,
        },
      },
    },
  });

  if (!tenant) {
    return null;
  }

  const globalStatus = deriveTenantGlobalStatus(tenant);
  const mainContact = deriveTenantMainContact(tenant);
  const hasDefaultFinancialAccount = tenant.financialAccounts.some(
    (account) => account.name === DEFAULT_FINANCIAL_ACCOUNT_NAME
  );

  return {
    ...tenant,
    globalStatus,
    mainContact,
    operational: {
      isOperational: globalStatus === "ACTIVE",
      hasDefaultFinancialAccount,
      userCount: tenant._count.users,
      financialAccountCount: tenant._count.financialAccounts,
      hasPendingInvitation: tenant.invitations.some(
        (invitation) => invitation.status === "PENDING"
      ),
      hasAcceptedInvitation: tenant.invitations.some(
        (invitation) => invitation.status === "ACCEPTED"
      ),
    },
  };
}

/**
 * Controla a exceção manual de billing para tenants específicos,
 * sem alterar o estado real da assinatura Stripe.
 */
export async function setTenantBillingBypass(
  tenantId: string,
  input: {
    enabled: boolean;
    reason?: string | null;
  }
): Promise<ActionResult<{ tenantId: string; enabled: boolean }>> {
  const tenant = await db.tenant.findFirst({
    where: {
      id: tenantId,
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  await db.tenant.update({
    where: { id: tenant.id },
    data: {
      billingBypassEnabled: input.enabled,
      billingBypassReason: input.enabled ? input.reason?.trim() || null : null,
      billingBypassUpdatedAt: new Date(),
    },
  });

  return {
    success: true,
    data: {
      tenantId: tenant.id,
      enabled: input.enabled,
    },
  };
}

/**
 * Suspende um tenant em contexto global, marcando o cliente como indisponível
 * sem misturar essa decisão ao RBAC interno do estabelecimento.
 */
export async function suspendTenant(
  tenantId: string
): Promise<ActionResult<{ tenantId: string }>> {
  const tenant = await db.tenant.findFirst({
    where: {
      id: tenantId,
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
    },
    select: {
      id: true,
      lifecycleStatus: true,
    },
  });

  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  if (tenant.lifecycleStatus === "SUSPENDED") {
    return { success: false, error: "Este tenant já está suspenso." };
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      lifecycleStatus: "SUSPENDED",
      isActive: false,
    },
  });

  return { success: true, data: { tenantId } };
}

/**
 * Reativa um tenant e recompõe seu lifecycleStatus de acordo com os sinais
 * operacionais mínimos já presentes no banco.
 */
export async function reactivateTenant(
  tenantId: string
): Promise<ActionResult<{ tenantId: string; lifecycleStatus: TenantLifecycleStatus }>> {
  const tenant = await db.tenant.findFirst({
    where: {
      id: tenantId,
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
    },
    include: {
      users: {
        where: { deletedAt: null },
        select: { id: true, isActive: true },
      },
      financialAccounts: {
        select: { id: true, name: true },
      },
    },
  });

  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  const nextLifecycleStatus = computeLifecycleStatusFromSignals(tenant);

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      lifecycleStatus: nextLifecycleStatus,
      isActive: nextLifecycleStatus === "ACTIVE",
    },
  });

  return {
    success: true,
    data: {
      tenantId,
      lifecycleStatus: nextLifecycleStatus,
    },
  };
}

/**
 * Cancela um convite pendente. O tenant continua existindo,
 * mas volta a aparecer como incompleto se ainda não estiver operacional.
 */
export async function cancelTenantInvitation(
  invitationId: string
): Promise<ActionResult<{ invitationId: string; tenantId: string }>> {
  const invitation = await db.tenantInvitation.findUnique({
    where: { id: invitationId },
    include: {
      tenant: {
        include: {
          users: {
            where: { deletedAt: null },
            select: { id: true, isActive: true, globalRole: true },
          },
          financialAccounts: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!invitation) {
    return { success: false, error: "Convite não encontrado." };
  }

  if (invitation.status !== "PENDING") {
    return { success: false, error: "Apenas convites pendentes podem ser cancelados." };
  }

  await db.$transaction(async (tx) => {
    await tx.tenantInvitation.update({
      where: { id: invitationId },
      data: {
        status: "CANCELLED",
      },
    });

    if (invitation.tenant.lifecycleStatus !== "SUSPENDED") {
      const nextLifecycleStatus = computeLifecycleStatusFromSignals(invitation.tenant);

      await tx.tenant.update({
        where: { id: invitation.tenantId },
        data: {
          lifecycleStatus: nextLifecycleStatus,
          isActive: nextLifecycleStatus === "ACTIVE",
        },
      });
    }
  });

  return {
    success: true,
    data: {
      invitationId,
      tenantId: invitation.tenantId,
    },
  };
}

/**
 * Reemite logicamente um convite: cancela o link pendente atual, quando houver,
 * e cria um novo token para o mesmo tenant.
 */
export async function regenerateTenantInvitation(
  invitationId: string,
  createdByUserId: string
): Promise<
  ActionResult<{
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const invitation = await db.tenantInvitation.findUnique({
    where: { id: invitationId },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          source: true,
          notes: true,
        },
      },
    },
  });

  if (!invitation) {
    return { success: false, error: "Convite não encontrado." };
  }

  if (invitation.status === "PENDING") {
    const cancelResult = await cancelTenantInvitation(invitationId);
    if (!cancelResult.success) {
      return cancelResult;
    }
  }

  return createTenantInvitation({
    tenantId: invitation.tenantId,
    businessName: invitation.tenant.name,
    recipientName: invitation.recipientName ?? invitation.email,
    email: invitation.email,
    createdByUserId,
    source: invitation.tenant.source,
    notes: invitation.tenant.notes ?? undefined,
    roleToGrant: invitation.roleToGrant as Role,
  });
}

/**
 * Gera um novo convite para um tenant já existente, útil para novo admin principal
 * ou reposição de ativação sem recriar o cliente.
 */
export async function createTenantAdminInvitation(
  tenantId: string,
  input: {
    email: string;
    recipientName: string;
    expiresInDays?: number;
  },
  createdByUserId: string
): Promise<
  ActionResult<{
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const tenant = await db.tenant.findFirst({
    where: {
      id: tenantId,
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
    },
    select: {
      id: true,
      name: true,
      source: true,
      notes: true,
    },
  });

  if (!tenant) {
    return { success: false, error: "Tenant não encontrado." };
  }

  return createTenantInvitation({
    tenantId: tenant.id,
    businessName: tenant.name,
    recipientName: input.recipientName,
    email: input.email,
    createdByUserId,
    expiresInDays: input.expiresInDays,
    source: tenant.source,
    notes: tenant.notes ?? undefined,
  });
}

/**
 * Rejeita um lead pendente sem convertê-lo em tenant.
 */
export async function rejectAccessRequest(
  accessRequestId: string,
  reviewedByUserId: string
): Promise<ActionResult<{ accessRequestId: string }>> {
  const request = await db.accessRequest.findUnique({
    where: { id: accessRequestId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!request) {
    return { success: false, error: "Solicitação não encontrada." };
  }

  if (request.status !== "PENDING") {
    return { success: false, error: "Apenas leads pendentes podem ser rejeitados." };
  }

  await db.accessRequest.update({
    where: { id: accessRequestId },
    data: {
      status: "REJECTED",
      reviewedByUserId,
    },
  });

  return {
    success: true,
    data: { accessRequestId },
  };
}

async function loadTenantSnapshots(params: GlobalTenantListParams = {}) {
  await expirePendingInvitations();
  const search = params.search?.trim();

  return db.tenant.findMany({
    where: {
      users: {
        none: {
          globalRole: "SUPER_ADMIN",
        },
      },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              {
                users: {
                  some: {
                    deletedAt: null,
                    OR: [
                      { name: { contains: search, mode: "insensitive" } },
                      { email: { contains: search, mode: "insensitive" } },
                    ],
                  },
                },
              },
              {
                invitations: {
                  some: {
                    email: { contains: search, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: resolveTenantOrderBy(params.sort),
    include: {
      users: {
        where: {
          deletedAt: null,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          globalRole: true,
        },
      },
      invitations: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          recipientName: true,
          status: true,
          createdAt: true,
          acceptedAt: true,
          expiresAt: true,
        },
      },
      accessRequests: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          ownerName: true,
          email: true,
          phone: true,
          notes: true,
          status: true,
          createdAt: true,
        },
      },
      financialAccounts: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
}

function mapTenantToListItem(tenant: TenantSnapshot) {
  const globalStatus = deriveTenantGlobalStatus(tenant);
  const mainContact = deriveTenantMainContact(tenant);
  const hasPendingInvitation = tenant.invitations.some(
    (invitation) => invitation.status === "PENDING"
  );
  const hasDefaultFinancialAccount = tenant.financialAccounts.some(
    (account) => account.name === DEFAULT_FINANCIAL_ACCOUNT_NAME
  );

  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    source: tenant.source,
    lifecycleStatus: tenant.lifecycleStatus,
    globalStatus,
    createdAt: tenant.createdAt,
    mainContactName: mainContact.name,
    mainContactEmail: mainContact.email,
    userCount: tenant._count.users,
    hasPendingInvitation,
    isOperational: globalStatus === "ACTIVE",
    hasDefaultFinancialAccount,
  };
}

function deriveTenantGlobalStatus(tenant: {
  lifecycleStatus: TenantLifecycleStatus;
  isActive: boolean;
  users: Array<{ isActive: boolean }>;
  invitations: Array<{ status: TenantInvitationStatus }>;
  financialAccounts: Array<{ name: string; isActive?: boolean }>;
}): GlobalTenantStatus {
  if (tenant.lifecycleStatus === "SUSPENDED") {
    return "SUSPENDED";
  }

  const hasOperationalUser = tenant.users.some((user) => user.isActive);
  const hasDefaultFinancialAccount = tenant.financialAccounts.some(
    (account) => account.name === DEFAULT_FINANCIAL_ACCOUNT_NAME
  );
  const hasPendingInvitation = tenant.invitations.some(
    (invitation) => invitation.status === "PENDING"
  );

  if (hasPendingInvitation && (!hasOperationalUser || tenant.lifecycleStatus === "INCOMPLETE")) {
    return "INVITE_PENDING";
  }

  if (
    tenant.lifecycleStatus === "ACTIVE" &&
    tenant.isActive &&
    hasOperationalUser &&
    hasDefaultFinancialAccount
  ) {
    return "ACTIVE";
  }

  return "INCOMPLETE";
}

function deriveTenantMainContact(tenant: {
  users: Array<{ name: string; email: string; role: Role; createdAt: Date }>;
  invitations: Array<{ recipientName: string | null; email: string; createdAt: Date }>;
  accessRequests: Array<{ ownerName: string; email: string; createdAt: Date }>;
}) {
  const adminUser =
    tenant.users.find((user) => user.role === "ADMIN") ?? tenant.users[0] ?? null;

  if (adminUser) {
    return {
      name: adminUser.name,
      email: adminUser.email,
    };
  }

  const invitation = tenant.invitations[0];
  if (invitation) {
    return {
      name: invitation.recipientName ?? invitation.email,
      email: invitation.email,
    };
  }

  const accessRequest = tenant.accessRequests[0];
  if (accessRequest) {
    return {
      name: accessRequest.ownerName,
      email: accessRequest.email,
    };
  }

  return {
    name: null,
    email: null,
  };
}

function computeLifecycleStatusFromSignals(tenant: {
  users: Array<{ isActive: boolean }>;
  financialAccounts: Array<{ name: string }>;
}): TenantLifecycleStatus {
  const hasOperationalUser = tenant.users.some((user) => user.isActive);
  const hasDefaultFinancialAccount = tenant.financialAccounts.some(
    (account) => account.name === DEFAULT_FINANCIAL_ACCOUNT_NAME
  );

  return hasOperationalUser && hasDefaultFinancialAccount ? "ACTIVE" : "INCOMPLETE";
}

function resolveTenantOrderBy(sort: GlobalTenantListParams["sort"]) {
  switch (sort) {
    case "createdAt_asc":
      return { createdAt: "asc" } as const;
    case "name_asc":
      return { name: "asc" } as const;
    case "name_desc":
      return { name: "desc" } as const;
    case "createdAt_desc":
    default:
      return { createdAt: "desc" } as const;
  }
}
