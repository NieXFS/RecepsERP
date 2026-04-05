import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { ActionResult } from "@/types";
import type {
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "@/lib/validators/management";

/**
 * Lista todos os membros da equipe (Users) do tenant,
 * incluindo dados do perfil Professional quando aplicável.
 */
export async function listTeamMembers(tenantId: string) {
  const users = await db.user.findMany({
    where: { tenantId },
    include: {
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

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    professional: u.professional
      ? {
          id: u.professional.id,
          specialty: u.professional.specialty,
          contractType: u.professional.contractType,
          commissionPercent: Number(u.professional.commissionPercent),
          registrationNumber: u.professional.registrationNumber,
          isActive: u.professional.isActive,
        }
      : null,
  }));
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

  // Verifica se email já existe
  const existing = await db.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return { success: false, error: "Já existe um usuário com este email." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  try {
    const result = await db.$transaction(async (tx) => {
      // Cria o User
      const user = await tx.user.create({
        data: {
          tenantId,
          name: data.name,
          email: normalizedEmail,
          passwordHash,
          phone: data.phone ?? null,
          role: data.role,
          isActive: data.isActive,
          deletedAt: data.isActive ? null : new Date(),
        },
      });

      // Se for PROFESSIONAL, cria o perfil associado
      if (data.role === "PROFESSIONAL") {
        await tx.professional.create({
          data: {
            tenantId,
            userId: user.id,
              specialty: data.specialty ?? null,
              commissionPercent: data.commissionPercent ?? 0,
              contractType: data.contractType ?? "PJ",
              registrationNumber: data.registrationNumber ?? null,
              isActive: data.isActive,
            },
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

  const [existingUser, emailOwner] = await Promise.all([
    db.user.findFirst({
      where: { id: userId, tenantId },
      include: {
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

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          email: normalizedEmail,
          phone: data.phone ?? null,
          role: data.role,
          isActive: data.isActive,
          deletedAt: data.isActive ? null : existingUser.deletedAt ?? new Date(),
        },
      });

      const shouldProfessionalBeActive = data.role === "PROFESSIONAL" && data.isActive;

      if (data.role === "PROFESSIONAL") {
        if (existingUser.professional) {
          await tx.professional.update({
            where: { id: existingUser.professional.id },
            data: {
              specialty: data.specialty ?? null,
              commissionPercent: data.commissionPercent ?? 0,
              contractType: data.contractType ?? "PJ",
              registrationNumber: data.registrationNumber ?? null,
              isActive: shouldProfessionalBeActive,
              deletedAt: null,
            },
          });
        } else {
          await tx.professional.create({
            data: {
              tenantId,
              userId,
              specialty: data.specialty ?? null,
              commissionPercent: data.commissionPercent ?? 0,
              contractType: data.contractType ?? "PJ",
              registrationNumber: data.registrationNumber ?? null,
              isActive: shouldProfessionalBeActive,
            },
          });
        }
      } else if (existingUser.professional) {
        await tx.professional.update({
          where: { id: existingUser.professional.id },
          data: {
            isActive: false,
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

  await db.user.update({
    where: { id: userId },
    data: { isActive: false, deletedAt: new Date() },
  });

  return { success: true, data: undefined };
}
