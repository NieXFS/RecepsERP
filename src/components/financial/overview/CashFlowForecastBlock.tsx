"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronUp,
  LineChart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinancialKpiCard } from "@/components/financial/overview/FinancialKpiCard";
import { cn } from "@/lib/utils";
import type { CashFlowForecast } from "@/services/financial.service";

const MAX_BREAKDOWN_ITEMS = 20;

type Props = {
  forecast: CashFlowForecast;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })}k`;
  }
  return `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

function formatShortDate(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM", { locale: ptBR });
  } catch {
    return iso;
  }
}

function formatLongDate(iso: string) {
  try {
    return format(parseISO(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

function formatWeekdayDate(iso: string) {
  try {
    return format(parseISO(iso), "EEE, dd MMM", { locale: ptBR });
  } catch {
    return iso;
  }
}

function TooltipBody({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;
  const byKey = new Map(payload.map((item) => [item.dataKey, item]));
  const income = byKey.get("plannedIncome")?.value ?? 0;
  const expense = byKey.get("plannedExpense")?.value ?? 0;
  const balance = byKey.get("balanceAfter")?.value ?? 0;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium capitalize text-foreground">
        {formatLongDate(label)}
      </p>
      <p className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Entradas</span>
        <span className="font-medium text-emerald-600">
          {formatCurrency(income)}
        </span>
      </p>
      <p className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Saídas</span>
        <span className="font-medium text-red-600">
          {formatCurrency(expense)}
        </span>
      </p>
      <p className="mt-1 flex items-center justify-between gap-3 border-t pt-1">
        <span className="text-muted-foreground">Saldo após o dia</span>
        <span
          className={cn(
            "font-semibold",
            balance < 0 ? "text-red-600" : "text-foreground"
          )}
        >
          {formatCurrency(balance)}
        </span>
      </p>
    </div>
  );
}

export function CashFlowForecastBlock({ forecast }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [incomeLimit, setIncomeLimit] = useState(MAX_BREAKDOWN_ITEMS);
  const [expenseLimit, setExpenseLimit] = useState(MAX_BREAKDOWN_ITEMS);

  const hasMovement =
    forecast.totalIncomeAhead > 0 ||
    forecast.totalExpenseAhead > 0 ||
    forecast.currentBalance !== 0;

  const endBalanceAccent = useMemo(() => {
    if (forecast.projectedEndBalance < 0) return "text-red-600";
    if (forecast.projectedEndBalance > forecast.currentBalance)
      return "text-emerald-600";
    return "text-amber-600";
  }, [forecast.currentBalance, forecast.projectedEndBalance]);

  const endBalanceWrapper = useMemo(() => {
    if (forecast.projectedEndBalance < 0) return "bg-red-500/10";
    if (forecast.projectedEndBalance > forecast.currentBalance)
      return "bg-emerald-500/10";
    return "bg-amber-500/10";
  }, [forecast.currentBalance, forecast.projectedEndBalance]);

  if (!hasMovement) {
    return (
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-primary" aria-hidden="true" />
              Projeção de fluxo de caixa (30 dias)
            </CardTitle>
            <CardDescription>
              Previsão combinando saldo atual, agendamentos confirmados e
              despesas pendentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              <p>
                Sem lançamentos previstos para os próximos 30 dias. Registre
                despesas ou agendamentos futuros para ver a projeção.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const incomesToShow = forecast.breakdown.incomeSources.slice(0, incomeLimit);
  const expensesToShow = forecast.breakdown.expenseSources.slice(
    0,
    expenseLimit
  );

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <LineChart className="h-4 w-4 text-primary" aria-hidden="true" />
          Projeção de fluxo de caixa (30 dias)
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Horizonte de {formatShortDate(forecast.horizon.startDate)} a{" "}
          {formatShortDate(forecast.horizon.endDate)} com base em agendamentos
          confirmados, parcelas a receber e despesas pendentes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FinancialKpiCard
          delay={0}
          label="Saldo atual"
          value={formatCurrency(forecast.currentBalance)}
          note="Soma das contas ativas"
          icon={Wallet}
          accent="text-foreground"
          iconWrapperClass="bg-muted"
        />
        <FinancialKpiCard
          delay={50}
          label="Entradas previstas"
          value={formatCurrency(forecast.totalIncomeAhead)}
          note="Nos próximos 30 dias"
          icon={ArrowDownToLine}
          accent="text-emerald-600"
          iconWrapperClass="bg-emerald-500/10"
        />
        <FinancialKpiCard
          delay={100}
          label="Saídas previstas"
          value={formatCurrency(forecast.totalExpenseAhead)}
          note="Despesas pendentes + vencidas"
          icon={ArrowUpFromLine}
          accent="text-red-600"
          iconWrapperClass="bg-red-500/10"
        />
        <FinancialKpiCard
          delay={150}
          label="Saldo previsto em 30 dias"
          value={formatCurrency(forecast.projectedEndBalance)}
          note={
            forecast.projectedEndBalance < 0
              ? "Saldo ficará negativo"
              : forecast.projectedEndBalance > forecast.currentBalance
                ? "Cenário de crescimento"
                : "Cenário de retração"
          }
          icon={
            forecast.projectedEndBalance >= forecast.currentBalance
              ? TrendingUp
              : TrendingDown
          }
          accent={endBalanceAccent}
          iconWrapperClass={endBalanceWrapper}
        />
      </div>

      {forecast.negativeBalanceAlert ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Atenção: saldo previsto fica negativo em{" "}
                {formatLongDate(forecast.negativeBalanceAlert.date)} (
                {formatCurrency(forecast.negativeBalanceAlert.balance)}).
              </p>
              <p className="mt-1 text-xs text-red-700/80">
                Avalie antecipar recebimentos ou renegociar despesas.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 bg-background/40 text-red-700 hover:bg-background hover:text-red-700"
            render={<Link href="/financeiro/despesas" />}
          >
            Ver contas a pagar
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Curva projetada do saldo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecast.dailyProjection}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortDate}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompact}
                  width={60}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompact}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: "rgba(148, 163, 184, 0.15)" }}
                  content={<TooltipBody />}
                />
                <ReferenceLine
                  yAxisId="right"
                  y={0}
                  stroke="#a1a1aa"
                  strokeDasharray="4 4"
                />
                <Bar
                  yAxisId="left"
                  dataKey="plannedIncome"
                  name="Entradas previstas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Bar
                  yAxisId="left"
                  dataKey="plannedExpense"
                  name="Saídas previstas"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="balanceAfter"
                  name="Saldo projetado"
                  stroke="var(--color-primary, #8b5cf6)"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setShowBreakdown((current) => !current)}
          aria-expanded={showBreakdown}
          aria-controls="cash-flow-breakdown"
        >
          {showBreakdown ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
          {showBreakdown ? "Ocultar lançamentos previstos" : "Ver lançamentos previstos"}
        </Button>

        {showBreakdown ? (
          <div
            id="cash-flow-breakdown"
            className="grid gap-4 md:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ArrowDownToLine
                    className="h-4 w-4 text-emerald-600"
                    aria-hidden="true"
                  />
                  Entradas previstas
                </CardTitle>
                <CardDescription>
                  {forecast.breakdown.incomeSources.length} lançamento(s) nos
                  próximos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {incomesToShow.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Sem entradas previstas no horizonte.
                  </p>
                ) : (
                  incomesToShow.map((item) => {
                    const href =
                      item.kind === "appointment"
                        ? `/agenda?appointmentId=${item.id}`
                        : "/financeiro/extrato";
                    return (
                      <Link
                        key={`${item.kind}-${item.id}`}
                        href={href}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/15 p-3 text-sm transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {formatWeekdayDate(item.date)} ·{" "}
                            {item.kind === "appointment"
                              ? "Agendamento"
                              : "Parcela"}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-emerald-700 tabular-nums">
                          {formatCurrency(item.amount)}
                        </p>
                      </Link>
                    );
                  })
                )}
                {forecast.breakdown.incomeSources.length > incomeLimit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setIncomeLimit(
                        (current) => current + MAX_BREAKDOWN_ITEMS
                      )
                    }
                  >
                    Mostrar mais (
                    {forecast.breakdown.incomeSources.length - incomeLimit}{" "}
                    restante
                    {forecast.breakdown.incomeSources.length - incomeLimit === 1
                      ? ""
                      : "s"}
                    )
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ArrowUpFromLine
                    className="h-4 w-4 text-red-600"
                    aria-hidden="true"
                  />
                  Saídas previstas
                </CardTitle>
                <CardDescription>
                  {forecast.breakdown.expenseSources.length} despesa(s)
                  pendente(s) considerando vencidas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {expensesToShow.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Sem saídas previstas no horizonte.
                  </p>
                ) : (
                  expensesToShow.map((item) => (
                    <Link
                      key={item.id}
                      href="/financeiro/despesas"
                      className="flex items-center justify-between gap-3 rounded-lg border bg-muted/15 p-3 text-sm transition-colors hover:border-red-500/40 hover:bg-red-500/5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.label}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                          >
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">
                            {formatWeekdayDate(item.date)}
                          </span>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-red-700 tabular-nums">
                        {formatCurrency(item.amount)}
                      </p>
                    </Link>
                  ))
                )}
                {forecast.breakdown.expenseSources.length > expenseLimit ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() =>
                      setExpenseLimit(
                        (current) => current + MAX_BREAKDOWN_ITEMS
                      )
                    }
                  >
                    Mostrar mais (
                    {forecast.breakdown.expenseSources.length - expenseLimit}{" "}
                    restante
                    {forecast.breakdown.expenseSources.length - expenseLimit ===
                    1
                      ? ""
                      : "s"}
                    )
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </section>
  );
}
