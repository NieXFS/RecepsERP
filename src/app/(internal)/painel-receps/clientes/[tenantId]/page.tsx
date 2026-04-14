import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSuperAdmin } from "@/lib/session";
import { getTenantDetail } from "@/services/global-admin.service";
import { getBotConfigByTenantIdAdmin } from "@/services/bot-config.service";
import {
  InvitationStatusBadge,
  TenantSourceBadge,
  TenantStatusBadge,
} from "@/components/internal/receps-status-badges";
import { InvitationActionButtons } from "@/components/internal/invitation-action-buttons";
import { TenantStateActions } from "@/components/internal/tenant-state-actions";
import { TenantAdminInvitationForm } from "@/components/internal/tenant-admin-invitation-form";
import {
  AdminBotConfigInitializer,
  AdminBotConfigPanel,
} from "@/components/admin/admin-bot-config-panel";
import { TenantBillingBypassControls } from "@/components/internal/tenant-billing-bypass-controls";
import { getStripeCustomerDashboardUrl } from "@/lib/stripe";

/**
 * Detalhe global do tenant para acompanhamento operacional da base Receps.
 */
export default async function RecepsTenantDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const user = await requireSuperAdmin();
  const { tenantId } = await params;
  const [tenant, botConfig] = await Promise.all([
    getTenantDetail(tenantId),
    getBotConfigByTenantIdAdmin(tenantId, user.id),
  ]);

  if (!tenant || !botConfig) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-background px-8 py-7 shadow-xl shadow-primary/8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/painel-receps/clientes"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para clientes
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{tenant.name}</h1>
              <TenantStatusBadge status={tenant.globalStatus} />
              <TenantSourceBadge source={tenant.source} />
            </div>
            <p className="text-sm text-muted-foreground">
              slug: {tenant.slug} • criado em {formatDateTime(tenant.createdAt)}
            </p>
          </div>

          <TenantStateActions tenantId={tenant.id} globalStatus={tenant.globalStatus} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Dados do tenant</CardTitle>
            <CardDescription>Contexto principal do cliente na plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Nome do negócio" value={tenant.name} />
            <InfoItem label="Slug" value={tenant.slug} />
            <InfoItem label="Origem" value={formatTenantSource(tenant.source)} />
            <InfoItem label="Status global" value={formatTenantStatus(tenant.globalStatus)} />
            <InfoItem label="Email principal" value={tenant.email || tenant.mainContact.email || "-"} />
            <InfoItem label="Responsável principal" value={tenant.mainContact.name || "-"} />
            <InfoItem label="Criado em" value={formatDateTime(tenant.createdAt)} />
            <InfoItem
              label="Observações"
              value={tenant.notes || tenant.accessRequests[0]?.notes || "-"}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Operacional</CardTitle>
            <CardDescription>
              Sinais mínimos para entender se o tenant já está pronto para uso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SignalItem
                label="Tenant operacional"
                value={tenant.operational.isOperational ? "Sim" : "Não"}
              />
              <SignalItem
                label="Conta financeira padrão"
                value={tenant.operational.hasDefaultFinancialAccount ? "Sim" : "Não"}
              />
              <SignalItem label="Usuários cadastrados" value={String(tenant.operational.userCount)} />
              <SignalItem
                label="Contas financeiras"
                value={String(tenant.operational.financialAccountCount)}
              />
              <SignalItem
                label="Convite pendente"
                value={tenant.operational.hasPendingInvitation ? "Sim" : "Não"}
              />
              <SignalItem
                label="Convite já aceito"
                value={tenant.operational.hasAcceptedInvitation ? "Sim" : "Não"}
              />
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-primary" />
                Contas financeiras
              </div>
              <div className="mt-3 space-y-2">
                {tenant.financialAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
                ) : (
                  tenant.financialAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between text-sm">
                      <span>{account.name}</span>
                      <span className="text-muted-foreground">
                        {account.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription>
              Situação atual de billing, plano vinculado e invoices recentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TenantBillingBypassControls
              tenantId={tenant.id}
              subscriptionStatus={tenant.subscription?.status ?? null}
              billingBypassEnabled={tenant.billingBypassEnabled}
              billingBypassReason={tenant.billingBypassReason}
              billingBypassUpdatedAt={tenant.billingBypassUpdatedAt}
            />

            {tenant.subscription ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoItem label="Plano atual" value={tenant.subscription.plan.name} />
                  <InfoItem label="Status" value={tenant.subscription.status} />
                  <InfoItem
                    label="Bypass manual"
                    value={tenant.billingBypassEnabled ? "Habilitado" : "Desabilitado"}
                  />
                  <InfoItem
                    label="Próxima cobrança"
                    value={formatDateTime(tenant.subscription.currentPeriodEnd)}
                  />
                  <InfoItem
                    label="Customer Stripe"
                    value={tenant.subscription.stripeCustomerId}
                  />
                  <InfoItem
                    label="Motivo do bypass"
                    value={tenant.billingBypassReason || "-"}
                  />
                </div>

                <div className="space-y-3">
                  {tenant.subscription.invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma invoice sincronizada ainda.
                    </p>
                  ) : (
                    tenant.subscription.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-[0.8fr_0.8fr_1fr_auto]"
                      >
                        <InfoItem label="Status" value={invoice.status} />
                        <InfoItem
                          label="Pago"
                          value={formatCurrency(Number(invoice.amountPaid), invoice.currency)}
                        />
                        <InfoItem
                          label="Período"
                          value={`${formatDateTime(invoice.periodStart)} até ${formatDateTime(invoice.periodEnd)}`}
                        />
                        <div className="flex items-center md:justify-end">
                          {invoice.hostedInvoiceUrl ? (
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              Abrir
                            </a>
                          ) : (
                            <span className="text-sm text-muted-foreground">Sem link</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <a
                  href={getStripeCustomerDashboardUrl(tenant.subscription.stripeCustomerId)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-primary hover:underline"
                >
                  Abrir customer no Stripe Dashboard
                </a>
              </>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <InfoItem label="Plano atual" value="-" />
                <InfoItem label="Status" value="SEM ASSINATURA" />
                <InfoItem
                  label="Bypass manual"
                  value={tenant.billingBypassEnabled ? "Habilitado" : "Desabilitado"}
                />
                <InfoItem
                  label="Motivo do bypass"
                  value={tenant.billingBypassReason || "-"}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Indicações</CardTitle>
            <CardDescription>
              Código do tenant, origem da indicação e fila de rewards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Código do tenant" value={tenant.referral?.code ?? "-"} />
              <InfoItem
                label="Quem indicou"
                value={tenant.referredByTenant?.name ?? "-"}
              />
              <InfoItem
                label="Rewards pendentes"
                value={String(
                  tenant.referral?.rewards.filter(
                    (reward) => reward.status === "PENDING" || reward.status === "RESERVED"
                  ).length ?? 0
                )}
              />
              <InfoItem
                label="Rewards aplicados"
                value={String(
                  tenant.referral?.rewards.filter((reward) => reward.status === "APPLIED")
                    .length ?? 0
                )}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Indicados gerados por este tenant</p>
              {tenant.referredTenants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum tenant indicado por este cliente até agora.
                </p>
              ) : (
                tenant.referredTenants.map((referredTenant) => (
                  <div
                    key={referredTenant.id}
                    className="rounded-xl border border-border/70 p-4 text-sm"
                  >
                    <p className="font-medium">{referredTenant.name}</p>
                    <p className="text-muted-foreground">
                      {referredTenant.slug} • criado em {formatDateTime(referredTenant.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {botConfig.exists ? (
        <AdminBotConfigPanel config={botConfig} />
      ) : (
        <AdminBotConfigInitializer tenantId={tenant.id} />
      )}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Usuários do tenant</CardTitle>
          <CardDescription>Usuários internos já criados para este cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tenant.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário criado ainda.</p>
          ) : (
            tenant.users.map((user) => (
              <div
                key={user.id}
                className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-5"
              >
                <InfoItem label="Nome" value={user.name} />
                <InfoItem label="Email" value={user.email} />
                <InfoItem label="Role" value={formatRole(user.role)} />
                <InfoItem label="Ativação" value={user.isActive ? "Ativo" : "Inativo"} />
                <InfoItem label="Criado em" value={formatDateTime(user.createdAt)} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Onboarding e convites</CardTitle>
          <CardDescription>
            Histórico dos convites emitidos para ativação e administração do tenant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenant.invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum convite emitido até agora.</p>
          ) : (
            tenant.invitations.map((invitation) => (
              <div key={invitation.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{invitation.recipientName || invitation.email}</p>
                      <InvitationStatusBadge status={invitation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Emitido em {formatDateTime(invitation.createdAt)} • expira em{" "}
                      {formatDateTime(invitation.expiresAt)}
                      {invitation.acceptedAt
                        ? ` • aceito em ${formatDateTime(invitation.acceptedAt)}`
                        : ""}
                    </p>
                  </div>

                  <InvitationActionButtons
                    invitationId={invitation.id}
                    tenantId={tenant.id}
                    status={invitation.status}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Gerar novo convite</CardTitle>
            <CardDescription>
              Útil para novo admin principal, reimplantação guiada ou nova ativação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TenantAdminInvitationForm
              tenantId={tenant.id}
              initialEmail={tenant.mainContact.email}
              initialRecipientName={tenant.mainContact.name}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Origem do cadastro</CardTitle>
            <CardDescription>
              Históricos de lead vinculados ao tenant, quando existirem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenant.accessRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este tenant não veio de um lead público ou o histórico não está disponível.
              </p>
            ) : (
              tenant.accessRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-border/70 p-4">
                  <p className="font-semibold">{request.businessName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.ownerName} • {request.email}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Lead criado em {formatDateTime(request.createdAt)}
                    {request.approvedAt ? ` • aprovado em ${formatDateTime(request.approvedAt)}` : ""}
                    {request.convertedAt
                      ? ` • convertido em ${formatDateTime(request.convertedAt)}`
                      : ""}
                  </p>
                  {request.notes ? (
                    <p className="mt-3 text-sm text-muted-foreground">{request.notes}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function SignalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 p-4">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{value}</p>
    </div>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function formatTenantSource(value: "LEAD" | "MANUAL_INVITE" | "SEED") {
  return (
    {
      LEAD: "Lead",
      MANUAL_INVITE: "Convite manual",
      SEED: "Seed",
    }[value] ?? value
  );
}

function formatTenantStatus(value: "ACTIVE" | "SUSPENDED" | "INVITE_PENDING" | "INCOMPLETE") {
  return (
    {
      ACTIVE: "Ativo",
      SUSPENDED: "Suspenso",
      INVITE_PENDING: "Convite pendente",
      INCOMPLETE: "Incompleto",
    }[value] ?? value
  );
}

function formatRole(value: "ADMIN" | "RECEPTIONIST" | "PROFESSIONAL") {
  return (
    {
      ADMIN: "Admin",
      RECEPTIONIST: "Recepção",
      PROFESSIONAL: "Profissional",
    }[value] ?? value
  );
}
