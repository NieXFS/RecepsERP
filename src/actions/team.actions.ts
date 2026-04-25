"use server";

import type { TenantCustomPermissions } from "@/lib/tenant-permissions";
import {
  isMasterRequiredError,
  MASTER_REQUIRED_MESSAGE,
  requireMasterSession,
} from "@/lib/active-user";
import { requirePermission } from "@/lib/session";
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

type MasterErrorResult = { success: false; error: string };

async function ensureMasterForSensitiveAction(): Promise<MasterErrorResult | null> {
  try {
    await requireMasterSession();
    return null;
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return { success: false, error: MASTER_REQUIRED_MESSAGE };
    }

    throw error;
  }
}

/**
 * Server Action: cria novo membro da equipe com senha hasheada.
 * Se role PROFESSIONAL, cria User + Professional em $transaction.
 * Exige acesso efetivo ao módulo de Profissionais.
 */
export async function createTeamMemberAction(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL";
  actsAsProfessional?: boolean;
  phone?: string;
  specialty?: string;
  commissionPercent?: number;
  contractType?: "CLT" | "PJ";
  registrationNumber?: string;
  isActive?: boolean;
  customPermissions?: TenantCustomPermissions;
}): Promise<ActionResult<{ userId: string }>> {
  const user = await requirePermission("profissionais", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

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
    actsAsProfessional?: boolean;
    specialty?: string;
    commissionPercent?: number;
    contractType?: "CLT" | "PJ";
    registrationNumber?: string;
    isActive?: boolean;
    customPermissions?: TenantCustomPermissions;
  }
): Promise<ActionResult<{ userId: string }>> {
  const user = await requirePermission("profissionais", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

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
  const user = await requirePermission("profissionais", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

  return deactivateTeamMember(user.tenantId, userId, user.id);
}
