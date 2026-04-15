import Link from "next/link";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserWithAccess } from "@/lib/session";
import { getTenantBillingDashboardData } from "@/services/billing.service";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(value);
}

function getNoticeConfig(notice?: string) {
  switch (notice) {
    case "already-active":
      return {
        className: "border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200",
        message: "Sua assinatura já está ativa. Você pode gerenciar seu plano por aqui.",
      };
    case "billing-in-progress":
      return {
        className: "border-sky-500/20 bg-sky-500/5 text-sky-900 dark:text-sky-200",
        message: "Já existe uma assinatura em andamento para este tenant. Aguarde a confirmação do pagamento para liberar o acesso.",
      };
    case "checkout-error":
      return {
        className: "border-destructive/20 bg-destructive/5 text-destructive",
        message: "Não conseguimos iniciar o pagamento agora. Tente novamente em instantes.",
      };
    default:
      return null;
  }
}

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const params = await searchParams;
  const user = await getAuthUserWithAccess();
  const { tenant, access, defaultPaymentMethod } = await getTenantBillingDashboardData(
    user.tenantId
  );
  const subscription = tenant.subscription;
  const notice = getNoticeConfig(params.notice);

  if (!subscription) {
    return (
      <div className="space-y-6">
        {notice ? (
          <Card className={notice.className}>
            <CardContent className="py-4 text-sm">{notice.message}</CardContent>
          </Card>
        ) : null}

        {access.billingBypassEnabled ? (
          <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
            <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-200">
              Acesso sem cobrança habilitado manualmente pela Receps.
              {access.billingBypassReason ? ` Motivo: ${access.billingBypassReason}` : ""}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription>Este tenant ainda não possui assinatura configurada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {access.billingBypassEnabled
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

  return (
    <div className="space-y-6">
      {notice ? (
        <Card className={notice.className}>
          <CardContent className="py-4 text-sm">{notice.message}</CardContent>
        </Card>
      ) : null}

      {access.billingBypassEnabled ? (
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
          <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-200">
            Acesso sem cobrança habilitado manualmente pela Receps.
            {access.billingBypassReason ? ` Motivo: ${access.billingBypassReason}` : ""}
          </CardContent>
        </Card>
      ) : null}

      {subscription.status === "TRIALING" && subscription.trialEnd ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
          <CardContent className="flex flex-col gap-3 py-4 text-sm text-emerald-900 dark:text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Trial ativo até {formatDate(subscription.trialEnd)}.
              {defaultPaymentMethod
                ? " Sua forma de pagamento já está salva."
                : " Adicione uma forma de pagamento para continuar depois do período grátis."}
            </span>
            {!defaultPaymentMethod ? (
              <BillingPortalButton
                returnUrl="/configuracoes/assinatura"
                label="Adicionar forma de pagamento"
                variant="outline"
              />
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {subscription.status === "PAST_DUE" ? (
        <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm">
          <CardContent className="py-4 text-sm text-amber-900 dark:text-amber-200">
            Há pagamentos pendentes. Atualize a forma de pagamento para manter o acesso ao ERP.
          </CardContent>
        </Card>
      ) : null}

      {subscription.status === "CANCELED" ? (
        <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
          <CardContent className="flex flex-col gap-3 py-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <span>
              Sua assinatura está cancelada. Adicione uma forma de pagamento ou escolha um novo
              plano para reativar o acesso.
            </span>
            <BillingPortalButton
              returnUrl="/configuracoes/assinatura"
              label="Abrir portal de cobrança"
              variant="outline"
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo da assinatura</CardTitle>
            <CardDescription>Plano atual, status e próxima cobrança.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Plano" value={subscription.plan.name} />
            <InfoItem
              label="Preço mensal"
              value={formatCurrency(Number(subscription.plan.priceMonthly), subscription.plan.currency)}
            />
            <InfoItem label="Status" value={subscription.status} />
            <InfoItem label="Acesso" value={access.hasAccess ? "Liberado" : "Bloqueado"} />
            <InfoItem
              label="Origem do acesso"
              value={
                access.accessSource === "BILLING_BYPASS"
                  ? "Liberação manual da Receps"
                  : access.accessSource === "SUBSCRIPTION"
                    ? "Assinatura Stripe"
                    : access.accessSource === "SUPER_ADMIN"
                      ? "Bypass global"
                      : "Sem liberação"
              }
            />
            <InfoItem label="Próxima cobrança" value={formatDate(subscription.currentPeriodEnd)} />
            <InfoItem
              label="Método padrão"
              value={defaultPaymentMethod?.label ?? subscription.defaultPaymentMethod ?? "-"}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Gerenciamento</CardTitle>
            <CardDescription>
              Use o portal da Stripe para atualizar pagamento, cancelar ou reativar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <BillingPortalButton returnUrl="/configuracoes/assinatura" />
            <p className="text-sm text-muted-foreground">
              O portal hospedado evita replicar uma UI de cobrança dentro do ERP e mantém o fluxo
              oficial da Stripe.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Invoices recentes</CardTitle>
          <CardDescription>Histórico local sincronizado a partir do Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscription.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma invoice sincronizada ainda.</p>
          ) : (
            subscription.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid gap-3 rounded-2xl border border-border/70 p-4 md:grid-cols-[0.7fr_0.7fr_0.7fr_0.9fr_auto]"
              >
                <InfoItem label="Status" value={invoice.status} />
                <InfoItem
                  label="Valor devido"
                  value={formatCurrency(Number(invoice.amountDue), invoice.currency)}
                />
                <InfoItem
                  label="Pago"
                  value={formatCurrency(Number(invoice.amountPaid), invoice.currency)}
                />
                <InfoItem label="Período" value={`${formatDate(invoice.periodStart)} a ${formatDate(invoice.periodEnd)}`} />
                <div className="flex items-center md:justify-end">
                  {invoice.hostedInvoiceUrl ? (
                    <a
                      href={invoice.hostedInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Abrir invoice
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem link</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}
