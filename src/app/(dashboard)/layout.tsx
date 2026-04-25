import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TrialStatusBanner } from "@/components/billing/trial-status-banner";
import { TenantAccentThemeSync } from "@/components/layout/tenant-accent-theme-sync";
import { WhatsAppFab } from "@/components/support/whatsapp-fab";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { getAuthUser, getAuthUserWithAccess } from "@/lib/session";
import { authOptions } from "@/lib/auth";
import { enforceSubscriptionAccess } from "@/lib/subscription-guard";
import { enforceSetupCompleted } from "@/lib/setup-guard";
import { db } from "@/lib/db";
import { DEFAULT_TENANT_ACCENT_THEME } from "@/lib/tenant-accent-theme";
import {
  type PlanProductModule,
} from "@/lib/plan-modules";
import {
  getPlanModulesForTenant,
  resolveModuleAccessForPlan,
  type ModuleAccessReason,
} from "@/lib/module-access";
import { TENANT_MODULE_VALUES } from "@/lib/tenant-modules";
import type { TenantModule } from "@/generated/prisma/enums";

const MODULE_ROUTE_PREFIXES: ReadonlyArray<{
  module: TenantModule;
  prefixes: readonly string[];
}> = [
  { module: "DASHBOARD", prefixes: ["/dashboard"] },
  { module: "AGENDA", prefixes: ["/agenda", "/appointments"] },
  { module: "CLIENTES", prefixes: ["/clientes"] },
  { module: "PROFISSIONAIS", prefixes: ["/profissionais", "/professionals"] },
  { module: "SERVICOS", prefixes: ["/servicos", "/services"] },
  { module: "PACOTES", prefixes: ["/pacotes", "/packages"] },
  { module: "ESTOQUE", prefixes: ["/produtos/estoque", "/estoque"] },
  { module: "PRODUTOS", prefixes: ["/produtos", "/products"] },
  { module: "COMISSOES", prefixes: ["/financeiro", "/comissoes"] },
  { module: "PRONTUARIOS", prefixes: ["/prontuarios", "/records"] },
  { module: "ATENDENTE_IA", prefixes: ["/atendente-ia"] },
  { module: "CONFIGURACOES", prefixes: ["/configuracoes"] },
];

function getRouteModule(pathname: string): TenantModule | null {
  if (pathname === "/configuracoes/conta" || pathname.startsWith("/configuracoes/conta/")) {
    return null;
  }

  const match = MODULE_ROUTE_PREFIXES.find(({ prefixes }) =>
    prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
  );

  return match?.module ?? null;
}

function getPlanProductForModule(module: TenantModule): PlanProductModule {
  return module === "ATENDENTE_IA" ? "bot" : "erp";
}

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
  const masterUser = await getAuthUser();
  const user = await getAuthUserWithAccess();
  await enforceSubscriptionAccess(user);
  // Gate do setup inicial: tenant sem setup concluído/pulado é redirecionado
  // pro wizard /bem-vindo antes de entrar em qualquer tela do dashboard.
  await enforceSetupCompleted(user.tenantId, pathname);

  if (pathname === "/assinatura/bloqueada") {
    return <div className="min-h-screen bg-muted/20">{children}</div>;
  }

  const session = await getServerSession(authOptions);
  const activeSessionUser = session?.activeUser ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
  const headerUserIds = Array.from(new Set([masterUser.id, activeSessionUser.id]));

  // Busca o tenant, o plano ativo e dados visuais dos usuários do header.
  const [tenant, headerUserProfiles] = await Promise.all([
    db.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        slug: true,
        accentTheme: true,
        billingBypassEnabled: true,
        subscription: {
          select: {
            plan: {
              select: { slug: true },
            },
          },
        },
      },
    }),
    db.user.findMany({
      where: {
        id: { in: headerUserIds },
        tenantId: user.tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        avatarUrl: true,
        pin: true,
      },
    }),
  ]);
  const headerProfileById = new Map(headerUserProfiles.map((profile) => [profile.id, profile]));
  const activeUserProfile = headerProfileById.get(activeSessionUser.id);
  const masterUserProfile = headerProfileById.get(masterUser.id);

  const planModules = getPlanModulesForTenant({
    billingBypassEnabled: tenant?.billingBypassEnabled,
    planSlug: tenant?.subscription?.plan?.slug ?? null,
  });
  const moduleAccess = Object.fromEntries(
    TENANT_MODULE_VALUES.map((module) => [
      module,
      resolveModuleAccessForPlan(user, planModules, module),
    ])
  ) as Record<TenantModule, ModuleAccessReason>;
  const filteredModules = TENANT_MODULE_VALUES.filter(
    (module) => moduleAccess[module].granted
  );
  const routeModule = getRouteModule(pathname);
  const routeAccess = routeModule ? moduleAccess[routeModule] : ({ granted: true } as const);

  const sidebarProps = {
    userRole: user.role,
    userName: user.name,
    allowedModules: filteredModules,
    permissions: user.customPermissions,
    moduleAccess,
  } satisfies Omit<SidebarProps, "className" | "collapsed" | "onNavigate">;

  const mainContent = !routeAccess.granted && routeModule ? (
    <ModuleUpsell
      product={getPlanProductForModule(routeModule)}
      reason={routeAccess.reason}
    />
  ) : (
    <>
      <TrialStatusBanner tenantId={user.tenantId} />
      {children}
    </>
  );

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
          activeUser={{
            id: activeSessionUser.id,
            name: activeSessionUser.name,
            email: activeSessionUser.email,
            role: activeSessionUser.role,
            avatarUrl: activeUserProfile?.avatarUrl ?? activeSessionUser.avatarUrl,
            hasPin: Boolean(activeUserProfile?.pin),
          }}
          masterUser={{
            id: masterUser.id,
            name: masterUser.name,
            email: masterUser.email,
            role: masterUser.role,
            avatarUrl: masterUserProfile?.avatarUrl ?? masterUser.avatarUrl,
          }}
          sidebarProps={sidebarProps}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 px-4 pb-14 pt-6 sm:px-10">
          {mainContent}
        </main>
        <WhatsAppFab
          prefilledMessage={`Oi! Sou usuário do Receps (tenant: ${tenant?.slug ?? "sem-slug"}) e preciso de ajuda.`}
        />
      </div>
    </div>
  );
}
