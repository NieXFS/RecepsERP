import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listGlobalTenants } from "@/services/global-admin.service";
import {
  TenantSourceBadge,
  TenantStatusBadge,
} from "@/components/internal/receps-status-badges";

/**
 * Lista global de tenants/clientes da Receps com busca, filtro e ordenação básicos.
 */
export default async function RecepsClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: "ALL" | "ACTIVE" | "SUSPENDED" | "INVITE_PENDING" | "INCOMPLETE";
    sort?: "createdAt_desc" | "createdAt_asc" | "name_asc" | "name_desc";
  }>;
}) {
  const params = await searchParams;
  const tenants = await listGlobalTenants({
    search: params.q,
    status: params.status ?? "ALL",
    sort: params.sort ?? "createdAt_desc",
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Clientes / Tenants</CardTitle>
          <CardDescription>
            Visão completa da base de tenants da Receps, separando clientes ativos, suspensos e
            estruturas ainda incompletas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
            <div className="space-y-1.5">
              <label htmlFor="tenant-search" className="text-sm font-medium">
                Buscar por nome, slug ou email
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tenant-search"
                  name="q"
                  defaultValue={params.q}
                  className="pl-9"
                  placeholder="Ex: studio, clinica-bella, admin@cliente.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tenant-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="tenant-status"
                name="status"
                defaultValue={params.status ?? "ALL"}
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Ativos</option>
                <option value="SUSPENDED">Suspensos</option>
                <option value="INVITE_PENDING">Convite pendente</option>
                <option value="INCOMPLETE">Incompletos</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tenant-sort" className="text-sm font-medium">
                Ordenação
              </label>
              <select
                id="tenant-sort"
                name="sort"
                defaultValue={params.sort ?? "createdAt_desc"}
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="createdAt_desc">Mais recentes</option>
                <option value="createdAt_asc">Mais antigos</option>
                <option value="name_asc">Nome A-Z</option>
                <option value="name_desc">Nome Z-A</option>
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
        {tenants.length === 0 ? (
          <Card className="border-border/70 shadow-sm">
            <CardContent className="py-8 text-sm text-muted-foreground">
              Nenhum tenant encontrado com os filtros atuais.
            </CardContent>
          </Card>
        ) : (
          tenants.map((tenant) => (
            <Card key={tenant.id} className="border-border/70 shadow-sm">
              <CardContent className="py-5">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] lg:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold">{tenant.name}</p>
                      <TenantStatusBadge status={tenant.globalStatus} />
                      <TenantSourceBadge source={tenant.source} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      slug: {tenant.slug}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tenant.mainContactName || "Sem responsável"} •{" "}
                      {tenant.mainContactEmail || "Sem email principal"}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Criado em</p>
                    <p className="text-muted-foreground">{formatDate(tenant.createdAt)}</p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Usuários</p>
                    <p className="text-muted-foreground">{tenant.userCount}</p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Operacional</p>
                    <p className="text-muted-foreground">
                      {tenant.isOperational ? "Sim" : "Não"}
                      {tenant.hasPendingInvitation ? " • convite pendente" : ""}
                    </p>
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    <Link
                      href={`/painel-receps/clientes/${tenant.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      Abrir detalhe
                    </Link>
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(value);
}
