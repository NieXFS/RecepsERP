import { getAuthUserForModule } from "@/lib/session";
import { db } from "@/lib/db";
import { getCommissionsSummaryByProfessional } from "@/services/financial.service";
import { CommissionPanel } from "@/components/financial/commission-panel";

/**
 * Submódulo de comissões dentro do Financeiro.
 */
export default async function FinancialCommissionsPage() {
  const user = await getAuthUserForModule("COMISSOES");

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
        <h2 className="text-xl font-semibold tracking-tight">Comissões</h2>
        <p className="text-muted-foreground">
          Faça o fechamento financeiro dos profissionais com base nas comissões geradas pelos atendimentos.
        </p>
      </div>
      <CommissionPanel professionals={professionals} accounts={serializedAccounts} />
    </div>
  );
}
