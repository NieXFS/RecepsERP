"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

/**
 * Gráfico responsivo da evolução mensal com faturamento, comissões e despesas por dia.
 */
export function MonthlyRevenueChart({
  data,
}: {
  data: DailyRevenuePoint[];
}) {
  const totalFaturamento = data.reduce((sum, point) => sum + (point.faturamento ?? 0), 0);

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-muted-foreground">
        <p>Nenhum dado disponível para este período.</p>
      </div>
    );
  }

  return (
    <>
      <div
        role="img"
        aria-label={`Gráfico de evolução mensal: faturamento total de ${currencyFormatter.format(totalFaturamento)} no período`}
        className="h-[320px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              minTickGap={16}
            />
            <YAxis
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                currencyFormatter.format(Number(value)).replace("R$", "R$")
              }
              width={88}
            />
            <Tooltip
              animationDuration={200}
              animationEasing="ease-out"
              contentStyle={{
                background: "var(--color-card)",
                color: "var(--color-card-foreground)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
              }}
              formatter={(value, name) => [
                currencyFormatter.format(Number(value ?? 0)),
                String(name),
              ]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="faturamento"
              name="Faturamento"
              stroke="var(--color-chart-1)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="comissoes"
              name="Comissões"
              stroke="var(--color-chart-2)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="despesas"
              name="Despesas"
              stroke="var(--color-chart-4)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </LineChart>
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
