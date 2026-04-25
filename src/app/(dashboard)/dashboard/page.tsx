import { redirect } from "next/navigation";
import { Calendar, DollarSign, TrendingUp, UserPlus } from "lucide-react";
import { getAuthUserWithAccess } from "@/lib/session";
import { getCivilMonthRange, parseCivilMonthFromQuery } from "@/lib/civil-date";
import { canAccessDashboard } from "@/lib/tenant-permissions";
import {
  getAppointmentsHeatmap,
  getDailyKPIs,
  getDailyRevenueForTenant,
  getMonthlyStatsForTenant,
} from "@/services/dashboard.service";
import { AppointmentsHeatmap } from "@/components/dashboard/appointments-heatmap";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MonthlySummarySection } from "@/components/dashboard/monthly-summary-section";

const SPARK_PATHS = {
  revenue: "M0,22 L12,18 L24,20 L36,12 L48,14 L60,8 L72,10",
  ticket: "M0,14 L12,18 L24,10 L36,14 L48,8 L60,12 L72,6",
} as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Página principal do Dashboard (Server Component).
 * Exibe KPIs do dia e um resumo financeiro mensal com gráfico evolutivo.
 *
 * TODO: dashboard adaptativo por plano
 * - Plano somente-atendente-ia → métricas da Ana (mensagens respondidas, agendamentos via bot, tempo médio de resposta, status online/offline)
 * - Plano somente-erp → dashboard atual (métricas de ERP)
 * - Plano erp-atendente-ia → dashboard completo com métricas dos dois
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const user = await getAuthUserWithAccess();
  if (!canAccessDashboard(user)) {
    redirect("/agenda");
  }

  const query = searchParams ? await searchParams : undefined;
  const selectedMonth = parseCivilMonthFromQuery(query?.month, query?.year);
  const { start, endExclusive } = getCivilMonthRange(selectedMonth);

  const [kpis, monthlyStats, dailyRevenue, appointmentsHeatmap] = await Promise.all([
    getDailyKPIs(user.tenantId),
    getMonthlyStatsForTenant(user.tenantId, selectedMonth),
    getDailyRevenueForTenant(user.tenantId, selectedMonth),
    getAppointmentsHeatmap(user.tenantId, start, endExclusive),
  ]);

  const isEmptyDashboard =
    kpis.revenue === 0 &&
    kpis.totalAppointments === 0 &&
    kpis.newCustomers === 0 &&
    kpis.completedAppointments === 0;

  if (isEmptyDashboard) {
    return <DashboardEmptyState />;
  }

  const today = new Date();
  const todayLabel = today.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  const weekdayFullLabel = today.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-7">
      {/* Page title */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.035em] text-foreground">
            Dashboard
          </h1>
          <p className="mt-2.5 text-[14.5px] text-muted-foreground">
            Visão geral do dia — {weekdayFullLabel}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full bg-card px-[14px] py-2 text-[12.5px] font-medium text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:self-auto">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{todayLabel}</span>
        </div>
      </header>

      {/* KPIs do dia */}
      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento hoje"
          value={formatCurrency(kpis.revenue)}
          subtitle={`${kpis.completedAppointments} atendimento(s) finalizado(s)`}
          icon={DollarSign}
          href="/financeiro"
          sparkPath={SPARK_PATHS.revenue}
          animationDelay={60}
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(kpis.averageTicket)}
          subtitle={`${kpis.completedAppointments} atendimento(s) finalizado(s)`}
          icon={TrendingUp}
          href="/financeiro"
          sparkPath={SPARK_PATHS.ticket}
          animationDelay={120}
        />
        <KpiCard
          label="Agendamentos hoje"
          value={String(kpis.totalAppointments)}
          subtitle={`${kpis.completedAppointments} finalizado(s)`}
          icon={Calendar}
          href="/agenda"
          animationDelay={180}
        />
        <KpiCard
          label="Novos clientes"
          value={String(kpis.newCustomers)}
          subtitle="cadastrados hoje"
          icon={UserPlus}
          href="/clientes"
          animationDelay={240}
        />
      </div>

      <MonthlySummarySection
        period={selectedMonth}
        stats={monthlyStats}
        series={dailyRevenue}
      />

      <AppointmentsHeatmap heatmap={appointmentsHeatmap} />
    </div>
  );
}
