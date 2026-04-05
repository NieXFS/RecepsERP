import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listGlobalLeads } from "@/services/global-admin.service";
import { LeadStatusBadge } from "@/components/internal/receps-status-badges";
import { LeadActionButtons } from "@/components/internal/lead-action-buttons";

/**
 * Lista global dos leads do ERP, claramente separados dos tenants reais.
 */
export default async function RecepsLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "CONVERTED";
  }>;
}) {
  const params = await searchParams;
  const leads = await listGlobalLeads({
    search: params.q,
    status: params.status ?? "ALL",
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Solicitações comerciais do ERP. Lead não é tenant operacional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_auto]">
            <div className="space-y-1.5">
              <label htmlFor="lead-search" className="text-sm font-medium">
                Buscar por negócio, responsável ou email
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lead-search"
                  name="q"
                  defaultValue={params.q}
                  className="pl-9"
                  placeholder="Ex: studio aurora, fernanda, contato@empresa.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="lead-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="lead-status"
                name="status"
                defaultValue={params.status ?? "ALL"}
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="PENDING">Pendentes</option>
                <option value="APPROVED">Aprovados</option>
                <option value="REJECTED">Rejeitados</option>
                <option value="CONVERTED">Convertidos</option>
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
        {leads.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">
              Nenhum lead encontrado com os filtros atuais.
            </CardContent>
          </Card>
        ) : (
          leads.map((lead) => (
            <Card key={lead.id} className="border-border/70 shadow-sm">
              <CardContent className="py-5">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.8fr_auto] lg:items-start">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{lead.businessName}</p>
                      <LeadStatusBadge status={lead.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lead.ownerName} • {lead.email}
                      {lead.phone ? ` • ${lead.phone}` : ""}
                    </p>
                    {lead.notes ? (
                      <p className="text-sm text-muted-foreground">{lead.notes}</p>
                    ) : null}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Criado em</p>
                    <p className="text-muted-foreground">{formatDateTime(lead.createdAt)}</p>
                    {lead.tenant ? (
                      <p className="text-muted-foreground">
                        Tenant:{" "}
                        <Link
                          href={`/painel-receps/clientes/${lead.tenant.id}`}
                          className="text-primary hover:underline"
                        >
                          {lead.tenant.name}
                        </Link>
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Convites vinculados</p>
                    <p className="text-muted-foreground">{lead.invitations.length}</p>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {lead.status === "PENDING" ? (
                      <LeadActionButtons accessRequestId={lead.id} />
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}
