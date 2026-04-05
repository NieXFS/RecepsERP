import Link from "next/link";
import type { ComponentType } from "react";
import { ClipboardList, FileStack, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserForModule } from "@/lib/session";
import { db } from "@/lib/db";

/**
 * Página inicial de prontuários.
 * Hoje o detalhamento clínico já vive dentro da área de clientes; esta rota centraliza a entrada do módulo.
 */
export default async function ClinicalRecordsPage() {
  const user = await getAuthUserForModule("PRONTUARIOS");

  const [formsCount, recordsCount, activeCustomersCount, recentForms] = await Promise.all([
    db.anamnesisForm.count({
      where: { tenantId: user.tenantId, deletedAt: null },
    }),
    db.anamnesisRecord.count({
      where: { tenantId: user.tenantId },
    }),
    db.customer.count({
      where: { tenantId: user.tenantId, isActive: true, deletedAt: null },
    }),
    db.anamnesisForm.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-[2rem] border border-border/70 bg-background px-8 py-7 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Prontuários</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Os registros clínicos continuam acessíveis dentro do cadastro de cada cliente. Esta
              rota organiza a entrada do módulo e elimina o link quebrado da sidebar.
            </p>
          </div>
          <Link
            href="/clientes"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Abrir clientes
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Formulários ativos"
          value={formsCount}
          description="Modelos de anamnese disponíveis no tenant"
          icon={ClipboardList}
        />
        <SummaryCard
          title="Registros lançados"
          value={recordsCount}
          description="Prontuários preenchidos na base"
          icon={FileStack}
        />
        <SummaryCard
          title="Clientes ativos"
          value={activeCustomersCount}
          description="Base potencial para evolução clínica"
          icon={Users}
        />
      </section>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Formulários recentes</CardTitle>
          <CardDescription>
            Base mínima para navegação e futura expansão do módulo clínico centralizado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentForms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não existem formulários de anamnese cadastrados.
            </p>
          ) : (
            recentForms.map((form) => (
              <div key={form.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">{form.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {formatDate(form.createdAt)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {form.isActive ? "Ativo" : "Inativo"}
                  </p>
                </div>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground">
            Para visualizar o histórico clínico completo, abra um cliente e acesse as abas do perfil.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="flex items-start justify-between py-5">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(value);
}
