"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { addMonthsToCivilMonth, formatCivilMonthLabel, getTodayCivilMonth, type CivilMonth } from "@/lib/civil-date";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";
import { cn } from "@/lib/utils";
import type { DailyRevenuePoint, MonthlyDashboardStats } from "@/services/dashboard.service";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function buildMonthHref(period: CivilMonth) {
  return `/dashboard?month=${period.month}&year=${period.year}`;
}

/**
 * Seção mensal do dashboard com cards financeiros, seletor de mês e gráfico evolutivo.
 */
export function MonthlySummarySection({
  period,
  stats,
  series,
}: {
  period: CivilMonth;
  stats: MonthlyDashboardStats;
  series: DailyRevenuePoint[];
}) {
  const previousMonth = addMonthsToCivilMonth(period, -1);
  const nextMonth = addMonthsToCivilMonth(period, 1);
  const currentMonth = getTodayCivilMonth();
  const canGoForward =
    nextMonth.year < currentMonth.year ||
    (nextMonth.year === currentMonth.year && nextMonth.month <= currentMonth.month);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Resumo do Mês</p>
          <h3 className="text-xl font-semibold capitalize">{formatCivilMonthLabel(period)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={buildMonthHref(previousMonth)}
            aria-label="Ver mês anterior"
            className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={buildMonthHref(getTodayCivilMonth())}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Mês Atual
          </Link>
          {canGoForward ? (
            <Link
              href={buildMonthHref(nextMonth)}
              aria-label="Ver próximo mês"
              className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <Button variant="outline" size="icon-sm" disabled aria-label="Próximo mês indisponível">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.faturamentoMes)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.totalAtendimentos} atendimento(s) finalizado(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comissões do Mês
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalComissoes)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total pago ou provisionado em comissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas do Mês
            </CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalDespesas)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Despesas operacionais pagas no extrato
            </p>
          </CardContent>
        </Card>

        <Card className={stats.resultadoMes >= 0 ? "border-emerald-500/40" : "border-red-500/40"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultado do Mês
            </CardTitle>
            {stats.resultadoMes >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                stats.resultadoMes >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(stats.resultadoMes)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Faturamento − comissões − despesas pagas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução do Mês</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acompanhe a curva diária de faturamento, comissões e despesas operacionais do período.
          </p>
          <p className="text-xs text-muted-foreground">
            Ticket médio do mês: {formatCurrency(stats.ticketMedio)}
          </p>
        </CardHeader>
        <CardContent>
          <MonthlyRevenueChart data={series} />
        </CardContent>
      </Card>
    </section>
  );
}
