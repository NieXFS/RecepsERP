import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TenantAccentThemeSync } from "@/components/layout/tenant-accent-theme-sync";
import { getAuthUserWithAccess } from "@/lib/session";
import { db } from "@/lib/db";
import { DEFAULT_TENANT_ACCENT_THEME } from "@/lib/tenant-accent-theme";

/**
 * Layout principal do dashboard (Server Component).
 * Busca a sessão do usuário e o nome do tenant no servidor,
 * depois injeta esses dados na Sidebar e Header como props.
 * Se o usuário não estiver autenticado, redireciona para /login.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUserWithAccess();

  // Busca o nome do tenant para exibir na Sidebar
  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    select: { name: true, accentTheme: true },
  });

  return (
    <div
      className="flex h-screen overflow-hidden"
      data-accent-theme={tenant?.accentTheme ?? DEFAULT_TENANT_ACCENT_THEME}
    >
      <TenantAccentThemeSync
        accentTheme={tenant?.accentTheme ?? DEFAULT_TENANT_ACCENT_THEME}
      />
      <Sidebar
        userRole={user.role}
        userName={user.name}
        allowedModules={user.allowedModules}
        permissions={user.customPermissions}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          tenantName={tenant?.name}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
