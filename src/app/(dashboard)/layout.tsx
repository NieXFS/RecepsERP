import { headers } from "next/headers";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TrialStatusBanner } from "@/components/billing/trial-status-banner";
import { TenantAccentThemeSync } from "@/components/layout/tenant-accent-theme-sync";
import { getAuthUserWithAccess } from "@/lib/session";
import { enforceSubscriptionAccess } from "@/lib/subscription-guard";
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
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-receps-pathname") ?? "";
  const user = await getAuthUserWithAccess();
  await enforceSubscriptionAccess(user);

  if (pathname === "/assinatura/bloqueada") {
    return <div className="min-h-screen bg-muted/20">{children}</div>;
  }

  // Busca o nome do tenant para exibir na Sidebar
  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    select: { name: true, accentTheme: true },
  });

  const sidebarProps = {
    userRole: user.role,
    userName: user.name,
    allowedModules: user.allowedModules,
    permissions: user.customPermissions,
  } satisfies Omit<SidebarProps, "className" | "collapsed" | "onNavigate">;

  return (
    <div
      className="flex h-screen overflow-hidden"
      data-accent-theme={tenant?.accentTheme ?? DEFAULT_TENANT_ACCENT_THEME}
    >
      <TenantAccentThemeSync
        accentTheme={tenant?.accentTheme ?? DEFAULT_TENANT_ACCENT_THEME}
      />

      <div className="hidden md:block lg:hidden">
        <Sidebar {...sidebarProps} collapsed={true} />
      </div>
      <div className="hidden lg:block">
        <Sidebar {...sidebarProps} collapsed={false} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          tenantName={tenant?.name}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          sidebarProps={sidebarProps}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <TrialStatusBanner tenantId={user.tenantId} />
          {children}
        </main>
      </div>
    </div>
  );
}
