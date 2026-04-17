"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubscriptionNotice =
  | "already-active"
  | "billing-in-progress"
  | "checkout-error";

type NoticeConfig = {
  title: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
  wrapperClass: string;
  iconClass: string;
};

const NOTICE_CONFIG: Record<SubscriptionNotice, NoticeConfig> = {
  "already-active": {
    title: "Você já tem uma assinatura ativa",
    message: "Gerencie seu plano e forma de pagamento por aqui.",
    icon: CheckCircle2,
    wrapperClass:
      "border-emerald-500/25 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/20",
    iconClass:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  "billing-in-progress": {
    title: "Sua assinatura está sendo processada",
    message: "Atualize a página em alguns segundos para ver o status final.",
    icon: Info,
    wrapperClass:
      "border-amber-500/25 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20",
    iconClass:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  "checkout-error": {
    title: "Não conseguimos completar o checkout",
    message: "Tente novamente em instantes ou fale com o suporte se o erro persistir.",
    icon: AlertTriangle,
    wrapperClass:
      "border-destructive/25 bg-destructive/5",
    iconClass: "bg-destructive/15 text-destructive",
  },
};

export function SubscriptionNoticeBanner({
  notice,
}: {
  notice: SubscriptionNotice;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const config = NOTICE_CONFIG[notice];
  const Icon = config.icon;

  function handleDismiss() {
    startTransition(() => {
      router.replace(pathname);
    });
  }

  return (
    <div
      role="status"
      className={cn(
        "animate-fade-in-down flex items-start gap-3 rounded-2xl border p-4 md:p-5",
        config.wrapperClass
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          config.iconClass
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold leading-tight">{config.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{config.message}</p>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        disabled={isPending}
        aria-label="Fechar aviso"
        className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
