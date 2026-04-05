"use server";

import { requireRole } from "@/lib/session";
import {
  createRoom,
  createEquipment,
  deactivateRoom,
  deactivateEquipment,
} from "@/services/resources.service";
import type { ActionResult } from "@/types";

/** Server Action: cria uma nova sala. Apenas ADMIN. */
export async function createRoomAction(
  name: string
): Promise<ActionResult<{ roomId: string }>> {
  const user = await requireRole("ADMIN");
  return createRoom(user.tenantId, name);
}

/** Server Action: cria um novo equipamento. Apenas ADMIN. */
export async function createEquipmentAction(
  name: string
): Promise<ActionResult<{ equipmentId: string }>> {
  const user = await requireRole("ADMIN");
  return createEquipment(user.tenantId, name);
}

/** Server Action: desativa uma sala (soft delete). Apenas ADMIN. */
export async function deactivateRoomAction(
  roomId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");
  return deactivateRoom(user.tenantId, roomId);
}

/** Server Action: desativa um equipamento (soft delete). Apenas ADMIN. */
export async function deactivateEquipmentAction(
  equipmentId: string
): Promise<ActionResult> {
  const user = await requireRole("ADMIN");
  return deactivateEquipment(user.tenantId, equipmentId);
}
