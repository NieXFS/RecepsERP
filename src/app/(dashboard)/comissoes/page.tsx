import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getCommissionsSummaryByProfessional } from "@/services/financial.service";
import { CommissionPanel } from "@/components/financial/commission-panel";

/**
 * Página principal de comissões em rota curta e consistente com o dashboard.
 */
export default async function CommissionsPage() {
  const user = await getAuthUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [professionals, accounts] = await Promise.all([
    getCommissionsSummaryByProfessional(user.tenantId),
    db.financialAccount.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comissões</h1>
        <p className="text-muted-foreground">
          Faça o fechamento financeiro dos profissionais com base nas comissões geradas pelos atendimentos.
        </p>
      </div>
      <CommissionPanel
        professionals={professionals}
        accounts={serializedAccounts}
      />
    </div>
  );
}
