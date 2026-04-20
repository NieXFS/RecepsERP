"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string;
  entradas: number;
  saidas: number;
};

type Props = {
  data: Point[];
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
  const parsed = (() => {
    try {
      return parseISO(label);
    } catch {
      return null;
    }
  })();
  const title = parsed
    ? format(parsed, "dd 'de' MMMM", { locale: ptBR })
    : label;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium capitalize text-foreground">{title}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{item.name}</span>
          <span
            className={
              item.dataKey === "entradas" ? "font-medium text-emerald-600" : "font-medium text-red-600"
            }
          >
            {formatCurrency(item.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function DailyMovementChart({ data }: Props) {
  const hasData = data.some((point) => point.entradas > 0 || point.saidas > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Sem movimentações no período selecionado.
        </p>
        <Link
          href="/financeiro/extrato"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Registrar lançamento
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) => {
              try {
                return format(parseISO(value), "dd/MM", { locale: ptBR });
              } catch {
                return value;
              }
            }}
          />
          <YAxis
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
          <Bar
            dataKey="entradas"
            name="Entradas"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="saidas"
            name="Saídas"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
