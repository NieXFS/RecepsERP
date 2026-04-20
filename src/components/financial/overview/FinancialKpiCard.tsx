import type { ComponentType, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  label: string;
  value: string;
  note?: string;
  icon: ComponentType<{ className?: string }>;
  accent?: string;
  iconWrapperClass?: string;
  trend?: ReactNode;
  delay?: number;
};

/**
 * Card de KPI usado no topo das abas do módulo Financeiro (Geral, Comissões,
 * Despesas, Caixa). Mantém altura, ícone colorido e subtítulo consistentes.
 */
export function FinancialKpiCard({
  label,
  value,
  note,
  icon: Icon,
  accent,
  iconWrapperClass,
  trend,
  delay = 0,
}: Props) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            iconWrapperClass ?? "bg-muted"
          }`}
        >
          <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
        {trend ? <div className="mt-2">{trend}</div> : null}
      </CardContent>
    </Card>
  );
}
