"use server";

import { getAuthUser } from "@/lib/session";
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CustomerInput,
} from "@/lib/validators/customer";
import {
  addClinicalNote,
  addCustomerMedia,
  createCustomer,
  updateCustomer,
} from "@/services/customer.service";
import type { ActionResult } from "@/types";

/**
 * Server Action para criação manual de clientes a partir do dashboard.
 * O tenantId é sempre extraído da sessão autenticada do usuário atual.
 */
export async function createCustomerAction(
  input: CustomerInput
): Promise<
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
    birthDate: parsed.data.birthDate || undefined,
    gender: parsed.data.gender,
    zipCode: parsed.data.zipCode || undefined,
    street: parsed.data.street || undefined,
    number: parsed.data.number || undefined,
    complement: parsed.data.complement || undefined,
    neighborhood: parsed.data.neighborhood || undefined,
    city: parsed.data.city || undefined,
    state: parsed.data.state || undefined,
    notes: parsed.data.notes || undefined,
  });
}

export async function updateCustomerAction(
  customerId: string,
  input: CustomerInput
): Promise<
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
  const parsed = updateCustomerSchema.safeParse(input);

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)
      .flat()
      .find(Boolean);

    return {
      success: false,
      error: firstError ?? "Dados inválidos para atualizar o cliente.",
    };
  }

  return updateCustomer(user.tenantId, customerId, {
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || undefined,
    document: parsed.data.document || undefined,
    birthDate: parsed.data.birthDate || undefined,
    gender: parsed.data.gender,
    zipCode: parsed.data.zipCode || undefined,
    street: parsed.data.street || undefined,
    number: parsed.data.number || undefined,
    complement: parsed.data.complement || undefined,
    neighborhood: parsed.data.neighborhood || undefined,
    city: parsed.data.city || undefined,
    state: parsed.data.state || undefined,
    notes: parsed.data.notes || undefined,
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
