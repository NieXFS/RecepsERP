"use server";

import {
  isMasterRequiredError,
  MASTER_REQUIRED_MESSAGE,
  requireMasterSession,
} from "@/lib/active-user";
import { requireModuleAccess } from "@/lib/session";
import {
  createRoom,
  createEquipment,
  deactivateRoom,
  deactivateEquipment,
} from "@/services/resources.service";
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

/** Server Action: cria uma nova sala. Exige acesso ao módulo de Configurações. */
export async function createRoomAction(
  name: string
): Promise<ActionResult<{ roomId: string }>> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

  return createRoom(user.tenantId, name);
}

/** Server Action: cria um novo equipamento. Exige acesso ao módulo de Configurações. */
export async function createEquipmentAction(
  name: string
): Promise<ActionResult<{ equipmentId: string }>> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

  return createEquipment(user.tenantId, name);
}

/** Server Action: desativa uma sala (soft delete). Exige acesso ao módulo de Configurações. */
export async function deactivateRoomAction(
  roomId: string
): Promise<ActionResult> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

  return deactivateRoom(user.tenantId, roomId);
}

/** Server Action: desativa um equipamento (soft delete). Exige acesso ao módulo de Configurações. */
export async function deactivateEquipmentAction(
  equipmentId: string
): Promise<ActionResult> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

  return deactivateEquipment(user.tenantId, equipmentId);
}
