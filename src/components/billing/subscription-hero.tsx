import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { SubscriptionStatusBadge } from "./subscription-status-badge";
import type { SubscriptionStatus } from "@/generated/prisma/enums";

type HeroPlan = {
  name: string;
  description: string | null;
  priceMonthly: unknown; // Prisma.Decimal (has toString)
  currency: string;
};

type HeroSubscription = {
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

function formatCurrency(value: unknown, currency: string) {
  const num = Number(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number.isFinite(num) ? num : 0);
}

function splitPlanName(name: string) {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { head: "", tail: trimmed };
  return {
    head: parts.slice(0, -1).join(" "),
    tail: parts[parts.length - 1],
  };
}

export function SubscriptionHero({
  plan,
  subscription,
  bypassEnabled = false,
}: {
  plan: HeroPlan;
  subscription: HeroSubscription;
  bypassEnabled?: boolean;
}) {
  const { head, tail } = splitPlanName(plan.name);
  const description =
    plan.description?.trim() ||
    "Seu plano atual no Receps.";
  const now = new Date();
  const isTrialing = subscription.status === "TRIALING" && subscription.trialEnd;
  const trialDaysLeft = subscription.trialEnd
    ? Math.max(0, differenceInDays(subscription.trialEnd, now))
    : null;

  return (
    <section className="animate-fade-in-down relative isolate overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background p-6 md:p-8 lg:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
      >
        <span className="animate-aurora-pan absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-primary/20 blur-3xl" />
        <span
          className="animate-twinkle absolute right-[22%] top-[28%] h-1 w-1 rounded-full bg-primary/60"
          style={{ animationDelay: "0.8s" }}
        />
        <span
          className="animate-twinkle absolute left-[30%] top-[60%] h-[3px] w-[3px] rounded-full bg-primary/70"
          style={{ animationDelay: "2.2s" }}
        />
      </div>

      <div className="relative z-10 grid gap-8 md:grid-cols-2 md:items-end">
        <div>
          <Badge
            variant="outline"
            className="border-primary/20 bg-primary/5 text-primary"
          >
            Sua assinatura
          </Badge>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            {head && <span>{head} </span>}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {tail}
            </span>
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        <div className="md:text-right">
          {bypassEnabled ? (
            <p className="font-heading text-3xl font-bold md:text-4xl">
              Acesso interno
            </p>
          ) : (
            <p className="font-heading text-4xl font-bold tabular-nums md:text-5xl">
              {formatCurrency(plan.priceMonthly, plan.currency)}
              <span className="ml-1 text-base font-medium text-muted-foreground">
                /mês
              </span>
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 md:justify-end">
            <SubscriptionStatusBadge status={subscription.status} />
            {!bypassEnabled && (
              <span className="text-sm text-muted-foreground">
                {isTrialing && subscription.trialEnd
                  ? `Trial até ${format(subscription.trialEnd, "d 'de' MMM", { locale: ptBR })} · ${trialDaysLeft} dia${trialDaysLeft === 1 ? "" : "s"} restantes`
                  : subscription.cancelAtPeriodEnd
                    ? `Termina em ${format(subscription.currentPeriodEnd, "d 'de' MMM yyyy", { locale: ptBR })}`
                    : `Próxima cobrança: ${format(subscription.currentPeriodEnd, "d 'de' MMM yyyy", { locale: ptBR })}`}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
