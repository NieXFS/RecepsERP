"use server";

import { requireModuleAccess } from "@/lib/session";
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
 * Exige acesso efetivo ao módulo de Serviços.
 */
export async function createServiceAction(
  data: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const user = await requireModuleAccess("SERVICOS");
  return createService(user.tenantId, data);
}

/**
 * Server Action: atualiza serviço existente (replace de ficha técnica e profissionais).
 */
export async function updateServiceAction(
  serviceId: string,
  data: ServiceInput
): Promise<ActionResult<{ serviceId: string }>> {
  const user = await requireModuleAccess("SERVICOS");
  return updateService(user.tenantId, serviceId, data);
}

/**
 * Server Action: desativa serviço (soft delete).
 * Exige acesso efetivo ao módulo de Serviços.
 */
export async function deactivateServiceAction(
  serviceId: string
): Promise<ActionResult> {
  const user = await requireModuleAccess("SERVICOS");
  return deactivateService(user.tenantId, serviceId);
}
