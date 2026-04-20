import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ReceiptText,
} from "lucide-react";
import { getAuthUserForPermission } from "@/lib/session";
import { hasPermission } from "@/lib/tenant-permissions";
import { parseCivilMonthFromQuery } from "@/lib/civil-date";
import { db } from "@/lib/db";
import {
  getExpenseCategories,
  getExpensesAgenda,
  getMonthlyExpenses,
} from "@/services/expense.service";
import { getExpensesOverview } from "@/services/financial.service";
import { ExpensesViewport } from "@/components/financial/expenses-viewport";
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
 * Submódulo de despesas dentro do Financeiro.
 */
export default async function FinancialExpensesPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const user = await getAuthUserForPermission("financeiro.despesas", "view");
  const canEdit = hasPermission(user.customPermissions, "financeiro.despesas", "edit");
  const canExport = hasPermission(user.customPermissions, "financeiro.despesas", "view");
  const query = searchParams ? await searchParams : undefined;
  const selectedMonth = parseCivilMonthFromQuery(query?.month, query?.year);

  const [summary, categories, accounts, overview, agenda] = await Promise.all([
    getMonthlyExpenses(user.tenantId, selectedMonth),
    getExpenseCategories(user.tenantId),
    db.financialAccount.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      select: { id: true, name: true, type: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    getExpensesOverview(user.tenantId, selectedMonth),
    getExpensesAgenda(user.tenantId),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Despesas</h2>
          <p className="text-muted-foreground">
            Cadastre custos fixos e variáveis, acompanhe pendências do mês e integre as saídas ao extrato e ao caixa.
          </p>
        </div>
        {canExport ? (
          <ExportButton
            endpoint="despesas"
            filters={{
              month: String(selectedMonth.month),
              year: String(selectedMonth.year),
            }}
            suggestedFilename={`despesas_${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}`}
          />
        ) : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinancialKpiCard
          delay={0}
          label="Pagas no mês"
          value={formatCurrency(overview.paidInMonth)}
          note={
            overview.paidCount === 0
              ? "Nenhuma despesa paga no mês"
              : overview.paidCount === 1
                ? "1 despesa paga"
                : `${overview.paidCount} despesas pagas`
          }
          icon={CheckCircle2}
          accent="text-emerald-600"
          iconWrapperClass="bg-emerald-500/10"
          trend={
            <KpiTrendIndicator
              current={overview.paidInMonth}
              previous={overview.paidInMonthPrevious}
              invertColors
            />
          }
        />
        <FinancialKpiCard
          delay={50}
          label="A pagar no mês"
          value={formatCurrency(overview.pendingInMonth)}
          note={`Vencimento em ${overview.period.label}`}
          icon={Clock3}
          accent={overview.pendingInMonth > 0 ? "text-amber-600" : "text-muted-foreground"}
          iconWrapperClass={
            overview.pendingInMonth > 0 ? "bg-amber-500/10" : "bg-muted"
          }
        />
        <FinancialKpiCard
          delay={100}
          label="Vencidas"
          value={formatCurrency(overview.overdueTotal)}
          note={
            overview.overdueCount === 0
              ? "Nenhuma despesa vencida"
              : overview.overdueCount === 1
                ? "1 despesa em atraso"
                : `${overview.overdueCount} despesas em atraso`
          }
          icon={AlertTriangle}
          accent={overview.overdueCount > 0 ? "text-red-600" : "text-muted-foreground"}
          iconWrapperClass={
            overview.overdueCount > 0 ? "bg-red-500/10" : "bg-muted"
          }
        />
        <FinancialKpiCard
          delay={150}
          label="Ticket médio"
          value={formatCurrency(overview.averageTicket)}
          note={
            overview.paidCount === 0
              ? "Sem pagos no período"
              : "Média das despesas pagas no mês"
          }
          icon={ReceiptText}
          accent="text-primary"
          iconWrapperClass="bg-primary/10"
        />
      </section>

      <ExpensesViewport
        summary={summary}
        agenda={agenda}
        categories={categories}
        canEdit={canEdit}
        accounts={accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
        }))}
      />
    </div>
  );
}
