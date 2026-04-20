"use client";

import { CheckCircle2, Clock3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FinancialKpiCard } from "@/components/financial/overview/FinancialKpiCard";

type Props = {
  status: "OPEN" | "CLOSED";
  openedAt: string | null;
  lastClosedAt: string | null;
  delay?: number;
};

function formatRelative(value: string | null) {
  if (!value) return null;
  try {
    return formatDistanceToNow(new Date(value), { locale: ptBR, addSuffix: false });
  } catch {
    return null;
  }
}

export function CashStatusKpi({ status, openedAt, lastClosedAt, delay = 0 }: Props) {
  if (status === "OPEN") {
    const relative = formatRelative(openedAt);
    return (
      <FinancialKpiCard
        delay={delay}
        label="Status"
        value="Aberto"
        note={relative ? `Aberto há ${relative}` : "Sessão em operação"}
        icon={CheckCircle2}
        accent="text-emerald-600"
        iconWrapperClass="bg-emerald-500/10"
      />
    );
  }

  const relative = formatRelative(lastClosedAt);
  return (
    <FinancialKpiCard
      delay={delay}
      label="Status"
      value="Fechado"
      note={
        relative
          ? `Último acerto há ${relative}`
          : "Nenhuma sessão registrada ainda"
      }
      icon={Clock3}
      accent="text-muted-foreground"
      iconWrapperClass="bg-muted"
    />
  );
}
