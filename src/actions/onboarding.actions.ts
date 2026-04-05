"use server";

import { revalidatePath } from "next/cache";
import {
  acceptTenantInvitation,
  approveAccessRequest,
  createAccessRequest,
  createTenantInvitation,
} from "@/services/onboarding.service";
import {
  acceptTenantInvitationSchema,
  createAccessRequestSchema,
  createTenantInvitationSchema,
} from "@/lib/validators/onboarding";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types";

function revalidateRecepsPanelPaths(tenantId?: string) {
  revalidatePath("/painel-receps");
  revalidatePath("/painel-receps/leads");
  revalidatePath("/painel-receps/convites");
  revalidatePath("/painel-receps/clientes");

  if (tenantId) {
    revalidatePath(`/painel-receps/clientes/${tenantId}`);
  }
}

/**
 * Server Action pública que registra um lead comercial do ERP.
 * Não provisiona tenant, usuário ou recursos financeiros.
 */
export async function createAccessRequestAction(input: {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  notes?: string;
}): Promise<ActionResult<{ accessRequestId: string }>> {
  const parsed = createAccessRequestSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return createAccessRequest(parsed.data);
}

/**
 * Server Action pública que ativa a conta principal do tenant a partir de um convite válido.
 */
export async function acceptTenantInvitationAction(input: {
  token: string;
  password: string;
}): Promise<ActionResult<{ tenantId: string; userId: string }>> {
  const parsed = acceptTenantInvitationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return acceptTenantInvitation(parsed.data);
}

/**
 * Server Action interna para aprovar uma solicitação de acesso
 * e devolver o link local do convite gerado.
 */
export async function approveAccessRequestAction(
  accessRequestId: string
): Promise<
  ActionResult<{
    accessRequestId: string;
    invitationId: string;
    invitationUrl: string;
    tenantId: string;
  }>
> {
  const user = await requireSuperAdmin();
  const result = await approveAccessRequest(accessRequestId, user.id);

  if (result.success) {
    revalidateRecepsPanelPaths(result.data.tenantId);
  }

  return result;
}

/**
 * Server Action interna para criar um convite manual sem passar pela solicitação pública.
 */
export async function createTenantInvitationAction(input: {
  businessName: string;
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
  const parsed = createTenantInvitationSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const result = await createTenantInvitation({
    ...parsed.data,
    createdByUserId: user.id,
  });

  if (result.success) {
    revalidateRecepsPanelPaths(result.data.tenantId);
  }

  return result;
}
