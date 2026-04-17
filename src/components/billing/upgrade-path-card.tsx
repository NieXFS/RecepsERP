"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { normalizePlanSlug, PLAN_SLUGS, type PlanSlug } from "@/lib/plans";
import { cn } from "@/lib/utils";

type PlanLike = {
  slug: string;
  name: string;
  priceMonthly: unknown;
  currency: string;
};

const CHIPS_BY_SLUG: Record<PlanSlug, string[]> = {
  [PLAN_SLUGS.ATENDENTE_IA]: [
    "Agenda",
    "Clientes",
    "Profissionais",
    "Financeiro",
    "Prontuários",
  ],
  [PLAN_SLUGS.ERP]: [
    "Ana IA 24/7",
    "WhatsApp automático",
    "Agendamentos pela Ana",
    "Personalidade configurável",
  ],
  [PLAN_SLUGS.COMBO]: [],
};

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

export function UpgradePathCard({
  currentSlug,
  allPlans,
}: {
  currentSlug: string | null | undefined;
  allPlans: PlanLike[];
}) {
  const normalized = normalizePlanSlug(currentSlug);

  if (normalized !== PLAN_SLUGS.ATENDENTE_IA && normalized !== PLAN_SLUGS.ERP) {
    return null;
  }

  const bySlug = new Map<PlanSlug, PlanLike>();
  for (const plan of allPlans) {
    const slug = normalizePlanSlug(plan.slug);
    if (slug && !bySlug.has(slug)) {
      bySlug.set(slug, plan);
    }
  }

  const currentPlan = bySlug.get(normalized);
  const otherSlug =
    normalized === PLAN_SLUGS.ATENDENTE_IA ? PLAN_SLUGS.ERP : PLAN_SLUGS.ATENDENTE_IA;
  const otherPlan = bySlug.get(otherSlug);
  const comboPlan = bySlug.get(PLAN_SLUGS.COMBO);

  if (!currentPlan || !otherPlan || !comboPlan) {
    return null;
  }

  const currentPrice = toNumber(currentPlan.priceMonthly);
  const otherPrice = toNumber(otherPlan.priceMonthly);
  const comboPrice = toNumber(comboPlan.priceMonthly);
  const sumSeparate = currentPrice + otherPrice;
  const savings = sumSeparate - comboPrice;
  const currency = comboPlan.currency || "BRL";

  const chips = CHIPS_BY_SLUG[normalized];

  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 md:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden md:block"
      >
        <span className="animate-aurora-pan absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-8">
        <div className="flex-1 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Upgrade disponível
          </span>

          <h2 className="font-heading text-xl font-bold leading-snug md:text-2xl">
            Combine tudo no Combo e economize{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tabular-nums">
              {formatCurrency(savings, currency)}
            </span>
            /mês
          </h2>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Hoje você paga {formatCurrency(currentPrice, currency)} no{" "}
            <span className="font-medium text-foreground">{currentPlan.name}</span>. Assinando o{" "}
            <span className="font-medium text-foreground">{comboPlan.name}</span> por{" "}
            {formatCurrency(comboPrice, currency)}/mês, em vez de {formatCurrency(sumSeparate, currency)} separados.
          </p>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground">Adicione:</span>
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Link
            href={`/assinar?plan=${PLAN_SLUGS.COMBO}&upgrade=1`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "shadow-lg shadow-primary/20"
            )}
          >
            Fazer upgrade pro Combo
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="text-xs text-muted-foreground md:text-right">
            Sem perder seus dados. Mudança na próxima cobrança.
          </p>
        </div>
      </div>
    </section>
  );
}
