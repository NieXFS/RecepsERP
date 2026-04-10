import { redirect } from "next/navigation";
import { getAuthUserWithAccess } from "@/lib/session";
import {
  getDefaultAccessibleHref,
  hasPermission,
} from "@/lib/tenant-permissions";
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
    redirect(getDefaultAccessibleHref(user.customPermissions, user.allowedModules));
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
