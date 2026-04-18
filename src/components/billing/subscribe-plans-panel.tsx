"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CreditCard, Gift, Lock, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics/events";
import { normalizePlanSlug } from "@/lib/plans";
import { getReferralCookie, setReferralCookie } from "@/lib/referral-cookie";
import { PlanCard, type PublicPlan } from "@/components/billing/plan-card";

type SubscribePlansPanelProps = {
  plans: PublicPlan[];
  selectedPlan?: string;
  referralCode?: string;
  referralTenantName?: string | null;
  isAuthenticated: boolean;
  canceled?: boolean;
};

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
    const normalizedSelectedPlan = normalizePlanSlug(selectedPlan);

    if (!selectedPlan) {
      return plans.find((plan) => plan.isFeatured)?.id ?? plans[0]?.id ?? null;
    }

    const directMatch = plans.find(
      (plan) =>
        plan.id === selectedPlan ||
        plan.slug === selectedPlan ||
        normalizePlanSlug(plan.slug) === normalizedSelectedPlan
    );

    return directMatch?.id ?? plans[0]?.id ?? null;
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (!referralCode) {
      return;
    }

    setReferralCookie(referralCode);
  }, [referralCode]);

  function handlePlanCheckout(plan: PublicPlan) {
    setError("");
    setPendingPlanId(plan.id);

    startTransition(async () => {
      const resolvedReferralCode = referralCode ?? getReferralCookie() ?? undefined;
      trackEvent("plan_selected", { plan_slug: normalizePlanSlug(plan.slug) ?? plan.slug });

      if (!isAuthenticated) {
        const resolvedPlanSlug = normalizePlanSlug(plan.slug) ?? plan.slug;
        const params = new URLSearchParams({
          plan: resolvedPlanSlug,
          ...(resolvedReferralCode ? { ref: resolvedReferralCode } : {}),
        });

        router.push(`/cadastro?${params.toString()}`);
        return;
      }

      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId: plan.id,
            referralCode: resolvedReferralCode,
          }),
        });

        const data = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !data.url) {
          throw new Error(data.error || "Não foi possível iniciar seu trial.");
        }

        window.location.href = data.url;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível iniciar seu trial.";
        setError(message);
        toast.error(message);
      } finally {
        setPendingPlanId(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur">
          <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
          7 dias grátis
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur">
          <Lock aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
          Cancele quando quiser
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur">
          <CreditCard aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
          Sem fidelidade
        </span>
      </div>

      {referralCode && referralTenantName ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 border-l-4 border-l-emerald-500 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-900 dark:text-emerald-200">
          <Gift aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
          <span>
            Você ganhou 15% de desconto na sua primeira cobrança — indicado por{" "}
            <span className="font-semibold">{referralTenantName}</span>.
          </span>
        </div>
      ) : null}

      {canceled ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 border-l-4 border-l-amber-500 bg-amber-500/5 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
          <X aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
          <span>O pagamento foi cancelado. Você pode escolher um plano e tentar novamente.</span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/20 border-l-4 border-l-destructive bg-destructive/5 px-5 py-4 text-sm text-destructive"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isHighlighted={plan.id === highlightedPlanId}
            isLoading={isPending && pendingPlanId === plan.id}
            onCheckout={handlePlanCheckout}
          />
        ))}
      </div>
    </div>
  );
}
