import { Target, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  PacingStatus,
  RevenueGoalProgress,
} from "@/services/revenue-goal.service";

import { RevenueGoalEditTrigger } from "./revenue-goal-edit-dialog";

type Props = {
  progress: RevenueGoalProgress;
  canEdit: boolean;
};

const PACING_STYLE: Record<
  PacingStatus,
  {
    label: string;
    icon: typeof Target;
    badgeClass: string;
    insight: (context: {
      realized: number;
      target: number;
      remaining: number;
      daysRemaining: number;
      dailyPaceRealized: number;
      expectedDailyToClose: number;
    }) => string;
  }
> = {
  behind: {
    label: "Abaixo do ritmo",
    icon: TrendingDown,
    badgeClass:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    insight: ({ expectedDailyToClose, daysRemaining }) =>
      daysRemaining > 0
        ? `Para bater a meta faltam ${formatCurrency(expectedDailyToClose)}/dia nos próximos ${daysRemaining} dia(s).`
        : `Mês encerrando sem atingir a meta. Ajuste o alvo ou registre lançamentos retroativos.`,
  },
  on_track: {
    label: "No ritmo",
    icon: Target,
    badgeClass:
      "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    insight: ({ expectedDailyToClose, daysRemaining }) =>
      daysRemaining > 0
        ? `Mantendo ${formatCurrency(expectedDailyToClose)}/dia nos próximos ${daysRemaining} dia(s) a meta é cumprida.`
        : `Ritmo consistente ao longo do mês.`,
  },
  ahead: {
    label: "Acima do ritmo",
    icon: TrendingUp,
    badgeClass:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    insight: ({ realized, target }) =>
      realized >= target
        ? `Meta batida! Excedente de ${formatCurrency(realized - target)}.`
        : `Ritmo atual acima do esperado — boa margem para fechar o mês positivo.`,
  },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatMonthLabel(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1, 12, 0, 0, 0);
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function RevenueGoalBlock({ progress, canEdit }: Props) {
  const {
    month,
    targetAmount,
    realizedAmount,
    pendingIncomeAmount,
    projectedAmount,
    remainingAmount,
    percentAchieved,
    percentProjected,
    daysRemaining,
    pacingStatus,
    dailyPaceRealized,
  } = progress;

  const style = PACING_STYLE[pacingStatus];
  const PacingIcon = style.icon;

  const cappedAchieved = Math.min(Math.max(percentAchieved, 0), 100);
  const cappedProjected = Math.min(
    Math.max(percentProjected, cappedAchieved),
    100
  );

  const exceeded = realizedAmount > targetAmount && targetAmount > 0;

  const expectedDailyToClose =
    daysRemaining > 0 ? remainingAmount / daysRemaining : 0;

  const insight = style.insight({
    realized: realizedAmount,
    target: targetAmount,
    remaining: remainingAmount,
    daysRemaining,
    dailyPaceRealized,
    expectedDailyToClose,
  });

  return (
    <section aria-label="Meta de faturamento do mês">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold tracking-tight">
                  Meta de faturamento — {formatMonthLabel(month)}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                {progress.daysElapsed} de {progress.daysInMonth} dia(s) decorridos ·
                ritmo atual {formatCurrency(dailyPaceRealized)}/dia
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium",
                  style.badgeClass
                )}
              >
                <PacingIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {style.label}
              </Badge>
              {canEdit ? (
                <RevenueGoalEditTrigger
                  month={month}
                  currentTarget={targetAmount}
                  variant="existing"
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div
              className="relative h-3 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(cappedAchieved)}
              aria-label="Progresso da meta"
            >
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-primary/25 transition-all",
                  exceeded && "bg-emerald-500/20"
                )}
                style={{ width: `${cappedProjected}%` }}
              />
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-primary transition-all",
                  exceeded && "bg-emerald-500"
                )}
                style={{ width: `${cappedAchieved}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>
                {percentAchieved.toFixed(0)}% realizado
                {percentProjected > percentAchieved
                  ? ` · ${percentProjected.toFixed(0)}% previsto`
                  : ""}
              </span>
              <span>
                {remainingAmount > 0
                  ? `Falta ${formatCurrency(remainingAmount)}`
                  : "Meta atingida"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Realizado
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {formatCurrency(realizedAmount)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Meta
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {formatCurrency(targetAmount)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Projeção (fim do mês)
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums">
                {formatCurrency(projectedAmount)}
              </p>
              {pendingIncomeAmount > 0 ? (
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  + {formatCurrency(pendingIncomeAmount)} previstos
                </p>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{insight}</p>
        </CardContent>
      </Card>
    </section>
  );
}
