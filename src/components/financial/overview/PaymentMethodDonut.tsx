"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Slice = {
  paymentMethod: string;
  label: string;
  amount: number;
};

type Props = {
  data: Slice[];
  total: number;
};

const PALETTE: Record<string, string> = {
  PIX: "#10b981",
  CASH: "#3b82f6",
  CREDIT_CARD: "#8b5cf6",
  DEBIT_CARD: "#f97316",
  BANK_TRANSFER: "#0ea5e9",
  BOLETO: "#facc15",
  OTHER: "#64748b",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PaymentMethodDonut({ data, total }: Props) {
  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
        Sem entradas no caixa hoje.
      </div>
    );
  }

  const chartData = data.map((slice) => ({
    name: slice.label,
    value: slice.amount,
    fill: PALETTE[slice.paymentMethod] ?? PALETTE.OTHER,
  }));

  return (
    <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
          <span className="text-lg font-semibold tabular-nums">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((slice) => {
          const percent = total > 0 ? (slice.amount / total) * 100 : 0;
          return (
            <li
              key={slice.paymentMethod}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: PALETTE[slice.paymentMethod] ?? PALETTE.OTHER,
                  }}
                />
                <span className="font-medium text-foreground">{slice.label}</span>
              </span>
              <span className="text-right tabular-nums">
                <span className="font-semibold">{formatCurrency(slice.amount)}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
