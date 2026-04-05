import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma } from "@/generated/prisma/client";
import type { Role, TenantSource } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { ActionResult } from "@/types";
import type {
  AcceptTenantInvitationInput,
  CreateAccessRequestInput,
} from "@/lib/validators/onboarding";

export const DEFAULT_FINANCIAL_ACCOUNT_NAME = "Caixa Principal";
const DEFAULT_INVITATION_EXPIRY_DAYS = 7;
const LOCAL_APP_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
).replace(/\/$/, "");

type PrismaTransaction = Prisma.TransactionClient;

type CreateTenantInvitationParams = {
  businessName: string;
  recipientName: string;
  email: string;
  createdByUserId?: string;
  accessRequestId?: string;
  tenantId?: string;
  roleToGrant?: Role;
  expiresInDays?: number;
  source?: TenantSource;
  notes?: string;
};

export type InvitationPreview =
  | {
      status: "valid";
      email: string;
      tenantName: string;
      recipientName: string | null;
      expiresAt: Date;
    }
  | {
      status: "expired" | "used" | "invalid";
      email?: string;
      tenantName?: string;
      recipientName?: string | null;
      expiresAt?: Date;
    };

/**
 * Cria uma solicitação comercial do ERP sem provisionar tenant, usuário ou conta financeira.
 * Esse é o ponto de entrada público do funil comercial controlado.
 */
export async function createAccessRequest(
  data: CreateAccessRequestInput
): Promise<ActionResult<{ accessRequestId: string }>> {
  const email = normalizeEmail(data.email);

  const [existingUser, existingPendingRequest] = await Promise.all([
    db.user.findUnique({
      where: { email },
      select: { id: true },
    }),
    db.accessRequest.findFirst({
      where: {
        email,
        status: "PENDING",
      },
      select: { id: true },
    }),
  ]);

  if (existingUser) {
    return {
      success: false,
      error: "Este email já está vinculado a uma conta existente.",
    };
  }

  if (existingPendingRequest) {
    return {
      success: false,
      error: "Já existe uma solicitação pendente para este email.",
    };
  }

  const accessRequest = await db.accessRequest.create({
    data: {
      businessName: data.businessName.trim(),
      ownerName: data.ownerName.trim(),
      email,
      phone: data.phone,
      notes: data.notes,
    },
    select: { id: true },
  });

  return {
    success: true,
    data: { accessRequestId: accessRequest.id },
  };
}

/**
 * Lista as solicitações de acesso criadas via funil comercial.
 * A consulta é usada pelo painel interno da Receps para triagem e aprovação.
 */
export async function listAccessRequests() {
  return db.accessRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
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
    },
  });
}

/**
 * Aprova uma solicitação pendente criando o tenant em estado inativo
 * e gerando o convite único que ativará o ambiente do cliente.
 */
export async function approveAccessRequest(
  accessRequestId: string,
  createdByUserId: string
): Promise<
  ActionResult<{
    accessRequestId: string;
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const accessRequest = await db.accessRequest.findUnique({
    where: { id: accessRequestId },
    select: {
      id: true,
      businessName: true,
      ownerName: true,
      email: true,
      notes: true,
      status: true,
    },
  });

  if (!accessRequest) {
    return { success: false, error: "Solicitação não encontrada." };
  }

  if (accessRequest.status !== "PENDING") {
    return {
      success: false,
      error: "Apenas solicitações pendentes podem ser aprovadas.",
    };
  }

  const result = await createTenantInvitation({
    businessName: accessRequest.businessName,
    recipientName: accessRequest.ownerName,
    email: accessRequest.email,
    createdByUserId,
    accessRequestId: accessRequest.id,
    source: "LEAD",
    notes: accessRequest.notes ?? undefined,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      accessRequestId: accessRequest.id,
      ...result.data,
    },
  };
}

/**
 * Gera um convite seguro para ativação do ERP.
 * Se o tenant ainda não existir, ele é criado em estado inativo e só ficará operacional
 * quando o convite for aceito com sucesso.
 */
export async function createTenantInvitation(
  params: CreateTenantInvitationParams
): Promise<
  ActionResult<{
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const email = normalizeEmail(params.email);
  await expirePendingInvitations(email);

  const [existingUser, existingOpenInvitation] = await Promise.all([
    db.user.findUnique({
      where: { email },
      select: { id: true },
    }),
    db.tenantInvitation.findFirst({
      where: {
        email,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    }),
  ]);

  if (existingUser) {
    return {
      success: false,
      error: "Este email já possui uma conta ativa ou em uso.",
    };
  }

  if (existingOpenInvitation) {
    return {
      success: false,
      error: "Já existe um convite pendente para este email.",
    };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() +
      1000 * 60 * 60 * 24 * (params.expiresInDays ?? DEFAULT_INVITATION_EXPIRY_DAYS)
  );

  try {
    const result = await db.$transaction(async (tx) => {
      const tenantId =
        params.tenantId ??
        (await createDraftTenant(tx, {
          businessName: params.businessName,
          email,
          source: params.source ?? "MANUAL_INVITE",
          notes: params.notes,
        })).id;

      if (params.accessRequestId) {
        const request = await tx.accessRequest.findUnique({
          where: { id: params.accessRequestId },
          select: {
            id: true,
            status: true,
          },
        });

        if (!request) {
          throw new Error("Solicitação vinculada não encontrada.");
        }

        if (request.status === "CONVERTED") {
          throw new Error("Esta solicitação já foi convertida em cliente.");
        }
      }

      const invitation = await tx.tenantInvitation.create({
        data: {
          tenantId,
          accessRequestId: params.accessRequestId,
          email,
          recipientName: params.recipientName.trim(),
          tokenHash,
          expiresAt,
          createdByUserId: params.createdByUserId,
          roleToGrant: params.roleToGrant ?? "ADMIN",
        },
        select: {
          id: true,
        },
      });

      if (params.accessRequestId) {
        await tx.accessRequest.update({
          where: { id: params.accessRequestId },
          data: {
            tenantId,
            status: "APPROVED",
            approvedAt: new Date(),
            reviewedByUserId: params.createdByUserId,
          },
        });
      }

      return {
        invitationId: invitation.id,
        tenantId,
      };
    });

    return {
      success: true,
      data: {
        ...result,
        invitationUrl: buildInvitationUrl(rawToken),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o convite.",
    };
  }
}

/**
 * Lista os convites ainda pendentes de ativação.
 * Serve como visibilidade operacional do funil controlado de onboarding.
 */
export async function listPendingTenantInvitations() {
  await expirePendingInvitations();

  return db.tenantInvitation.findMany({
    where: {
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },
      accessRequest: {
        select: {
          id: true,
          businessName: true,
          ownerName: true,
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
 * Resolve o estado público de um convite a partir do token bruto presente na URL.
 * O token nunca é persistido em claro no banco: somente seu hash SHA-256.
 */
export async function getInvitationPreview(token: string): Promise<InvitationPreview> {
  const invitation = await db.tenantInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      tenant: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    return { status: "invalid" };
  }

  if (invitation.status === "ACCEPTED" || invitation.acceptedAt) {
    return {
      status: "used",
      email: invitation.email,
      tenantName: invitation.tenant.name,
      recipientName: invitation.recipientName,
      expiresAt: invitation.expiresAt,
    };
  }

  if (invitation.status === "CANCELLED") {
    return { status: "invalid" };
  }

  if (invitation.expiresAt <= new Date()) {
    await db.tenantInvitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });

    return {
      status: "expired",
      email: invitation.email,
      tenantName: invitation.tenant.name,
      recipientName: invitation.recipientName,
      expiresAt: invitation.expiresAt,
    };
  }

  if (invitation.status === "EXPIRED") {
    return {
      status: "expired",
      email: invitation.email,
      tenantName: invitation.tenant.name,
      recipientName: invitation.recipientName,
      expiresAt: invitation.expiresAt,
    };
  }

  return {
    status: "valid",
    email: invitation.email,
    tenantName: invitation.tenant.name,
    recipientName: invitation.recipientName,
    expiresAt: invitation.expiresAt,
  };
}

/**
 * Aceita um convite válido, cria o usuário administrador principal,
 * ativa o tenant e garante a conta financeira padrão em uma transação única.
 */
export async function acceptTenantInvitation(
  input: AcceptTenantInvitationInput
): Promise<ActionResult<{ tenantId: string; userId: string }>> {
  const tokenHash = hashToken(input.token);
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const result = await db.$transaction(async (tx) => {
      const invitation = await tx.tenantInvitation.findUnique({
        where: { tokenHash },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
            },
          },
          accessRequest: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new Error("Convite não encontrado.");
      }

      if (invitation.status !== "PENDING" || invitation.acceptedAt) {
        throw new Error("Este convite já foi utilizado ou não está mais disponível.");
      }

      if (invitation.expiresAt <= new Date()) {
        await tx.tenantInvitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });

        throw new Error("Este convite expirou. Solicite um novo link ao time da Receps.");
      }

      const existingUser = await tx.user.findUnique({
        where: { email: invitation.email },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error("Já existe uma conta vinculada a este email.");
      }

      const user = await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          name:
            invitation.recipientName?.trim() ||
            invitation.email.split("@")[0] ||
            "Administrador",
          email: invitation.email,
          passwordHash,
          role: invitation.roleToGrant,
        },
        select: {
          id: true,
        },
      });

      await ensureDefaultFinancialAccount(invitation.tenantId, tx);

      await tx.tenant.update({
        where: { id: invitation.tenantId },
        data: {
          isActive: true,
          lifecycleStatus: "ACTIVE",
          email: invitation.email,
        },
      });

      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });

      if (invitation.accessRequest?.id) {
        await tx.accessRequest.update({
          where: { id: invitation.accessRequest.id },
          data: {
            status: "CONVERTED",
            convertedAt: new Date(),
          },
        });
      }

      return {
        tenantId: invitation.tenantId,
        userId: user.id,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível ativar sua conta.",
    };
  }
}

/**
 * Garante de forma idempotente que o tenant possua a conta financeira
 * padrão exigida pelos fluxos de checkout e comissão.
 */
export async function ensureDefaultFinancialAccount(
  tenantId: string,
  tx: PrismaTransaction = db
) {
  return tx.financialAccount.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name: DEFAULT_FINANCIAL_ACCOUNT_NAME,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      tenantId,
      name: DEFAULT_FINANCIAL_ACCOUNT_NAME,
      type: "CASH",
      balance: 0,
      isActive: true,
    },
  });
}

async function createDraftTenant(
  tx: PrismaTransaction,
  data: {
    businessName: string;
    email: string;
    source: TenantSource;
    notes?: string;
  }
) {
  const slug = await generateUniqueTenantSlug(tx, data.businessName);

  return tx.tenant.create({
    data: {
      name: data.businessName.trim(),
      slug,
      source: data.source,
      lifecycleStatus: "INCOMPLETE",
      email: data.email,
      notes: data.notes,
      isActive: false,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

async function generateUniqueTenantSlug(
  tx: PrismaTransaction,
  businessName: string
) {
  const baseSlug = slugify(businessName);
  let candidate = baseSlug;
  let attempt = 1;

  while (
    await tx.tenant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    attempt += 1;
    candidate = `${baseSlug}-${attempt}`;
  }

  return candidate;
}

export async function expirePendingInvitations(email?: string) {
  await db.tenantInvitation.updateMany({
    where: {
      status: "PENDING",
      expiresAt: { lte: new Date() },
      ...(email ? { email } : {}),
    },
    data: {
      status: "EXPIRED",
    },
  });
}

function buildInvitationUrl(token: string) {
  return `${LOCAL_APP_ORIGIN}/convite/${token}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function slugify(value: string) {
  const sanitized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "tenant";
}
