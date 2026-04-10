"use client";

import dynamic from "next/dynamic";
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
import { cn } from "@/lib/utils";
import type { DailyRevenuePoint, MonthlyDashboardStats } from "@/services/dashboard.service";

const MonthlyRevenueChart = dynamic(
  () =>
    import("@/components/dashboard/monthly-revenue-chart").then(
      (mod) => mod.MonthlyRevenueChart
    ),
  {
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-lg bg-muted" />
    ),
    ssr: false,
  }
);

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
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "min-h-[44px] min-w-[44px]"
            )}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={buildMonthHref(getTodayCivilMonth())}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "min-h-[44px]"
            )}
          >
            Mês Atual
          </Link>
          {canGoForward ? (
            <Link
              href={buildMonthHref(nextMonth)}
              aria-label="Ver próximo mês"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "min-h-[44px] min-w-[44px]"
              )}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <Button
              variant="outline"
              size="icon"
              disabled
              aria-label="Próximo mês indisponível"
              className="min-h-[44px] min-w-[44px]"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card role="region" aria-labelledby="monthly-revenue-title">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              id="monthly-revenue-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Faturamento do Mês
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.faturamentoMes)}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {stats.totalAtendimentos} atendimento(s) finalizado(s)
            </p>
          </CardContent>
        </Card>

        <Card role="region" aria-labelledby="monthly-commissions-title">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              id="monthly-commissions-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Comissões do Mês
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalComissoes)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total pago ou provisionado em comissões
            </p>
          </CardContent>
        </Card>

        <Card role="region" aria-labelledby="monthly-expenses-title">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              id="monthly-expenses-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Despesas do Mês
            </CardTitle>
            <ReceiptText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalDespesas)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Despesas operacionais pagas no extrato
            </p>
          </CardContent>
        </Card>

        <Card
          role="region"
          aria-labelledby="monthly-result-title"
          className={stats.resultadoMes >= 0 ? "border-emerald-500/40" : "border-red-500/40"}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              id="monthly-result-title"
              className="text-sm font-medium text-muted-foreground"
            >
              Resultado do Mês
            </CardTitle>
            {stats.resultadoMes >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold tabular-nums ${
                stats.resultadoMes >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(stats.resultadoMes)}
            </p>
            <span className="sr-only">
              {stats.resultadoMes >= 0 ? "Resultado positivo" : "Resultado negativo"}
            </span>
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
          <p className="text-xs text-muted-foreground tabular-nums">
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
