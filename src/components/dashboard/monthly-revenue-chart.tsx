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
 * Gráfico responsivo da evolução mensal com faturamento e comissões por dia.
 */
export function MonthlyRevenueChart({
  data,
}: {
  data: DailyRevenuePoint[];
}) {
  return (
    <div className="h-[320px] w-full">
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
          />
          <Line
            type="monotone"
            dataKey="comissoes"
            name="Comissões"
            stroke="var(--color-chart-2)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
