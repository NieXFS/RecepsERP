"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PublicPlan = {
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

type SubscribePlansPanelProps = {
  plans: PublicPlan[];
  selectedPlan?: string;
  referralCode?: string;
  referralTenantName?: string | null;
  isAuthenticated: boolean;
  canceled?: boolean;
};

function getPlanFeatureList(features: unknown) {
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

export function SubscribePlansPanel({
  plans,
  selectedPlan,
  referralCode,
  referralTenantName,
  isAuthenticated,
  canceled = false,
}: SubscribePlansPanelProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const highlightedPlanId = useMemo(() => {
    if (!selectedPlan) {
      return plans.find((plan) => plan.isFeatured)?.id ?? plans[0]?.id ?? null;
    }

    const directMatch = plans.find(
      (plan) => plan.id === selectedPlan || plan.slug === selectedPlan
    );

    return directMatch?.id ?? plans[0]?.id ?? null;
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (!referralCode) {
      return;
    }

    document.cookie = `receps_referral_code=${encodeURIComponent(referralCode)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }, [referralCode]);

  function handlePlanCheckout(planId: string) {
    setError("");
    setPendingPlanId(planId);

    startTransition(async () => {
      if (!isAuthenticated) {
        const params = new URLSearchParams({
          plan: planId,
          ...(referralCode ? { ref: referralCode } : {}),
        });

        router.push(`/solicitar-acesso?${params.toString()}`);
        return;
      }

      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId,
            referralCode,
          }),
        });

        const data = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !data.url) {
          throw new Error(data.error || "Não foi possível iniciar o checkout.");
        }

        window.location.href = data.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível iniciar o checkout.";
        setError(message);
        toast.error(message);
      } finally {
        setPendingPlanId(null);
      }
    });
  }

  return (
    <div className="space-y-8">
      {referralCode && referralTenantName ? (
        <div className="rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-900 dark:text-emerald-200">
          Você ganhou 15% de desconto na sua primeira cobrança — indicado por{" "}
          <span className="font-semibold">{referralTenantName}</span>.
        </div>
      ) : null}

      {canceled ? (
        <div className="rounded-[1.25rem] border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
          O checkout foi cancelado. Você pode escolher um plano e tentar novamente.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[1.25rem] border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const features = getPlanFeatureList(plan.features);
          const isHighlighted = plan.id === highlightedPlanId;
          const isLoading = isPending && pendingPlanId === plan.id;

          return (
            <article
              key={plan.id}
              className={[
                "rounded-[2rem] border bg-background p-6 shadow-xl transition-all",
                isHighlighted
                  ? "border-primary shadow-primary/10"
                  : "border-border/70 shadow-primary/5",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {plan.description || "Plano mensal para operar o Receps ERP."}
                  </p>
                </div>

                {plan.isFeatured ? <Badge>Destaque</Badge> : null}
              </div>

              <div className="mt-6">
                <p className="text-3xl font-semibold">
                  {formatCurrency(plan.priceMonthly, plan.currency)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  mensal • {plan.trialDays} dias de trial
                </p>
              </div>

              {features.length > 0 ? (
                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                  {features.map((feature) => (
                    <p key={`${plan.id}-${feature}`}>• {feature}</p>
                  ))}
                </div>
              ) : null}

              <Button
                type="button"
                className="mt-8 w-full"
                variant={isHighlighted ? "default" : "outline"}
                disabled={isLoading}
                onClick={() => handlePlanCheckout(plan.id)}
              >
                {isLoading
                  ? "Redirecionando..."
                  : isAuthenticated
                    ? "Assinar com Checkout"
                    : "Continuar para solicitar acesso"}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
