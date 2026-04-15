import { Card, CardContent } from "@/components/ui/card";
import { SubscribePlansPanel } from "@/components/billing/subscribe-plans-panel";
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
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
          Planos
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Comece a transformar sua clínica hoje
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Escolha o plano ideal, teste grátis por 7 dias e cancele quando quiser.
          Sem fidelidade, sem burocracia.
        </p>
      </section>

      <div className="mt-10">
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
      </div>
    </div>
  );
}
