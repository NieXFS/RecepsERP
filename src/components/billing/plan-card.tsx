"use client";

import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  Gift,
  Layers,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { normalizePlanSlug, PLAN_SLUGS } from "@/lib/plans";

export type PublicPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  currency: string;
  trialDays: number;
  isFeatured: boolean;
  features: unknown;
};

type PlanCardProps = {
  plan: PublicPlan;
  isHighlighted: boolean;
  isLoading: boolean;
  onCheckout: (plan: PublicPlan) => void;
};

function getPlanFeatureList(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.map((feature) => String(feature));
  }

  if (features && typeof features === "object") {
    return Object.entries(features).map(([key, value]) =>
      typeof value === "boolean"
        ? `${key}: ${value ? "Sim" : "Não"}`
        : `${key}: ${String(value)}`
    );
  }

  return [];
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function renderPlanIcon(slug: string, className?: string) {
  const normalized = normalizePlanSlug(slug);
  if (normalized === PLAN_SLUGS.ATENDENTE_IA) {
    return <Bot aria-hidden="true" className={className} />;
  }
  if (normalized === PLAN_SLUGS.ERP) {
    return <CalendarCheck2 aria-hidden="true" className={className} />;
  }
  return <Layers aria-hidden="true" className={className} />;
}

export function PlanCard({ plan, isHighlighted, isLoading, onCheckout }: PlanCardProps) {
  const features = getPlanFeatureList(plan.features);
  const headingId = `plan-name-${plan.id}`;
  const ctaLabel = plan.isFeatured ? "Começar teste grátis" : "Assinar agora";

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "group relative flex flex-col rounded-[2rem] border bg-background p-8 transition-all duration-300",
        isHighlighted
          ? "border-primary/40 shadow-2xl shadow-primary/15 ring-1 ring-primary/10 lg:-my-4 lg:scale-[1.02]"
          : "border-border/60 shadow-sm hover:-translate-y-0.5 hover:border-border hover:shadow-xl hover:shadow-primary/5"
      )}
    >
      {isHighlighted ? (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
          />
          <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/30">
            Mais popular
          </span>
        </>
      ) : null}

      <span
        aria-hidden="true"
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          isHighlighted
            ? "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
            : "bg-primary/10 text-primary"
        )}
      >
        {renderPlanIcon(plan.slug, "h-6 w-6")}
      </span>

      <h3 id={headingId} className="mt-6 text-xl font-semibold tracking-tight text-foreground">
        {plan.name}
      </h3>
      <p className="mt-2 min-h-[3rem] text-sm leading-6 text-muted-foreground">
        {plan.description || "Plano mensal para operar o Receps ERP."}
      </p>

      <div className="mt-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-semibold tracking-tight text-foreground">
            {formatCurrency(plan.priceMonthly, plan.currency)}
          </span>
          <span className="text-base text-muted-foreground">/mês</span>
        </div>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          <Gift aria-hidden="true" className="h-3.5 w-3.5" />
          {plan.trialDays} dias grátis para testar
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
      />

      <ul className="mt-6 space-y-3 text-sm">
        {features.length > 0 ? (
          features.map((feature, index) => (
            <li
              key={`${plan.id}-${index}-${feature}`}
              className="flex items-start gap-2.5 text-foreground/80"
            >
              <Check
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              />
              <span>{feature}</span>
            </li>
          ))
        ) : (
          <li className="text-muted-foreground">Pergunte pra gente no WhatsApp.</li>
        )}
      </ul>

      <div className="mt-auto pt-8">
        <Button
          type="button"
          size="lg"
          variant={isHighlighted ? "default" : "outline"}
          disabled={isLoading}
          aria-busy={isLoading}
          onClick={() => onCheckout(plan)}
          className={cn(
            "h-12 w-full rounded-xl text-base font-medium",
            isHighlighted
              ? "shadow-lg shadow-primary/25 hover:shadow-primary/35"
              : "border-primary/30 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>Preparando acesso…</span>
            </>
          ) : (
            <>
              <span>{ctaLabel}</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
