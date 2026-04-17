import type { SubscriptionStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type StatusConfig = {
  label: string;
  dot: string;
  pulse?: boolean;
};

const STATUS_MAP: Record<SubscriptionStatus, StatusConfig> = {
  TRIALING: { label: "Em período de teste", dot: "bg-amber-500 dark:bg-amber-400" },
  ACTIVE: {
    label: "Assinatura ativa",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    pulse: true,
  },
  PAST_DUE: { label: "Pagamento pendente", dot: "bg-orange-500 dark:bg-orange-400" },
  CANCELED: { label: "Cancelada", dot: "bg-neutral-400 dark:bg-neutral-500" },
  INCOMPLETE: { label: "Aguardando pagamento", dot: "bg-amber-500 dark:bg-amber-400" },
  INCOMPLETE_EXPIRED: {
    label: "Pagamento não concluído",
    dot: "bg-destructive",
  },
  UNPAID: { label: "Não paga", dot: "bg-destructive" },
  PAUSED: { label: "Pausada", dot: "bg-neutral-400 dark:bg-neutral-500" },
};

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  const config = STATUS_MAP[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-sm font-medium",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          config.dot,
          config.pulse && "animate-pulse"
        )}
      />
      <span>{config.label}</span>
      <span className="sr-only">Status da assinatura: {config.label}</span>
    </span>
  );
}
