"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

type Props = {
  current: number;
  previous: number;
  invertColors?: boolean;
};

export function KpiTrendIndicator({ current, previous, invertColors = false }: Props) {
  if (previous === 0) {
    return null;
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const rounded = Math.round(delta * 10) / 10;

  if (Math.abs(rounded) < 0.1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
        estável vs. período anterior
      </span>
    );
  }

  const positive = rounded > 0;
  const goodDirection = invertColors ? !positive : positive;
  const colorClass = goodDirection ? "text-emerald-600" : "text-red-600";
  const Icon = positive ? ArrowUp : ArrowDown;
  const formatted = `${positive ? "+" : ""}${rounded.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${colorClass}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {formatted} vs. período anterior
    </span>
  );
}
