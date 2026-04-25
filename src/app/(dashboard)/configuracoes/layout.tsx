import { headers } from "next/headers";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { getModuleAccess } from "@/lib/module-access";
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
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-receps-pathname") ?? "";
  const user = await getAuthUserWithAccess();
  const isPersonalAccountPage =
    pathname === "/configuracoes/conta" || pathname.startsWith("/configuracoes/conta/");

  if (!user.moduleAccess.CONFIGURACOES && !isPersonalAccountPage) {
    const access = await getModuleAccess(user, user.tenantId, "CONFIGURACOES");
    return <ModuleUpsell product="erp" reason={access.granted ? "module-disabled" : access.reason} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua conta, negócio, aparência, recursos e contas financeiras.
        </p>
      </div>
      <SettingsNav allowedModules={user.allowedModules} role={user.role} />
      {children}
    </div>
  );
}
