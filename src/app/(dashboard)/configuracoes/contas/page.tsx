import { redirect } from "next/navigation";
import { FinancialAccountsPanel } from "@/components/settings/financial-accounts-panel";
import { getAuthUserForModule } from "@/lib/session";
import { listFinancialAccounts } from "@/services/financial-account.service";

export default async function FinancialAccountsPage() {
  const user = await getAuthUserForModule("CONFIGURACOES");

  if (user.role !== "ADMIN") {
    redirect("/configuracoes/aparencia");
  }

  const accounts = await listFinancialAccounts(user.tenantId);

  return (
    <FinancialAccountsPanel accounts={accounts} />
  );
}
