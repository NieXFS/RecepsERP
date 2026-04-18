import { Card, CardContent } from "@/components/ui/card";
import { SubscribePlansPanel } from "@/components/billing/subscribe-plans-panel";
import { SubscribeHero } from "@/components/marketing/subscribe-hero";
import { SubscribeTrustBar } from "@/components/marketing/subscribe-trust-bar";
import { SubscribeFaq } from "@/components/marketing/subscribe-faq";
import { SubscribeFinalCta } from "@/components/marketing/subscribe-final-cta";
import { getOptionalSession } from "@/lib/session";
import { listActivePlans } from "@/services/billing.service";
import { getReferralByCode } from "@/services/referral.service";

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; ref?: string; canceled?: string }>;
}) {
  const params = await searchParams;
  const [plans, session, referral] = await Promise.all([
    listActivePlans(),
    getOptionalSession(),
    params.ref ? getReferralByCode(params.ref) : null,
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-14 px-6 py-12 sm:space-y-20 sm:py-16">
      <SubscribeHero />

      {plans.length === 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardContent className="py-10 text-sm text-muted-foreground">
            Nenhum plano ativo foi configurado no momento.
          </CardContent>
        </Card>
      ) : (
        <SubscribePlansPanel
          plans={plans.map((plan) => ({
            ...plan,
            priceMonthly: Number(plan.priceMonthly),
          }))}
          selectedPlan={params.plan}
          referralCode={referral?.code}
          referralTenantName={referral?.tenant.name ?? null}
          isAuthenticated={Boolean(session)}
          canceled={params.canceled === "1"}
        />
      )}

      <SubscribeTrustBar />
      <SubscribeFaq />
      <SubscribeFinalCta />
    </div>
  );
}
