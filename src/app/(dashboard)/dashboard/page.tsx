import { getAuthUserForModule } from "@/lib/session";
import { parseCivilMonthFromQuery } from "@/lib/civil-date";
import {
  getDailyKPIs,
  getDailyRevenueForTenant,
  getMonthlyStatsForTenant,
} from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string | string[]; year?: string | string[] }>;
}) {
  const user = await getAuthUserForModule("DASHBOARD");
  const query = searchParams ? await searchParams : undefined;
  const selectedMonth = parseCivilMonthFromQuery(query?.month, query?.year);

  const [kpis, monthlyStats, dailyRevenue] = await Promise.all([
    getDailyKPIs(user.tenantId),
    getMonthlyStatsForTenant(user.tenantId, selectedMonth),
    getDailyRevenueForTenant(user.tenantId, selectedMonth),
  ]);

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

        {/* Card 1: Faturamento do Dia */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Hoje
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {kpis.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Ticket Médio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <>
              <p className="text-2xl font-bold">
                R$ {kpis.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.completedAppointments} atendimento(s) finalizado(s)
              </p>
            </>
          </CardContent>
        </Card>

        {/* Card 3: Agendamentos Hoje */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agendamentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.totalAppointments}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.completedAppointments} finalizado(s)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Novos Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Clientes
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.newCustomers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              cadastrados hoje
            </p>
          </CardContent>
        </Card>
      </div>

      <MonthlySummarySection
        period={selectedMonth}
        stats={monthlyStats}
        series={dailyRevenue}
      />
    </div>
  );
}
