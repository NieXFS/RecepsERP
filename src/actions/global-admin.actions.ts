"use server";

import { revalidatePath } from "next/cache";
import type { TenantLifecycleStatus } from "@/generated/prisma/enums";
import { createTenantAdminInvitationSchema } from "@/lib/validators/onboarding";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types";
import {
  cancelTenantInvitation,
  createTenantAdminInvitation,
  reactivateTenant,
  regenerateTenantInvitation,
  rejectAccessRequest,
  suspendTenant,
} from "@/services/global-admin.service";

function revalidateRecepsAdminPaths(tenantId?: string) {
  revalidatePath("/painel-receps");
  revalidatePath("/painel-receps/clientes");
  revalidatePath("/painel-receps/leads");
  revalidatePath("/painel-receps/convites");

  if (tenantId) {
    revalidatePath(`/painel-receps/clientes/${tenantId}`);
  }
}

/**
 * Rejeita um lead pendente no funil comercial da Receps.
 */
export async function rejectAccessRequestAction(
  accessRequestId: string
): Promise<ActionResult<{ accessRequestId: string }>> {
  const user = await requireSuperAdmin();
  const result = await rejectAccessRequest(accessRequestId, user.id);

  if (result.success) {
    revalidateRecepsAdminPaths();
  }

  return result;
}

/**
 * Cancela um convite pendente emitido pela Receps.
 */
export async function cancelTenantInvitationAction(
  invitationId: string
): Promise<ActionResult<{ invitationId: string; tenantId: string }>> {
  await requireSuperAdmin();
  const result = await cancelTenantInvitation(invitationId);

  if (result.success) {
    revalidateRecepsAdminPaths(result.data.tenantId);
  }

  return result;
}

/**
 * Reemite um convite a partir de um convite anterior.
 */
export async function regenerateTenantInvitationAction(
  invitationId: string
): Promise<
  ActionResult<{
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const user = await requireSuperAdmin();
  const result = await regenerateTenantInvitation(invitationId, user.id);

  if (result.success) {
    revalidateRecepsAdminPaths(result.data.tenantId);
  }

  return result;
}

/**
 * Suspende um tenant no contexto global da Receps.
 */
export async function suspendTenantAction(
  tenantId: string
): Promise<ActionResult<{ tenantId: string }>> {
  await requireSuperAdmin();
  const result = await suspendTenant(tenantId);

  if (result.success) {
    revalidateRecepsAdminPaths(result.data.tenantId);
  }

  return result;
}

/**
 * Reativa um tenant globalmente, devolvendo seu lifecycleStatus recomposto.
 */
export async function reactivateTenantAction(
  tenantId: string
): Promise<ActionResult<{ tenantId: string; lifecycleStatus: TenantLifecycleStatus }>> {
  await requireSuperAdmin();
  const result = await reactivateTenant(tenantId);

  if (result.success) {
    revalidateRecepsAdminPaths(result.data.tenantId);
  }

  return result;
}

/**
 * Gera um novo convite manual para um tenant já existente.
 */
export async function createTenantAdminInvitationAction(input: {
  tenantId: string;
  recipientName: string;
  email: string;
  expiresInDays?: number;
}): Promise<
  ActionResult<{
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const user = await requireSuperAdmin();
  const parsed = createTenantAdminInvitationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const result = await createTenantAdminInvitation(
    input.tenantId,
    {
      recipientName: parsed.data.recipientName,
      email: parsed.data.email,
      expiresInDays: parsed.data.expiresInDays,
    },
    user.id
  );

  if (result.success) {
    revalidateRecepsAdminPaths(result.data.tenantId);
  }

  return result;
}
