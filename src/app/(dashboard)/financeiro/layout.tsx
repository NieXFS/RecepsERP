import { redirect } from "next/navigation";
import { getModuleDefinition } from "@/lib/tenant-modules";
import { getAuthUserWithAccess } from "@/lib/session";
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

  if (!user.moduleAccess.COMISSOES) {
    const fallbackModule = user.allowedModules[0];
    redirect(fallbackModule ? getModuleDefinition(fallbackModule).href : "/login");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie repasses, despesas, extrato operacional e rotina de caixa do estabelecimento.
        </p>
      </div>
      <FinancialNav />
      {children}
    </div>
  );
}
