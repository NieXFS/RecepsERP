import Link from "next/link";
import { getAuthUserForModule } from "@/lib/session";
import { getCivilMonthRange, parseCivilMonthFromQuery } from "@/lib/civil-date";
import {
  getAppointmentsHeatmap,
  getDailyKPIs,
  getDailyRevenueForTenant,
  getMonthlyStatsForTenant,
} from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentsHeatmap } from "@/components/dashboard/appointments-heatmap";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MonthlySummarySection } from "@/components/dashboard/monthly-summary-section";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  UserPlus,
} from "lucide-react";

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
  const user = await getAuthUserForModule("DASHBOARD");
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

  const kpiCards = [
    {
      id: "kpi-revenue-title",
      title: "Faturamento Hoje",
      icon: DollarSign,
      value: `R$ ${kpis.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: null,
      href: "/financeiro",
    },
    {
      id: "kpi-ticket-title",
      title: "Ticket Médio",
      icon: TrendingUp,
      value: `R$ ${kpis.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: `${kpis.completedAppointments} atendimento(s) finalizado(s)`,
      href: "/financeiro",
    },
    {
      id: "kpi-appointments-title",
      title: "Agendamentos Hoje",
      icon: Calendar,
      value: String(kpis.totalAppointments),
      subtitle: `${kpis.completedAppointments} finalizado(s)`,
      href: "/agenda",
    },
    {
      id: "kpi-customers-title",
      title: "Novos Clientes",
      icon: UserPlus,
      value: String(kpis.newCustomers),
      subtitle: "cadastrados hoje",
      href: "/clientes",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do dia — {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>
      </div>

      {/* ---- KPI CARDS ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className="group block rounded-xl animate-fade-in-up outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <Card
                role="region"
                aria-labelledby={card.id}
                className="border border-transparent transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/20 group-hover:shadow-md group-hover:ring-primary/10"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle
                    id={card.id}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                  {card.subtitle && (
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      {card.subtitle}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <MonthlySummarySection
          period={selectedMonth}
          stats={monthlyStats}
          series={dailyRevenue}
        />
        <AppointmentsHeatmap heatmap={appointmentsHeatmap} />
      </div>
    </div>
  );
}
