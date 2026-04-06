import Link from "next/link";
import type { ComponentType } from "react";
import {
  ArrowRight,
  CalendarRange,
  Landmark,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { getAuthUserForModule } from "@/lib/session";
import { getFinancialOverview } from "@/services/financial.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

/**
 * Home do módulo Financeiro com visão executiva e atalhos operacionais.
 */
export default async function FinancialPage() {
  const user = await getAuthUserForModule("COMISSOES");
  const overview = await getFinancialOverview(user.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card">
        <CardHeader>
          <CardTitle>Visão geral do Financeiro</CardTitle>
          <CardDescription>
            Recorte atual: <span className="font-medium capitalize text-foreground">{overview.period.label}</span>
            {" · "}
            {overview.period.startDate} até {overview.period.endDate}
          </CardDescription>
        </CardHeader>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          label="Entradas do período"
          value={formatCurrency(overview.summary.entradas)}
          note="Receitas registradas no extrato"
          icon={TrendingUp}
          accent="text-emerald-600"
        />
        <SummaryMetricCard
          label="Saídas do período"
          value={formatCurrency(overview.summary.saidas)}
          note="Despesas e repasses lançados"
          icon={TrendingDown}
          accent="text-red-600"
        />
        <SummaryMetricCard
          label="Saldo do período"
          value={formatCurrency(overview.summary.saldoPeriodo)}
          note={`${overview.summary.totalLancamentos} lançamento(s) no período`}
          icon={ReceiptText}
          accent={overview.summary.saldoPeriodo >= 0 ? "text-emerald-600" : "text-red-600"}
        />
        <SummaryMetricCard
          label="Caixa atual"
          value={overview.cash.status === "OPEN" ? "Aberto" : "Fechado"}
          note={
            overview.cash.status === "OPEN"
              ? `${overview.cash.accountName ?? "Caixa"} em operação`
              : overview.cash.lastClosedAt
                ? `Último fechamento em ${formatDateTime(overview.cash.lastClosedAt)}`
                : "Nenhuma sessão aberta no momento"
          }
          icon={Landmark}
          accent={overview.cash.status === "OPEN" ? "text-emerald-600" : "text-muted-foreground"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-primary" />
              Comissões
            </CardTitle>
            <CardDescription>
              Fechamento de repasses e pendências dos profissionais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniStat
                label="Geradas no período"
                value={formatCurrency(overview.commissions.generatedTotal)}
              />
              <MiniStat
                label="Pendentes"
                value={formatCurrency(overview.commissions.pendingTotal)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {overview.commissions.pendingCount} comissão(ões) pendentes distribuídas entre{" "}
              {overview.commissions.professionalsWithPending} profissional(is).
            </p>
            <ActionLink href="/financeiro/comissoes" label="Ir para Comissões" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" />
              Caixa
            </CardTitle>
            <CardDescription>
              Status operacional da sessão de caixa do estabelecimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniStat
                label="Status"
                value={overview.cash.status === "OPEN" ? "Aberto" : "Fechado"}
              />
              <MiniStat
                label="Saldo esperado"
                value={formatCurrency(overview.cash.expectedBalance)}
              />
            </div>
            {overview.cash.status === "OPEN" ? (
              <p className="text-sm text-muted-foreground">
                Aberto por <span className="font-medium text-foreground">{overview.cash.openedByName}</span>{" "}
                em {formatDateTime(overview.cash.openedAt)} com valor inicial de{" "}
                {formatCurrency(overview.cash.openingAmount)}.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum caixa aberto no momento. Use a área operacional para iniciar uma nova sessão.
              </p>
            )}
            <ActionLink href="/financeiro/caixa" label="Ir para Caixa" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-primary" />
              Extrato por datas
            </CardTitle>
            <CardDescription>
              Consulta de lançamentos, entradas, saídas e saldo do período.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniStat
                label="Lançamentos"
                value={String(overview.statement.recentCount)}
              />
              <MiniStat
                label="Último movimento"
                value={overview.statement.lastTransactionAt ? "Registrado" : "Sem dados"}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Último lançamento identificado em {formatDateTime(overview.statement.lastTransactionAt)}.
            </p>
            <ActionLink href="/financeiro/extrato" label="Ir para Extrato" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Atividades recentes</CardTitle>
            <CardDescription>
              Últimos eventos financeiros e operacionais do módulo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview.recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Ainda não há movimentações recentes para exibir.
              </div>
            ) : (
              <div className="space-y-3">
                {overview.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between gap-4 rounded-xl border bg-muted/15 p-4"
                  >
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(activity.occurredAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {translateActivityType(activity.type)}
                      </p>
                      <p className="text-sm font-semibold">
                        {activity.amount != null ? formatCurrency(activity.amount) : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos operacionais</CardTitle>
            <CardDescription>
              Acesse rapidamente as áreas mais usadas do Financeiro.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <ShortcutCard
              href="/financeiro/comissoes"
              title="Fechar comissões"
              description="Pague repasses pendentes e registre a despesa no caixa."
            />
            <ShortcutCard
              href="/financeiro/extrato"
              title="Analisar extrato"
              description="Filtre lançamentos por data, tipo e status."
            />
            <ShortcutCard
              href="/financeiro/caixa"
              title="Operar caixa"
              description="Abra, acompanhe e feche a sessão atual do caixa."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SummaryMetricCard({
  label,
  value,
  note,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${accent ?? ""}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-muted/15 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ShortcutCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-muted/15 p-4 transition-colors hover:border-primary/35 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
      </div>
    </Link>
  );
}

function translateActivityType(type: "TRANSACTION" | "CASH_OPEN" | "CASH_CLOSE") {
  const labels = {
    TRANSACTION: "Lançamento",
    CASH_OPEN: "Abertura",
    CASH_CLOSE: "Fechamento",
  } satisfies Record<typeof type, string>;

  return labels[type];
}
