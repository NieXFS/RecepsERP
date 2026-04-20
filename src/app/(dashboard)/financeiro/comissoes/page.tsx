import {
  BanknoteArrowDown,
  CheckCircle2,
  Clock3,
  Users,
} from "lucide-react";
import { getAuthUserForPermission } from "@/lib/session";
import { hasPermission } from "@/lib/tenant-permissions";
import { db } from "@/lib/db";
import {
  getCommissionsOverview,
  getCommissionsSummaryByProfessional,
} from "@/services/financial.service";
import { CommissionPanel } from "@/components/financial/commission-panel";
import { ExportButton } from "@/components/financial/export-button";
import { FinancialKpiCard } from "@/components/financial/overview/FinancialKpiCard";
import { KpiTrendIndicator } from "@/components/financial/overview/KpiTrendIndicator";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Submódulo de comissões dentro do Financeiro.
 */
export default async function FinancialCommissionsPage() {
  const user = await getAuthUserForPermission("financeiro.comissoes", "view");
  const canEdit = hasPermission(user.customPermissions, "financeiro.comissoes", "edit");
  const canExport = hasPermission(user.customPermissions, "financeiro.comissoes", "view");

  const [professionals, accounts, overview] = await Promise.all([
    getCommissionsSummaryByProfessional(user.tenantId, {
      userId: user.id,
      role: user.role,
    }),
    db.financialAccount.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
    getCommissionsOverview(user.tenantId),
  ]);

  const serializedAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Comissões</h2>
          <p className="text-muted-foreground">
            Faça o fechamento financeiro dos profissionais com base nas comissões geradas pelos atendimentos.
          </p>
        </div>
        {canExport ? (
          <ExportButton
            endpoint="comissoes"
            filters={{}}
            suggestedFilename="comissoes"
          />
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinancialKpiCard
          delay={0}
          label="Geradas no período"
          value={formatCurrency(overview.generatedInPeriod)}
          note={`Recorte: ${overview.period.label}`}
          icon={BanknoteArrowDown}
          accent="text-primary"
          iconWrapperClass="bg-primary/10"
          trend={
            <KpiTrendIndicator
              current={overview.generatedInPeriod}
              previous={overview.generatedInPeriodPrevious}
            />
          }
        />
        <FinancialKpiCard
          delay={50}
          label="Pagas no período"
          value={formatCurrency(overview.paidInPeriod)}
          note="Acertos confirmados no recorte"
          icon={CheckCircle2}
          accent="text-emerald-600"
          iconWrapperClass="bg-emerald-500/10"
        />
        <FinancialKpiCard
          delay={100}
          label="Pendentes"
          value={formatCurrency(overview.pendingTotal)}
          note="Estoque total aguardando acerto"
          icon={Clock3}
          accent={overview.pendingTotal > 0 ? "text-amber-600" : "text-muted-foreground"}
          iconWrapperClass={
            overview.pendingTotal > 0 ? "bg-amber-500/10" : "bg-muted"
          }
        />
        <FinancialKpiCard
          delay={150}
          label="Profissionais aguardando"
          value={String(overview.pendingProfessionalsCount)}
          note={
            overview.pendingProfessionalsCount === 0
              ? "Nenhum profissional com pendência"
              : overview.pendingProfessionalsCount === 1
                ? "1 profissional com pendência"
                : `${overview.pendingProfessionalsCount} profissionais com pendência`
          }
          icon={Users}
          accent={overview.pendingProfessionalsCount > 0 ? "text-primary" : "text-muted-foreground"}
          iconWrapperClass={
            overview.pendingProfessionalsCount > 0 ? "bg-primary/10" : "bg-muted"
          }
        />
      </section>

      <CommissionPanel
        professionals={professionals}
        accounts={serializedAccounts}
        canEdit={canEdit}
      />
    </div>
  );
}
