import { db } from "@/lib/db";
import type { ActionResult } from "@/types";

/**
 * Lista salas ativas do tenant para a tela de gestão de recursos.
 */
export async function listRooms(tenantId: string) {
  const rooms = await db.room.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return rooms.map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Lista equipamentos ativos do tenant para a tela de gestão de recursos.
 */
export async function listEquipments(tenantId: string) {
  const equipments = await db.equipment.findMany({
    where: { tenantId, isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
  });

  return equipments.map((e) => ({
    id: e.id,
    name: e.name,
    createdAt: e.createdAt.toISOString(),
  }));
}

/** Cria uma nova sala para o tenant */
export async function createRoom(
  tenantId: string,
  name: string
): Promise<ActionResult<{ roomId: string }>> {
  if (!name.trim()) {
    return { success: false, error: "O nome da sala é obrigatório." };
  }

  const room = await db.room.create({
    data: { tenantId, name: name.trim() },
  });

  return { success: true, data: { roomId: room.id } };
}

/** Cria um novo equipamento para o tenant */
export async function createEquipment(
  tenantId: string,
  name: string
): Promise<ActionResult<{ equipmentId: string }>> {
  if (!name.trim()) {
    return { success: false, error: "O nome do equipamento é obrigatório." };
  }

  const equipment = await db.equipment.create({
    data: { tenantId, name: name.trim() },
  });

  return { success: true, data: { equipmentId: equipment.id } };
}

/** Desativa (soft delete) uma sala */
export async function deactivateRoom(
  tenantId: string,
  roomId: string
): Promise<ActionResult> {
  const room = await db.room.findFirst({
    where: { id: roomId, tenantId, deletedAt: null },
  });

  if (!room) {
    return { success: false, error: "Sala não encontrada." };
  }

  await db.room.update({
    where: { id: roomId },
    data: { isActive: false, deletedAt: new Date() },
  });

  return { success: true, data: undefined };
}

/** Desativa (soft delete) um equipamento */
export async function deactivateEquipment(
  tenantId: string,
  equipmentId: string
): Promise<ActionResult> {
  const equipment = await db.equipment.findFirst({
    where: { id: equipmentId, tenantId, deletedAt: null },
  });

  if (!equipment) {
    return { success: false, error: "Equipamento não encontrado." };
  }

  await db.equipment.update({
    where: { id: equipmentId },
    data: { isActive: false, deletedAt: new Date() },
  });

  return { success: true, data: undefined };
}
