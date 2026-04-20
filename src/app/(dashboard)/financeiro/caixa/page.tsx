import {
  ArrowDown,
  ArrowUp,
  Minus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { getAuthUserForPermission } from "@/lib/session";
import { hasPermission } from "@/lib/tenant-permissions";
import {
  getCashOverviewSummary,
  getCashRegisterOverview,
  getOpenSessionTransactions,
} from "@/services/financial.service";
import { CashRegisterPanel } from "@/components/financial/cash-register-panel";
import { CashStatusKpi } from "@/components/financial/overview/CashStatusKpi";
import { FinancialKpiCard } from "@/components/financial/overview/FinancialKpiCard";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Submódulo operacional de caixa com abertura, fechamento e histórico.
 */
export default async function CashRegisterPage() {
  const user = await getAuthUserForPermission("financeiro.caixa", "view");
  const canEdit = hasPermission(user.customPermissions, "financeiro.caixa", "edit");
  const [overview, summary] = await Promise.all([
    getCashRegisterOverview(user.tenantId),
    getCashOverviewSummary(user.tenantId),
  ]);
  const sessionMovements = overview.currentSession
    ? await getOpenSessionTransactions(
        user.tenantId,
        overview.currentSession.accountId,
        new Date(overview.currentSession.openedAt)
      )
    : [];

  const lastDiff = summary.lastClosingDifference;
  const lastDiffAbs = lastDiff != null ? Math.abs(lastDiff) : null;
  const lastDiffIcon =
    lastDiff == null
      ? Minus
      : lastDiff === 0
        ? Minus
        : lastDiff > 0
          ? ArrowUp
          : ArrowDown;
  const lastDiffAccent =
    lastDiff == null
      ? "text-muted-foreground"
      : lastDiff >= 0
        ? "text-emerald-600"
        : "text-red-600";
  const lastDiffWrapper =
    lastDiff == null
      ? "bg-muted"
      : lastDiff >= 0
        ? "bg-emerald-500/10"
        : "bg-red-500/10";

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h2 className="text-xl font-semibold tracking-tight">Caixa</h2>
        <p className="text-muted-foreground">
          Controle abertura, fechamento e conferência do caixa operacional do estabelecimento.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CashStatusKpi
          delay={0}
          status={summary.status}
          openedAt={summary.openedAt}
          lastClosedAt={summary.lastClosedAt}
        />
        <FinancialKpiCard
          delay={50}
          label="Saldo esperado"
          value={formatCurrency(summary.expectedBalance)}
          note={
            summary.status === "OPEN"
              ? "Valor esperado na sessão atual"
              : "Último saldo da sessão fechada"
          }
          icon={Wallet}
          accent="text-primary"
          iconWrapperClass="bg-primary/10"
        />
        <FinancialKpiCard
          delay={100}
          label="Movimentações hoje"
          value={formatCurrency(summary.todayNet)}
          note={
            summary.todayEntriesCount === 0
              ? "Nenhum lançamento registrado hoje"
              : `${summary.todayEntriesCount} lançamento(s) · entradas ${formatCurrency(summary.todayIncomes)}, saídas ${formatCurrency(summary.todayExpenses)}`
          }
          icon={ReceiptText}
          accent={
            summary.todayNet > 0
              ? "text-emerald-600"
              : summary.todayNet < 0
                ? "text-red-600"
                : "text-muted-foreground"
          }
          iconWrapperClass={
            summary.todayNet > 0
              ? "bg-emerald-500/10"
              : summary.todayNet < 0
                ? "bg-red-500/10"
                : "bg-muted"
          }
        />
        <FinancialKpiCard
          delay={150}
          label="Diferença último fechamento"
          value={lastDiffAbs != null ? formatCurrency(lastDiffAbs) : "—"}
          note={
            lastDiff == null
              ? "Nenhum fechamento com conferência registrado"
              : lastDiff === 0
                ? "Fechamento bateu sem diferença"
                : lastDiff > 0
                  ? "Sobra no último acerto"
                  : "Quebra no último acerto"
          }
          icon={lastDiffIcon}
          accent={lastDiffAccent}
          iconWrapperClass={lastDiffWrapper}
        />
      </section>

      <CashRegisterPanel
        accounts={overview.accounts}
        canEdit={canEdit}
        currentSession={overview.currentSession}
        sessionMovements={sessionMovements}
        recentSessions={overview.recentSessions}
      />
    </div>
  );
}
