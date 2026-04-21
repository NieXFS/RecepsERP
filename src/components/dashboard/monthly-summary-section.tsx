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
import {
  addMonthsToCivilMonth,
  formatCivilMonthLabel,
  getTodayCivilMonth,
  type CivilMonth,
} from "@/lib/civil-date";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { cn } from "@/lib/utils";
import type {
  DailyRevenuePoint,
  MonthlyDashboardStats,
} from "@/services/dashboard.service";

const MonthlyRevenueChart = dynamic(
  () =>
    import("@/components/dashboard/monthly-revenue-chart").then(
      (mod) => mod.MonthlyRevenueChart
    ),
  {
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-[18px] bg-muted" />
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

const SPARK_REVENUE = "M0,20 L10,18 L20,22 L30,14 L40,16 L50,10 L60,12 L72,6";
const SPARK_RESULT = "M0,22 L12,20 L24,16 L36,18 L48,10 L60,12 L72,6";

/**
 * Seção mensal do dashboard com banner hero, cards financeiros e gráfico evolutivo.
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
    <section className="flex flex-col gap-[18px]">
      {/* Month banner */}
      <div className="relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-[22px] bg-gradient-to-br from-primary/10 to-chart-2/5 px-[26px] py-[22px] md:flex-row md:items-center">
        <span
          aria-hidden="true"
          className="absolute inset-y-[18px] left-0 w-[3px] rounded-full bg-gradient-to-b from-primary to-chart-2"
        />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Resumo do mês
          </span>
          <span className="text-[22px] font-extrabold capitalize tracking-[-0.025em] text-foreground">
            {formatCivilMonthLabel(period)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href={buildMonthHref(previousMonth)}
            aria-label="Ver mês anterior"
            className="grid h-9 w-9 place-items-center rounded-[11px] bg-card text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-[15px] w-[15px]" aria-hidden="true" />
          </Link>
          <Link
            href={buildMonthHref(getTodayCivilMonth())}
            className="rounded-[11px] bg-foreground px-[18px] py-[9px] text-[13px] font-semibold text-background transition-all hover:opacity-90"
          >
            Mês atual
          </Link>
          {canGoForward ? (
            <Link
              href={buildMonthHref(nextMonth)}
              aria-label="Ver próximo mês"
              className="grid h-9 w-9 place-items-center rounded-[11px] bg-card text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight className="h-[15px] w-[15px]" aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Próximo mês indisponível"
              className="grid h-9 w-9 place-items-center rounded-[11px] bg-card text-muted-foreground opacity-50 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <ChevronRight className="h-[15px] w-[15px]" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* KPIs do mês */}
      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento do mês"
          value={formatCurrency(stats.faturamentoMes)}
          subtitle={`${stats.totalAtendimentos} atendimento(s) finalizado(s)`}
          icon={TrendingUp}
          sparkPath={SPARK_REVENUE}
          animationDelay={60}
        />
        <KpiCard
          label="Comissões do mês"
          value={formatCurrency(stats.totalComissoes)}
          subtitle="Total pago ou provisionado em comissões"
          icon={Wallet}
          animationDelay={120}
        />
        <KpiCard
          label="Despesas do mês"
          value={formatCurrency(stats.totalDespesas)}
          subtitle="Despesas operacionais pagas no extrato"
          icon={ReceiptText}
          animationDelay={180}
        />
        <KpiCard
          label="Resultado do mês"
          value={formatCurrency(stats.resultadoMes)}
          subtitle="Faturamento − comissões − despesas pagas"
          icon={stats.resultadoMes >= 0 ? TrendingUp : TrendingDown}
          accent="emerald"
          sparkPath={SPARK_RESULT}
          animationDelay={240}
        />
      </div>

      {/* Evolução chart */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[22px] bg-card px-7 pb-5 pt-[26px]",
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]"
        )}
      >
        <div className="mb-5 flex flex-col items-start justify-between gap-5 md:flex-row">
          <div>
            <h3 className="text-[19px] font-extrabold tracking-[-0.025em] text-foreground">
              Evolução do mês
            </h3>
            <p className="mt-1.5 max-w-[540px] text-[13px] leading-[1.5] text-muted-foreground">
              Acompanhe a curva diária de faturamento, comissões e despesas operacionais do período.
            </p>
            <p className="mt-2 text-[11.5px] text-muted-foreground">
              Ticket médio do mês:{" "}
              <b className="font-bold text-foreground tabular-nums">
                {formatCurrency(stats.ticketMedio)}
              </b>
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            <ChartLegend color="var(--primary)" label="Faturamento" />
            <ChartLegend color="var(--chart-2)" label="Receita líquida" />
            <ChartLegend color="#F97316" label="Despesas" />
          </div>
        </div>
        <MonthlyRevenueChart data={series} />
      </div>
    </section>
  );
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
