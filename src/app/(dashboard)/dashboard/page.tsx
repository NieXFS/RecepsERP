import { getAuthUser } from "@/lib/session";
import { getDailyKPIs, getWaitingRoomAppointments } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WaitingRoom } from "@/components/dashboard/waiting-room";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  UserPlus,
  Lock,
} from "lucide-react";

/**
 * Página principal do Dashboard (Server Component).
 * Exibe KPIs do dia e a tabela "Sala de Espera" com ações rápidas.
 *
 * RBAC: Recepcionistas NÃO veem os cards financeiros (Faturamento, Ticket Médio).
 *       Apenas a tabela de Sala de Espera é visível para elas.
 */
export default async function DashboardPage() {
  const user = await getAuthUser();

  const [kpis, waitingAppointments] = await Promise.all([
    getDailyKPIs(user.tenantId),
    getWaitingRoomAppointments(user.tenantId),
  ]);

  const isAdmin = user.role === "ADMIN";
  const canSeeFinancials = isAdmin; // Apenas ADMIN vê dados financeiros

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
            {canSeeFinancials ? (
              <p className="text-2xl font-bold">
                R$ {kpis.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Acesso Restrito</span>
              </div>
            )}
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
            {canSeeFinancials ? (
              <>
                <p className="text-2xl font-bold">
                  R$ {kpis.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.completedAppointments} atendimento(s) finalizado(s)
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-sm">Acesso Restrito</span>
              </div>
            )}
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

      {/* ---- SALA DE ESPERA ---- */}
      <WaitingRoom appointments={waitingAppointments} />
    </div>
  );
}
