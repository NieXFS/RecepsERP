import { getAuthUser } from "@/lib/session";
import { listTeamMembers } from "@/services/team.service";
import { TeamPanel } from "@/components/settings/team-panel";

/**
 * Página de Gestão de Equipe (Server Component).
 * Lista todos os usuários do tenant com dados de Professional quando aplicável.
 */
export default async function TeamPage() {
  const user = await getAuthUser();
  const members = await listTeamMembers(user.tenantId);

  return <TeamPanel members={members} currentUserId={user.id} />;
}
