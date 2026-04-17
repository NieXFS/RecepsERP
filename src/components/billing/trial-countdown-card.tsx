import { Clock, ShieldCheck } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BillingPortalButton } from "./billing-portal-button";
import { cn } from "@/lib/utils";

type TrialCountdownCardProps = {
  trialEnd: Date;
  trialStart: Date | null;
  hasPaymentMethod: boolean;
  defaultPaymentMethodLabel?: string | null;
};

export function TrialCountdownCard({
  trialEnd,
  trialStart,
  hasPaymentMethod,
  defaultPaymentMethodLabel,
}: TrialCountdownCardProps) {
  const now = new Date();
  const totalDays = Math.max(
    1,
    trialStart ? differenceInDays(trialEnd, trialStart) : 7
  );
  const daysLeft = Math.max(0, differenceInDays(trialEnd, now));
  const daysUsed = Math.max(0, totalDays - daysLeft);
  const pctUsed = Math.min(100, Math.round((daysUsed / totalDays) * 100));

  const title = hasPaymentMethod
    ? daysLeft > 0
      ? `Tudo pronto — cobrança automática em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
      : "Cobrança automática acontece hoje"
    : daysLeft > 0
      ? `Seu período de teste termina em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
      : "Seu período de teste termina hoje";

  const Icon = hasPaymentMethod ? ShieldCheck : Clock;

  return (
    <section
      aria-label="Status do período de teste"
      className={cn(
        "rounded-2xl border p-5 md:p-6",
        hasPaymentMethod
          ? "border-emerald-200/50 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-950/20"
          : "border-amber-200/50 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-950/20"
      )}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            hasPaymentMethod
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1 space-y-3">
          <div>
            <h2 className="font-heading text-base font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Encerra em {format(trialEnd, "d 'de' MMMM yyyy", { locale: ptBR })}
            </p>
          </div>

          <div
            role="progressbar"
            aria-valuenow={daysUsed}
            aria-valuemin={0}
            aria-valuemax={totalDays}
            aria-label={`${daysUsed} de ${totalDays} dias de teste consumidos`}
            className="h-2 w-full overflow-hidden rounded-full bg-background/60 ring-1 ring-black/5 dark:ring-white/5"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                hasPaymentMethod
                  ? "bg-emerald-500/80 dark:bg-emerald-400"
                  : "bg-amber-500/80 dark:bg-amber-400"
              )}
              style={{ width: `${pctUsed}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={cn(
                "text-xs tabular-nums",
                hasPaymentMethod
                  ? "text-emerald-800 dark:text-emerald-300"
                  : "text-amber-800 dark:text-amber-300"
              )}
            >
              Dia {daysUsed} de {totalDays}
            </span>
            {hasPaymentMethod ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                {defaultPaymentMethodLabel ?? "Cartão cadastrado"}
              </span>
            ) : (
              <BillingPortalButton
                returnUrl="/configuracoes/assinatura"
                label="Adicionar forma de pagamento"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
