import { getAuthUserForModule } from "@/lib/session";
import { listTeamMembers } from "@/services/team.service";
import { TeamPanel } from "@/components/settings/team-panel";

/**
 * Página principal de profissionais/equipe do ERP.
 * Expõe a gestão da equipe em uma rota curta e consistente com o restante do dashboard.
 */
export default async function ProfessionalsPage() {
  const user = await getAuthUserForModule("PROFISSIONAIS");

  const members = await listTeamMembers(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profissionais</h1>
        <p className="text-muted-foreground">
          Gerencie administradores, recepção e profissionais vinculados ao tenant.
        </p>
      </div>
      <TeamPanel members={members} currentUserId={user.id} />
    </div>
  );
}
