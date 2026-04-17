import { headers } from "next/headers";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TrialStatusBanner } from "@/components/billing/trial-status-banner";
import { TenantAccentThemeSync } from "@/components/layout/tenant-accent-theme-sync";
import { WhatsAppFab } from "@/components/support/whatsapp-fab";
import { ModuleUpsell } from "@/components/billing/module-upsell";
import { getAuthUserWithAccess } from "@/lib/session";
import { enforceSubscriptionAccess } from "@/lib/subscription-guard";
import { enforceSetupCompleted } from "@/lib/setup-guard";
import { db } from "@/lib/db";
import { DEFAULT_TENANT_ACCENT_THEME } from "@/lib/tenant-accent-theme";
import {
  getModulesForPlanSlug,
  hasPlanProduct,
  type PlanProductModule,
} from "@/lib/plan-modules";
import { normalizePlanSlug } from "@/lib/plans";

/**
 * Rotas de ERP — quando o tenant não tem o produto "erp" no plano,
 * mostra tela de upsell em vez do conteúdo.
 */
const ERP_ROUTE_PREFIXES = [
  "/agenda",
  "/clientes",
  "/profissionais",
  "/servicos",
  "/pacotes",
  "/produtos",
  "/financeiro",
  "/comissoes",
  "/prontuarios",
  "/estoque",
] as const;

/**
 * Rotas do bot — quando o tenant não tem o produto "bot" no plano,
 * mostra tela de upsell.
 */
const BOT_ROUTE_PREFIXES = ["/atendente-ia"] as const;

/**
 * Verifica se o pathname atual pertence a um módulo não contratado
 * e retorna o produto que falta (para exibir tela de upsell) ou null.
 */
function getBlockedProduct(
  pathname: string,
  planSlug: string | null
): PlanProductModule | null {
  // Sem plano definido (billing bypass) = tudo liberado
  if (!planSlug) return null;

  const isErpRoute = ERP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (isErpRoute) {
    return hasPlanProduct(planSlug, "erp") ? null : "erp";
  }

  const isBotRoute = BOT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (isBotRoute) {
    return hasPlanProduct(planSlug, "bot") ? null : "bot";
  }

  return null;
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
  const user = await getAuthUserWithAccess();
  await enforceSubscriptionAccess(user);
  // Gate do setup inicial: tenant sem setup concluído/pulado é redirecionado
  // pro wizard /bem-vindo antes de entrar em qualquer tela do dashboard.
  await enforceSetupCompleted(user.tenantId, pathname);

  if (pathname === "/assinatura/bloqueada") {
    return <div className="min-h-screen bg-muted/20">{children}</div>;
  }

  // Busca o nome do tenant e o plano ativo para controlar visibilidade do sidebar
  const tenant = await db.tenant.findUnique({
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
  });

  // Módulos liberados pelo plano do tenant (null = billing bypass → tudo liberado)
  const planSlug = tenant?.billingBypassEnabled
    ? null
    : normalizePlanSlug(tenant?.subscription?.plan?.slug) ??
      tenant?.subscription?.plan?.slug ??
      null;
  const planModules = new Set(getModulesForPlanSlug(planSlug));
  const filteredModules = user.allowedModules.filter((m) => planModules.has(m));

  // Verifica se a rota atual pertence a um módulo não contratado
  const blockedProduct = getBlockedProduct(pathname, planSlug);

  const sidebarProps = {
    userRole: user.role,
    userName: user.name,
    allowedModules: filteredModules,
    permissions: user.customPermissions,
  } satisfies Omit<SidebarProps, "className" | "collapsed" | "onNavigate">;

  // Conteúdo principal: upsell se módulo bloqueado, children se liberado
  const mainContent = blockedProduct ? (
    <ModuleUpsell product={blockedProduct} />
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
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          sidebarProps={sidebarProps}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {mainContent}
        </main>
        <WhatsAppFab
          prefilledMessage={`Oi! Sou usuário do Receps (tenant: ${tenant?.slug ?? "sem-slug"}) e preciso de ajuda.`}
        />
      </div>
    </div>
  );
}
