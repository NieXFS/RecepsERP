import { redirect } from "next/navigation";
import { getModuleDefinition } from "@/lib/tenant-modules";
import { getAuthUserWithAccess } from "@/lib/session";
import { SettingsNav } from "@/components/settings/settings-nav";

/**
 * Layout aninhado das Configurações.
 * Renderiza a sub-navegação e respeita as permissões efetivas de módulo.
 */
export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUserWithAccess();

  if (!user.moduleAccess.CONFIGURACOES) {
    const fallbackModule = user.allowedModules[0];
    redirect(fallbackModule ? getModuleDefinition(fallbackModule).href : "/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie aparência, equipe, serviços, recursos e contas financeiras do estabelecimento.
        </p>
      </div>
      <SettingsNav allowedModules={user.allowedModules} role={user.role} />
      {children}
    </div>
  );
}
