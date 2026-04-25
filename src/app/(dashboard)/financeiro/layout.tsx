import { ModuleUpsell } from "@/components/billing/module-upsell";
import { getModuleAccess } from "@/lib/module-access";
import { getAuthUserWithAccess } from "@/lib/session";
import { hasPermission } from "@/lib/tenant-permissions";
import { FinancialNav } from "@/components/financial/financial-nav";

/**
 * Layout do módulo Financeiro.
 * Mantém a navegação interna de visão geral, comissões, despesas, extrato e caixa.
 */
export default async function FinancialLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUserWithAccess();

  if (!hasPermission(user.customPermissions, "financeiro", "view")) {
    const access = await getModuleAccess(user, user.tenantId, "COMISSOES");
    return <ModuleUpsell product="erp" reason={access.granted ? "module-disabled" : access.reason} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie repasses, despesas, extrato operacional e rotina de caixa do estabelecimento.
        </p>
      </div>
      <FinancialNav permissions={user.customPermissions} />
      {children}
    </div>
  );
}
