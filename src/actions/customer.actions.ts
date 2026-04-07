"use server";

import { getAuthUser } from "@/lib/session";
import { createCustomerSchema } from "@/lib/validators/customer";
import {
  addClinicalNote,
  addCustomerMedia,
  createCustomer,
} from "@/services/customer.service";
import type { ActionResult } from "@/types";

/**
 * Server Action para criação manual de clientes a partir do dashboard.
 * O tenantId é sempre extraído da sessão autenticada do usuário atual.
 */
export async function createCustomerAction(input: {
  name: string;
  phone: string;
  email?: string;
  document?: string;
}): Promise<
  ActionResult<{
    customer: {
      id: string;
      name: string;
      phone: string | null;
      email: string | null;
      document: string | null;
    };
  }>
> {
  const user = await getAuthUser();
  const parsed = createCustomerSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find(Boolean);

    return {
      success: false,
      error: firstError ?? "Dados inválidos para cadastrar o cliente.",
    };
  }

  return createCustomer(user.tenantId, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || undefined,
    document: parsed.data.document || undefined,
  });
}

/**
 * Server Action usada no perfil do cliente para registrar evolução clínica.
 */
export async function addClinicalNoteAction(
  customerId: string,
  notes: string
): Promise<ActionResult<{ recordId: string }>> {
  const user = await getAuthUser();
  return addClinicalNote(user.tenantId, customerId, notes);
}

/**
 * Server Action usada no perfil do cliente para registrar mídia associada.
 */
export async function uploadCustomerMediaAction(
  customerId: string,
  data: {
    fileName: string;
    fileType: string;
    description?: string;
    category?: string;
    url?: string;
    base64Data?: string;
  }
): Promise<ActionResult<{ mediaId: string }>> {
  const user = await getAuthUser();

  const resolvedUrl =
    data.url ||
    (data.base64Data ? `data:${data.fileType};base64,${data.base64Data}` : null);

  if (!resolvedUrl) {
    return {
      success: false,
      error: "Não foi possível processar a imagem enviada.",
    };
  }

  return addCustomerMedia(user.tenantId, customerId, {
    fileName: data.fileName,
    fileType: data.fileType,
    description: data.description,
    category: data.category,
    url: resolvedUrl,
  });
}
