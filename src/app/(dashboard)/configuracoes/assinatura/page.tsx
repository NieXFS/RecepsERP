import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { BillingManagementCard } from "@/components/billing/billing-management-card";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { InvoicesTable } from "@/components/billing/invoices-table";
import { PlanBenefitsGrid } from "@/components/billing/plan-benefits-grid";
import {
  SubscriptionNoticeBanner,
  type SubscriptionNotice,
} from "@/components/billing/subscription-notice-banner";
import { SubscriptionHero } from "@/components/billing/subscription-hero";
import { TrialCountdownCard } from "@/components/billing/trial-countdown-card";
import { UpgradePathCard } from "@/components/billing/upgrade-path-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserWithAccess } from "@/lib/session";
import { getTenantBillingDashboardData, listActivePlans } from "@/services/billing.service";

const VALID_NOTICES: SubscriptionNotice[] = [
  "already-active",
  "billing-in-progress",
  "checkout-error",
];

function parseNotice(raw: string | undefined): SubscriptionNotice | null {
  if (!raw) return null;
  return VALID_NOTICES.includes(raw as SubscriptionNotice)
    ? (raw as SubscriptionNotice)
    : null;
}

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const params = await searchParams;
  const notice = parseNotice(params.notice);
  const user = await getAuthUserWithAccess();
  const { tenant, access, defaultPaymentMethod } = await getTenantBillingDashboardData(
    user.tenantId
  );
  const subscription = tenant.subscription;
  const bypassEnabled = access.billingBypassEnabled;

  if (!subscription) {
    return (
      <div className="flex flex-col gap-6">
        {notice ? <SubscriptionNoticeBanner notice={notice} /> : null}

        {bypassEnabled ? (
          <Card className="border-amber-500/25 bg-amber-500/5">
            <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-200">
              Acesso sem cobrança habilitado manualmente pela Receps.
              {access.billingBypassReason ? ` Motivo: ${access.billingBypassReason}` : ""}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription>Este tenant ainda não possui assinatura configurada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {bypassEnabled
                ? "O ERP está liberado por uma exceção manual da Receps, mas não existe assinatura Stripe ativa."
                : "Escolha um plano e conclua o checkout para liberar o ERP."}
            </p>
            <Link
              href="/assinar"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
            >
              Ver planos
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const plan = subscription.plan;
  const allPlans = await listActivePlans();
  const cancelEnding =
    subscription.cancelAtPeriodEnd || subscription.status === "CANCELED";
  const needsPaymentAction =
    subscription.status === "PAST_DUE" ||
    subscription.status === "UNPAID" ||
    subscription.status === "INCOMPLETE" ||
    subscription.status === "INCOMPLETE_EXPIRED";
  const showUpgradePath =
    !bypassEnabled &&
    subscription.status !== "CANCELED" &&
    plan.slug !== "erp-atendente-ia";
  const showTrialCard =
    !bypassEnabled &&
    subscription.status === "TRIALING" &&
    !!subscription.trialEnd;

  return (
    <div className="flex flex-col gap-6">
      {notice ? <SubscriptionNoticeBanner notice={notice} /> : null}

      {bypassEnabled ? (
        <section className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 md:p-5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary"
          >
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold leading-tight">
              Acesso liberado internamente pela equipe Receps
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {access.billingBypassReason
                ? `Motivo: ${access.billingBypassReason}`
                : "Sem cobrança aplicada — cortesia/exceção manual."}
            </p>
          </div>
        </section>
      ) : null}

      {needsPaymentAction && !bypassEnabled ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive"
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-destructive">
                Última cobrança falhou
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Atualize sua forma de pagamento para manter o acesso ao ERP.
              </p>
            </div>
          </div>
          <BillingPortalButton
            returnUrl="/configuracoes/assinatura"
            label="Atualizar pagamento"
          />
        </section>
      ) : null}

      {cancelEnding && !bypassEnabled ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 md:flex-row md:items-center md:justify-between md:p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive"
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight text-destructive">
                {subscription.status === "CANCELED"
                  ? "Sua assinatura está cancelada"
                  : `Sua assinatura termina em ${format(subscription.currentPeriodEnd, "d 'de' MMMM yyyy", { locale: ptBR })}`}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Reative pelo portal para manter o acesso ao ERP sem perder dados.
              </p>
            </div>
          </div>
          <BillingPortalButton
            returnUrl="/configuracoes/assinatura"
            label="Reativar"
            variant="outline"
          />
        </section>
      ) : null}

      <SubscriptionHero
        plan={plan}
        subscription={{
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEnd: subscription.trialEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }}
        bypassEnabled={bypassEnabled}
      />

      {showTrialCard ? (
        <TrialCountdownCard
          trialEnd={subscription.trialEnd!}
          trialStart={subscription.trialStart}
          hasPaymentMethod={!!defaultPaymentMethod}
          defaultPaymentMethodLabel={defaultPaymentMethod?.label ?? null}
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <PlanBenefitsGrid plan={plan} />
        <BillingManagementCard
          currentPeriodEnd={subscription.currentPeriodEnd}
          cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          defaultPaymentMethod={
            defaultPaymentMethod
              ? {
                  label: defaultPaymentMethod.label,
                  expiresAt: defaultPaymentMethod.expiresAt,
                }
              : null
          }
        />
      </div>

      {showUpgradePath ? (
        <UpgradePathCard currentSlug={plan.slug} allPlans={allPlans} />
      ) : null}

      {!bypassEnabled ? <InvoicesTable invoices={subscription.invoices} /> : null}
    </div>
  );
}
