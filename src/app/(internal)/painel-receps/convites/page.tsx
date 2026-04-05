import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listGlobalInvitations } from "@/services/global-admin.service";
import {
  InvitationStatusBadge,
  TenantStatusBadge,
} from "@/components/internal/receps-status-badges";
import { InvitationActionButtons } from "@/components/internal/invitation-action-buttons";
import { ManualTenantInvitationForm } from "@/components/internal/manual-tenant-invitation-form";

/**
 * Lista global dos convites emitidos pela Receps.
 * Convite não é cliente ativo; é apenas a etapa de ativação do tenant.
 */
export default async function RecepsInvitationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: "ALL" | "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED";
  }>;
}) {
  const params = await searchParams;
  const invitations = await listGlobalInvitations({
    search: params.q,
    status: params.status ?? "ALL",
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Novo convite manual</CardTitle>
          <CardDescription>
            Use quando o cliente vier por negociação direta, indicação ou implantação assistida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualTenantInvitationForm />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Convites</CardTitle>
          <CardDescription>
            Histórico global de convites de ativação e administração dos tenants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
            <div className="space-y-1.5">
              <label htmlFor="invitation-search" className="text-sm font-medium">
                Buscar por tenant, slug, responsável ou email
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="invitation-search"
                  name="q"
                  defaultValue={params.q}
                  className="pl-9"
                  placeholder="Ex: studio aurora, admin@cliente.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invitation-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="invitation-status"
                name="status"
                defaultValue={params.status ?? "ALL"}
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendentes</option>
                <option value="ACCEPTED">Aceitos</option>
                <option value="EXPIRED">Expirados</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Filtrar
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {invitations.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">
              Nenhum convite encontrado com os filtros atuais.
            </CardContent>
          </Card>
        ) : (
          invitations.map((invitation) => (
            <Card key={invitation.id} className="border-border/70 shadow-sm">
              <CardContent className="py-5">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.8fr_auto] lg:items-start">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{invitation.tenant.name}</p>
                      <InvitationStatusBadge status={invitation.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invitation.recipientName || "Responsável"} • {invitation.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Tenant:{" "}
                      <Link
                        href={`/painel-receps/clientes/${invitation.tenant.id}`}
                        className="text-primary hover:underline"
                      >
                        {invitation.tenant.slug}
                      </Link>
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Emitido em</p>
                    <p className="text-muted-foreground">{formatDateTime(invitation.createdAt)}</p>
                    <p className="font-medium pt-1">Expira em</p>
                    <p className="text-muted-foreground">{formatDateTime(invitation.expiresAt)}</p>
                  </div>

                  <div className="space-y-2">
                    <TenantStatusBadge
                      status={deriveTenantStatusForInvitation(
                        invitation.tenant.lifecycleStatus,
                        invitation.tenant.isActive,
                        invitation.status
                      )}
                    />
                  </div>

                  <InvitationActionButtons
                    invitationId={invitation.id}
                    tenantId={invitation.tenant.id}
                    status={invitation.status}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function deriveTenantStatusForInvitation(
  lifecycleStatus: "ACTIVE" | "INCOMPLETE" | "SUSPENDED",
  isActive: boolean,
  invitationStatus: "PENDING" | "ACCEPTED" | "EXPIRED" | "CANCELLED"
) {
  if (lifecycleStatus === "SUSPENDED") {
    return "SUSPENDED" as const;
  }

  if (lifecycleStatus === "ACTIVE" && isActive) {
    return "ACTIVE" as const;
  }

  if (invitationStatus === "PENDING") {
    return "INVITE_PENDING" as const;
  }

  return "INCOMPLETE" as const;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}
