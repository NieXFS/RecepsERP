import { getAuthUserForModule } from "@/lib/session";
import { listRooms, listEquipments } from "@/services/resources.service";
import { ResourcesPanel } from "@/components/settings/resources-panel";

/**
 * Página de Salas & Equipamentos (Server Component).
 * CRUD rápido para cadastrar recursos utilizados na agenda.
 */
export default async function ResourcesPage() {
  const user = await getAuthUserForModule("CONFIGURACOES");

  const [rooms, equipments] = await Promise.all([
    listRooms(user.tenantId),
    listEquipments(user.tenantId),
  ]);

  return <ResourcesPanel rooms={rooms} equipments={equipments} />;
}
