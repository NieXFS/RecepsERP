import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowRight, Info } from "lucide-react";
import type { FinancialAlert } from "@/services/financial.service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Props = {
  alerts: FinancialAlert[];
};

const SEVERITY_STYLES: Record<
  FinancialAlert["severity"],
  {
    icon: typeof AlertTriangle;
    iconColor: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  critical: {
    icon: AlertTriangle,
    iconColor: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    label: "Crítico",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Atenção",
  },
  info: {
    icon: Info,
    iconColor: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    label: "Informativo",
  },
};

export function FinancialAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;

  const useGrid = alerts.length >= 3;

  return (
    <section
      aria-label="Avisos do módulo Financeiro"
      className="animate-fade-in-down flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Avisos</h2>
        <Badge variant="secondary" className="tabular-nums">
          {alerts.length}
        </Badge>
      </div>
      <ul
        role="list"
        className={cn(
          "grid gap-3",
          useGrid ? "md:grid-cols-2" : "grid-cols-1"
        )}
      >
        {alerts.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity];
          const Icon = style.icon;
          return (
            <li
              key={alert.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors",
                style.border
              )}
            >
              <span
                aria-label={style.label}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  style.bg
                )}
              >
                <Icon className={cn("h-4 w-4", style.iconColor)} aria-hidden="true" />
              </span>
              <div className="flex flex-1 flex-col gap-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.title}</p>
              </div>
              <Link
                href={alert.ctaHref}
                className="group inline-flex shrink-0 items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {alert.ctaLabel}
                <ArrowRight
                  className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
