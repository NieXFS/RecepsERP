"use client";

import { Check, Circle, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnaReadinessResult } from "./ana-readiness";

export function AnaReadinessScore({
  readiness,
  className,
}: {
  readiness: AnaReadinessResult;
  className?: string;
}) {
  const { score, items } = readiness;
  const complete = score >= 100;

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Prontidão da Ana
          </span>
          <span className="font-heading text-sm font-semibold tabular-nums text-foreground">
            {score}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Ana está ${score}% pronta`}
          className="relative h-2 w-full overflow-hidden rounded-full bg-muted/70 ring-1 ring-primary/10"
        >
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/70 transition-all duration-700 ease-out",
              complete && "animate-highlight-pulse"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {complete
            ? "Ana está prontinha pra atender seus clientes."
            : `Ana está ${score}% pronta. Finalize os itens abaixo pra destravar tudo.`}
        </p>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2.5 text-sm leading-snug"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                item.done
                  ? "bg-primary/15 text-primary ring-primary/30"
                  : item.partial
                    ? "bg-amber-500/15 text-amber-600 ring-amber-500/30 dark:text-amber-400"
                    : "bg-muted text-muted-foreground ring-border"
              )}
            >
              {item.done ? (
                <Check className="h-3 w-3" />
              ) : item.partial ? (
                <CircleDashed className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </span>
            <span
              className={cn(
                item.done
                  ? "text-foreground/90"
                  : "text-muted-foreground",
                item.partial && "text-foreground/80"
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
