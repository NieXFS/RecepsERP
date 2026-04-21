"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyRevenuePoint } from "@/services/dashboard.service";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; name?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-[10px] border border-primary/25 bg-popover/95 px-3 py-2 text-[12px] text-popover-foreground shadow-[0_12px_32px_rgba(0,0,0,0.4)]">
      <div className="font-bold">Dia {label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mt-0.5 tabular-nums" style={{ color: entry.color }}>
          ● {entry.name}: {currencyFormatter.format(Number(entry.value ?? 0))}
        </div>
      ))}
    </div>
  );
}

/**
 * Gráfico da evolução mensal com faturamento (área violeta),
 * receita líquida (área esmeralda) e despesas (linha laranja tracejada).
 */
export function MonthlyRevenueChart({
  data,
}: {
  data: DailyRevenuePoint[];
}) {
  const totalFaturamento = data.reduce(
    (sum, point) => sum + (point.faturamento ?? 0),
    0
  );

  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-muted-foreground">
        <p>Nenhum dado disponível para este período.</p>
      </div>
    );
  }

  return (
    <>
      <div
        role="img"
        aria-label={`Gráfico de evolução mensal: faturamento total de ${currencyFormatter.format(totalFaturamento)} no período`}
        className="h-[260px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="dashboard-chart-primary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dashboard-chart-emerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--chart-2)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="var(--border)"
              strokeOpacity={0.5}
              strokeDasharray="0"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                `R$ ${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
              }
              width={72}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: "var(--primary)",
                strokeOpacity: 0.35,
                strokeDasharray: "3 3",
                strokeWidth: 1,
              }}
            />
            <Area
              type="monotone"
              dataKey="faturamento"
              name="Faturamento"
              stroke="var(--primary)"
              strokeWidth={2.4}
              strokeLinecap="round"
              fill="url(#dashboard-chart-primary)"
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
              activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="comissoes"
              name="Receita líquida"
              stroke="var(--chart-2)"
              strokeWidth={2.2}
              strokeLinecap="round"
              fill="url(#dashboard-chart-emerald)"
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
              activeDot={{ r: 4, fill: "var(--chart-2)", stroke: "var(--card)", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke="#F97316"
              strokeWidth={2}
              strokeDasharray="3 4"
              strokeOpacity={0.85}
              dot={false}
              activeDot={{ r: 4, fill: "#F97316", stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>Evolução diária de faturamento, comissões e despesas</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Faturamento</th>
            <th scope="col">Comissões</th>
            <th scope="col">Despesas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{currencyFormatter.format(point.faturamento ?? 0)}</td>
              <td>{currencyFormatter.format(point.comissoes ?? 0)}</td>
              <td>{currencyFormatter.format(point.despesas ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
