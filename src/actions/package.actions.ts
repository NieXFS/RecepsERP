"use server";

import { requireModuleAccess } from "@/lib/session";
import { packageSchema } from "@/lib/validators/management";
import {
  createPackage,
  updatePackage,
} from "@/services/package.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: cria um pacote comercial no tenant autenticado.
 * ADMIN e RECEPTIONIST podem operar o módulo de pacotes.
 */
export async function createPackageAction(
  data: unknown
): Promise<ActionResult<{ packageId: string }>> {
  const user = await requireModuleAccess("PACOTES", "edit");
  const parsed = packageSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return createPackage(user.tenantId, parsed.data);
}

/**
 * Server Action: atualiza um pacote existente preservando o mesmo registro.
 */
export async function updatePackageAction(
  packageId: string,
  data: unknown
): Promise<ActionResult<{ packageId: string }>> {
  const user = await requireModuleAccess("PACOTES", "edit");
  const parsed = packageSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  return updatePackage(user.tenantId, packageId, parsed.data);
}
