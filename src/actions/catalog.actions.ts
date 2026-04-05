"use server";

import { requireRole } from "@/lib/session";
import { createService, updateService, deactivateService } from "@/services/catalog.service";
import type { ActionResult } from "@/types";

type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  materials: { productId: string; quantity: number }[];
  professionals: { professionalId: string; customCommissionPercent?: number }[];
};

/**
 * Server Action: cria serviço com ficha técnica e profissionais em $transaction.
 * Apenas ADMIN pode gerenciar o catálogo.
 */
export async function createServiceAction(
  data: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const user = await requireRole("ADMIN");
  return createService(user.tenantId, data);
}

/**
 * Server Action: atualiza serviço existente (replace de ficha técnica e profissionais).
 */
export async function updateServiceAction(
  serviceId: string,
  data: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const user = await requireRole("ADMIN");
  return updateService(user.tenantId, serviceId, data);
}

/**
 * Server Action: desativa serviço (soft delete).
 */
export async function deactivateServiceAction(
  serviceId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");
  return deactivateService(user.tenantId, serviceId);
}
