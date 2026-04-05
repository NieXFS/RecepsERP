"use server";

import { requireRole } from "@/lib/session";
import {
  createTeamMemberSchema,
  updateTeamMemberSchema,
} from "@/lib/validators/management";
import {
  createTeamMember,
  deactivateTeamMember,
  updateTeamMember,
} from "@/services/team.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: cria novo membro da equipe com senha hasheada.
 * Se role PROFESSIONAL, cria User + Professional em $transaction.
 * Apenas ADMIN pode criar membros.
 */
export async function createTeamMemberAction(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL";
  phone?: string;
  specialty?: string;
  commissionPercent?: number;
  contractType?: "CLT" | "PJ";
  registrationNumber?: string;
  isActive?: boolean;
}): Promise<ActionResult<{ userId: string }>> {
  const user = await requireRole("ADMIN");
  const parsed = createTeamMemberSchema.safeParse({
    ...data,
    isActive: data.isActive ?? true,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return createTeamMember(user.tenantId, parsed.data);
}

/**
 * Server Action: atualiza um membro da equipe preservando os vínculos históricos.
 * Nunca recria o usuário ou o profissional para editar seus dados.
 */
export async function updateTeamMemberAction(
  userId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    role: "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL";
    specialty?: string;
    commissionPercent?: number;
    contractType?: "CLT" | "PJ";
    registrationNumber?: string;
    isActive?: boolean;
  }
): Promise<ActionResult<{ userId: string }>> {
  const user = await requireRole("ADMIN");
  const parsed = updateTeamMemberSchema.safeParse({
    ...data,
    isActive: data.isActive ?? true,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return updateTeamMember(user.tenantId, userId, user.id, parsed.data);
}

/**
 * Server Action: desativa um membro da equipe (soft delete).
 * Não permite desativar o próprio usuário.
 */
export async function deactivateTeamMemberAction(
  userId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");
  return deactivateTeamMember(user.tenantId, userId, user.id);
}
