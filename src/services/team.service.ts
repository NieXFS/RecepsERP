import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { CRITICAL_ADMIN_MODULES } from "@/lib/tenant-modules";
import {
  getModuleAccessMap,
  normalizeCustomPermissions,
} from "@/lib/tenant-permissions";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "@/lib/validators/management";
import {
  getEffectivePermissionSnapshot,
  replaceUserModulePermissions,
} from "@/services/user-permission.service";
import type { ActionResult } from "@/types";

function shouldMaintainProfessionalProfile(data: {
  role: "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL";
  actsAsProfessional?: boolean;
}) {
  return data.role === "PROFESSIONAL" || (data.role === "ADMIN" && data.actsAsProfessional === true);
}

function buildProfessionalUpsertData(
  data: Pick<
    CreateTeamMemberInput | UpdateTeamMemberInput,
    | "specialty"
    | "commissionPercent"
    | "contractType"
    | "registrationNumber"
    | "isActive"
  >,
  tenantId: string,
  userId: string,
  isActive: boolean
) {
  return {
    tenantId,
    userId,
    specialty: data.specialty ?? null,
    commissionPercent: data.commissionPercent ?? 0,
    contractType: data.contractType ?? "PJ",
    registrationNumber: data.registrationNumber ?? null,
    isActive,
    deletedAt: isActive ? null : new Date(),
  };
}

/**
 * Lista todos os membros da equipe (Users) do tenant,
 * incluindo dados do perfil Professional quando aplicável.
 */
export async function listTeamMembers(tenantId: string) {
  const users = await db.user.findMany({
    where: { tenantId },
    include: {
      modulePermissions: {
        select: {
          module: true,
          isAllowed: true,
        },
      },
      professional: {
        select: {
          id: true,
          specialty: true,
          contractType: true,
          commissionPercent: true,
          registrationNumber: true,
          isActive: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => {
    const permissionSnapshot = getEffectivePermissionSnapshot(
      user.role,
      user.customPermissions,
      user.modulePermissions
    );

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      professional: user.professional
        ? {
            id: user.professional.id,
            specialty: user.professional.specialty,
            contractType: user.professional.contractType,
            commissionPercent: Number(user.professional.commissionPercent),
            registrationNumber: user.professional.registrationNumber,
            isActive: user.professional.isActive,
          }
        : null,
      customPermissions: permissionSnapshot.customPermissions,
      allowedModules: permissionSnapshot.allowedModules,
    };
  });
}

/**
 * Cria um novo membro da equipe com senha hasheada.
 * Se a role for PROFESSIONAL, cria também o perfil na tabela Professional
 * em uma única transação ACID para garantir consistência.
 */
export async function createTeamMember(
  tenantId: string,
  data: CreateTeamMemberInput
): Promise<ActionResult<{ userId: string }>> {
  const normalizedEmail = data.email.toLowerCase().trim();
  const customPermissions = normalizeCustomPermissions(data.role, data.customPermissions);

  const existing = await db.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return { success: false, error: "Já existe um usuário com este email." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenantId,
          name: data.name,
          email: normalizedEmail,
          passwordHash,
          phone: data.phone ?? null,
          role: data.role,
          customPermissions,
          isActive: data.isActive,
          deletedAt: data.isActive ? null : new Date(),
        },
      });

      await replaceUserModulePermissions(tx, user.id, data.role, customPermissions);

      if (shouldMaintainProfessionalProfile(data)) {
        await tx.professional.create({
          data: buildProfessionalUpsertData(data, tenantId, user.id, data.isActive),
        });
      }

      return { userId: user.id };
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar membro da equipe.";
    return { success: false, error: message };
  }
}

/**
 * Atualiza um membro da equipe preservando os mesmos registros de User e Professional.
 * Quando o usuário já possui perfil profissional, a edição reaproveita o mesmo Professional.id
 * para não quebrar agenda, comissões e históricos.
 */
export async function updateTeamMember(
  tenantId: string,
  userId: string,
  currentUserId: string,
  data: UpdateTeamMemberInput
): Promise<ActionResult<{ userId: string }>> {
  const normalizedEmail = data.email.toLowerCase().trim();
  const customPermissions = normalizeCustomPermissions(data.role, data.customPermissions);

  const [existingUser, emailOwner] = await Promise.all([
    db.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        modulePermissions: {
          select: {
            module: true,
            isAllowed: true,
          },
        },
        professional: true,
      },
    }),
    db.user.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: userId },
      },
      select: { id: true },
    }),
  ]);

  if (!existingUser) {
    return { success: false, error: "Membro da equipe não encontrado." };
  }

  if (emailOwner) {
    return { success: false, error: "Já existe um usuário com este email." };
  }

  if (currentUserId === userId && !data.isActive) {
    return { success: false, error: "Você não pode desativar a si mesmo." };
  }

  const nextAccess = getModuleAccessMap(customPermissions);
  const missingCriticalAdminModules = CRITICAL_ADMIN_MODULES.filter(
    (module) => !nextAccess[module]
  );

  const activeAdminCount = await db.user.count({
    where: {
      tenantId,
      role: "ADMIN",
      isActive: true,
      deletedAt: null,
    },
  });

  const isOnlyActiveAdmin =
    existingUser.role === "ADMIN" &&
    existingUser.isActive &&
    !existingUser.deletedAt &&
    activeAdminCount === 1;

  if (currentUserId === userId && data.role !== "ADMIN") {
    return {
      success: false,
      error: "Você não pode remover o próprio papel de administrador por esta tela.",
    };
  }

  if (currentUserId === userId && missingCriticalAdminModules.length > 0) {
    return {
      success: false,
      error:
        "Para evitar bloqueio do seu acesso, mantenha Dashboard, Profissionais e Configurações liberados para o próprio admin.",
    };
  }

  if (
    isOnlyActiveAdmin &&
    (data.role !== "ADMIN" || !data.isActive || missingCriticalAdminModules.length > 0)
  ) {
    return {
      success: false,
      error:
        "O único administrador ativo do tenant precisa continuar como admin, ativo e com acesso a Dashboard, Profissionais e Configurações.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: normalizedEmail,
          phone: data.phone ?? null,
          role: data.role,
          customPermissions,
          isActive: data.isActive,
          deletedAt: data.isActive ? null : existingUser.deletedAt ?? new Date(),
        },
      });

      await replaceUserModulePermissions(tx, userId, data.role, customPermissions);

      const shouldProfessionalBeActive =
        shouldMaintainProfessionalProfile(data) && data.isActive;

      if (shouldMaintainProfessionalProfile(data)) {
        if (existingUser.professional) {
          await tx.professional.update({
            where: { id: existingUser.professional.id },
            data: buildProfessionalUpsertData(
              data,
              tenantId,
              userId,
              shouldProfessionalBeActive
            ),
          });
        } else {
          await tx.professional.create({
            data: buildProfessionalUpsertData(
              data,
              tenantId,
              userId,
              shouldProfessionalBeActive
            ),
          });
        }
      } else if (existingUser.professional) {
        await tx.professional.update({
          where: { id: existingUser.professional.id },
          data: {
            isActive: false,
            deletedAt: existingUser.professional.deletedAt ?? new Date(),
          },
        });
      }
    });

    return { success: true, data: { userId } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar membro da equipe.";
    return { success: false, error: message };
  }
}

/**
 * Desativa (soft delete) um membro da equipe.
 * Não permite desativar o próprio usuário para evitar lock-out.
 */
export async function deactivateTeamMember(
  tenantId: string,
  userId: string,
  currentUserId: string
): Promise<ActionResult> {
  if (userId === currentUserId) {
    return { success: false, error: "Você não pode desativar a si mesmo." };
  }

  const user = await db.user.findFirst({
    where: { id: userId, tenantId },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  if (user.role === "ADMIN" && user.isActive && !user.deletedAt) {
    const activeAdminCount = await db.user.count({
      where: {
        tenantId,
        role: "ADMIN",
        isActive: true,
        deletedAt: null,
      },
    });

    if (activeAdminCount === 1) {
      return {
        success: false,
        error: "O único administrador ativo do tenant não pode ser desativado.",
      };
    }
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: new Date() },
    });

    await tx.professional.updateMany({
      where: { userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  });

  return { success: true, data: undefined };
}
