import Link from "next/link";
import {
  Activity,
  Building2,
  Clock3,
  MailPlus,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecepsOverview } from "@/services/global-admin.service";
import { RecepsMetricCard } from "@/components/internal/receps-metric-card";
import {
  InvitationStatusBadge,
  LeadStatusBadge,
  TenantStatusBadge,
} from "@/components/internal/receps-status-badges";
import { LeadActionButtons } from "@/components/internal/lead-action-buttons";
import { InvitationActionButtons } from "@/components/internal/invitation-action-buttons";

/**
 * Overview executivo do painel global da Receps.
 * Consolida o estado da base de clientes, convites e funil comercial em um só lugar.
 */
export default async function PainelRecepsOverviewPage() {
  const overview = await getRecepsOverview();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/70 bg-background px-8 py-7 shadow-xl shadow-primary/8">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
            Painel global da Receps
          </p>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Torre de controle da base de clientes
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Visão consolidada de leads, convites e tenants da plataforma, com separação clara
              entre funil comercial, ativação e operação já em andamento.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <RecepsMetricCard
          title="Leads pendentes"
          value={overview.metrics.pendingLeads}
          description="Solicitações aguardando triagem comercial"
          icon={UsersRound}
        />
        <RecepsMetricCard
          title="Convites pendentes"
          value={overview.metrics.pendingInvitations}
          description="Tenants já preparados, mas ainda não ativados"
          icon={MailPlus}
        />
        <RecepsMetricCard
          title="Clientes ativos"
          value={overview.metrics.activeTenants}
          description="Tenants operacionais e prontos para uso"
          icon={TrendingUp}
        />
        <RecepsMetricCard
          title="Clientes suspensos"
          value={overview.metrics.suspendedTenants}
          description="Base inativa por decisão administrativa global"
          icon={Clock3}
        />
        <RecepsMetricCard
          title="Tenants incompletos"
          value={overview.metrics.incompleteTenants}
          description="Estruturas criadas, mas ainda não operacionais"
          icon={Activity}
        />
        <RecepsMetricCard
          title="Base total"
          value={overview.metrics.totalTenants}
          description={`${overview.metrics.totalUsers} usuários cadastrados na base cliente`}
          icon={Building2}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Leads recentes</CardTitle>
            <CardDescription>Solicitações comerciais mais recentes do ERP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lead recente.</p>
            ) : (
              overview.recentLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{lead.businessName}</p>
                        <LeadStatusBadge status={lead.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.ownerName} • {lead.email}
                      </p>
                    </div>
                    {lead.status === "PENDING" ? (
                      <LeadActionButtons accessRequestId={lead.id} />
                    ) : null}
                  </div>
                </div>
              ))
            )}
            <Link href="/painel-receps/leads" className="text-sm font-medium text-primary hover:underline">
              Ver todos os leads
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Convites recentes</CardTitle>
            <CardDescription>Links emitidos para ativação dos tenants.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.recentInvitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum convite recente.</p>
            ) : (
              overview.recentInvitations.map((invitation) => (
                <div key={invitation.id} className="rounded-xl border border-border/70 p-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{invitation.tenant.name}</p>
                      <InvitationStatusBadge status={invitation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invitation.recipientName || "Responsável"} • {invitation.email}
                    </p>
                    <InvitationActionButtons
                      invitationId={invitation.id}
                      tenantId={invitation.tenant.id}
                      status={invitation.status}
                    />
                  </div>
                </div>
              ))
            )}
            <Link
              href="/painel-receps/convites"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver todos os convites
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Clientes aguardando ativação</CardTitle>
            <CardDescription>
              Tenants incompletos ou com convite pendente, ainda fora do estado operacional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.tenantsAwaitingActivation.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente aguardando ativação no momento.
              </p>
            ) : (
              overview.tenantsAwaitingActivation.map((tenant) => (
                <div key={tenant.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.mainContactName || "Sem responsável"} •{" "}
                        {tenant.mainContactEmail || "Sem email principal"}
                      </p>
                    </div>
                    <TenantStatusBadge status={tenant.globalStatus} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Clientes operacionais</CardTitle>
            <CardDescription>
              Tenants ativos que já concluíram a ativação do ambiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.operationalTenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum cliente operacional cadastrado.
              </p>
            ) : (
              overview.operationalTenants.map((tenant) => (
                <div key={tenant.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">{tenant.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.mainContactName || "Sem responsável"} •{" "}
                        {tenant.mainContactEmail || "Sem email principal"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TenantStatusBadge status={tenant.globalStatus} />
                      <Link
                        href={`/painel-receps/clientes/${tenant.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Abrir detalhe
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
