"use server";

import { requireModuleAccess } from "@/lib/session";
import { addClinicalNote, addCustomerMedia } from "@/services/customer.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: adiciona nota de evolução clínica ao prontuário.
 * Exige acesso efetivo ao módulo de Prontuários.
 */
export async function addClinicalNoteAction(
  customerId: string,
  notes: string
): Promise<ActionResult<{ recordId: string }>> {
  const user = await requireModuleAccess("PRONTUARIOS");
  return addClinicalNote(user.tenantId, customerId, notes);
}

/**
 * Server Action: registra um arquivo de mídia (foto antes/depois) para o cliente.
 * Em produção, o arquivo seria enviado para S3/Cloudinary antes de chamar esta action.
 * Nesta versão local, recebe base64 de imagens pequenas ou URL simulada.
 *
 * TODO (Produção): Substituir por upload presigned URL para S3/Cloudinary.
 * O fluxo real seria:
 *   1. Frontend pede presigned URL via API route
 *   2. Frontend faz upload direto para o bucket
 *   3. Frontend chama esta action com a URL final do bucket
 */
export async function uploadCustomerMediaAction(
  customerId: string,
  data: {
    fileName: string;
    fileType: string;
    description?: string;
    category?: string;
    base64Data: string; // Em produção seria a URL do bucket
  }
): Promise<ActionResult<{ mediaId: string }>> {
  const user = await requireModuleAccess("CLIENTES");

  // Simula URL do bucket — em produção seria a URL real do S3/Cloudinary
  const simulatedUrl = `data:${data.fileType};base64,${data.base64Data}`;

  return addCustomerMedia(user.tenantId, customerId, {
    fileName: data.fileName,
    fileType: data.fileType,
    description: data.description,
    category: data.category,
    url: simulatedUrl,
  });
}
