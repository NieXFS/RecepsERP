import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { differenceInHours, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  FileText,
  Landmark,
  PieChart,
  Plus,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { getAuthUserForPermission } from "@/lib/session";
import { hasPermission } from "@/lib/tenant-permissions";
import { getFinancialOverview } from "@/services/financial.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { DailyMovementChart } from "@/components/financial/overview/DailyMovementChart";
import { KpiTrendIndicator } from "@/components/financial/overview/KpiTrendIndicator";
import { PaymentMethodDonut } from "@/components/financial/overview/PaymentMethodDonut";
import { StatementSparkline } from "@/components/financial/overview/StatementSparkline";
import { TopProfessionalsCard } from "@/components/financial/overview/TopProfessionalsCard";
import { TopServicesCard } from "@/components/financial/overview/TopServicesCard";

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

function formatTimeAgo(value: string | null) {
  if (!value) return null;
  try {
    return formatDistanceToNow(new Date(value), { locale: ptBR, addSuffix: false });
  } catch {
    return null;
  }
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
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

/**
 * Home do módulo Financeiro com visão executiva e atalhos operacionais.
 */
export default async function FinancialPage() {
  const user = await getAuthUserForPermission("financeiro.geral", "view");
  const canViewCommissions = hasPermission(
    user.customPermissions,
    "financeiro.comissoes",
    "view"
  );
  const canViewCaixa = hasPermission(user.customPermissions, "financeiro.caixa", "view");
  const canViewExtrato = hasPermission(user.customPermissions, "financeiro.extrato", "view");
  const canViewDespesas = hasPermission(user.customPermissions, "financeiro.despesas", "view");
  const overview = await getFinancialOverview(user.tenantId);

  const commissionsPaidRatio =
    overview.commissions.generatedTotal > 0
      ? Math.min(
          1,
          Math.max(
            0,
            (overview.commissions.generatedTotal - overview.commissions.pendingTotal) /
              overview.commissions.generatedTotal
          )
        )
      : 0;

  const cashOpenedAgo = formatTimeAgo(overview.cash.openedAt);
  const cashClosedAgo = formatTimeAgo(overview.cash.lastClosedAt);
  const cashClosedHours =
    overview.cash.status === "CLOSED" && overview.cash.lastClosedAt
      ? differenceInHours(new Date(), new Date(overview.cash.lastClosedAt))
      : null;
  const showCashStaleAlert = cashClosedHours != null && cashClosedHours > 24;

  const lastTransactionAgo = formatTimeAgo(overview.statement.lastTransactionAt);

  return (
    <div className="flex flex-col gap-6">
      <Card className="animate-fade-in-down border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card">
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
          delay={0}
          label="Entradas do período"
          value={formatCurrency(overview.summary.entradas)}
          note={`${overview.summary.totalLancamentos} lançamento(s) no período`}
          icon={TrendingUp}
          accent="text-emerald-600"
          iconWrapperClass="bg-emerald-500/10"
          trend={
            <KpiTrendIndicator
              current={overview.summary.entradas}
              previous={overview.previousSummary.entradas}
            />
          }
        />
        <SummaryMetricCard
          delay={50}
          label="Saídas do período"
          value={formatCurrency(overview.summary.saidas)}
          note="Despesas e repasses lançados"
          icon={TrendingDown}
          accent="text-red-600"
          iconWrapperClass="bg-red-500/10"
          trend={
            <KpiTrendIndicator
              current={overview.summary.saidas}
              previous={overview.previousSummary.saidas}
              invertColors
            />
          }
        />
        <SummaryMetricCard
          delay={100}
          label="Saldo do período"
          value={formatCurrency(overview.summary.saldoPeriodo)}
          note={`${overview.summary.totalLancamentos} lançamento(s) considerados`}
          icon={ReceiptText}
          accent={overview.summary.saldoPeriodo >= 0 ? "text-emerald-600" : "text-red-600"}
          iconWrapperClass={
            overview.summary.saldoPeriodo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
          }
          trend={
            <KpiTrendIndicator
              current={overview.summary.saldoPeriodo}
              previous={overview.previousSummary.saldoPeriodo}
            />
          }
        />
        <SummaryMetricCard
          delay={150}
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
          accent={
            overview.cash.status === "OPEN" ? "text-emerald-600" : "text-amber-600"
          }
          iconWrapperClass={
            overview.cash.status === "OPEN" ? "bg-emerald-500/10" : "bg-amber-500/10"
          }
        />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
              Movimentação no período
            </CardTitle>
            <CardDescription>
              Entradas e saídas registradas dia a dia no recorte selecionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DailyMovementChart data={overview.dailySeries} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {canViewCommissions ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-primary" aria-hidden="true" />
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
              {overview.commissions.generatedTotal > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Pagas</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {(commissionsPaidRatio * 100).toLocaleString("pt-BR", {
                        maximumFractionDigits: 0,
                      })}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.max(2, commissionsPaidRatio * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {overview.commissions.pendingCount} comissão(ões) pendentes distribuídas entre{" "}
                {overview.commissions.professionalsWithPending} profissional(is).
              </p>
              <ActionLink href="/financeiro/comissoes" label="Ir para Comissões" />
            </CardContent>
          </Card>
        ) : null}

        {canViewCaixa ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" aria-hidden="true" />
                Caixa
              </CardTitle>
              <CardDescription>
                Status operacional da sessão de caixa do estabelecimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={
                    overview.cash.status === "OPEN"
                      ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                      : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground"
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      overview.cash.status === "OPEN" ? "bg-emerald-500" : "bg-muted-foreground"
                    }`}
                  />
                  {overview.cash.status === "OPEN" ? "Aberto" : "Fechado"}
                </span>
                {overview.cash.status === "OPEN" && cashOpenedAgo ? (
                  <span className="text-xs text-muted-foreground">
                    aberto há {cashOpenedAgo}
                  </span>
                ) : null}
                {overview.cash.status === "CLOSED" && cashClosedAgo ? (
                  <span className="text-xs text-muted-foreground">
                    fechado há {cashClosedAgo}
                  </span>
                ) : null}
              </div>
              <MiniStat
                label="Saldo esperado"
                value={formatCurrency(overview.cash.expectedBalance)}
              />
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
              {showCashStaleAlert ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  Caixa fechado há mais de 24h. Avalie abrir uma nova sessão para registrar as
                  entradas do dia.
                </div>
              ) : null}
              <ActionLink href="/financeiro/caixa" label="Ir para Caixa" />
            </CardContent>
          </Card>
        ) : null}

        {canViewExtrato ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-primary" aria-hidden="true" />
                Extrato por datas
              </CardTitle>
              <CardDescription>
                Consulta de lançamentos, entradas, saídas e saldo do período.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MiniStat
                label="Lançamentos no período"
                value={String(overview.statement.recentCount)}
              />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Últimos 14 dias
                </p>
                <StatementSparkline data={overview.statementTrend} />
              </div>
              <p className="text-sm text-muted-foreground">
                {lastTransactionAgo
                  ? `Último lançamento há ${lastTransactionAgo}.`
                  : "Nenhum lançamento registrado ainda."}
              </p>
              <ActionLink href="/financeiro/extrato" label="Ir para Extrato" />
            </CardContent>
          </Card>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" aria-hidden="true" />
              Fechamento de Caixa Hoje
            </CardTitle>
            <CardDescription>
              Total de entradas pagas hoje, agrupadas por meio de pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total faturado hoje
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatCurrency(overview.todayCashClosing.total)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Consolidado por meio de pagamento
              </p>
            </div>

            {overview.todayCashClosing.methods.length === 0 ? (
              <p className="animate-fade-in text-sm text-muted-foreground">
                Nenhuma entrada paga registrada hoje até o momento.
              </p>
            ) : (
              <div className="rounded-lg border">
                {overview.todayCashClosing.methods.map((entry) => (
                  <div
                    key={entry.paymentMethod}
                    className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                  >
                    <span className="font-medium text-foreground">{entry.label}</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" aria-hidden="true" />
              Composição de caixa hoje
            </CardTitle>
            <CardDescription>
              Distribuição das entradas pagas hoje por meio de pagamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentMethodDonut
              data={overview.todayCashClosing.methods}
              total={overview.todayCashClosing.total}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TopProfessionalsCard items={overview.topProfessionals} />
        <TopServicesCard items={overview.topServices} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <ScrollReveal>
          <Card>
            <CardHeader>
              <CardTitle>Atividades recentes</CardTitle>
              <CardDescription>
                Últimos eventos financeiros e operacionais do módulo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overview.recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p>Ainda não há movimentações recentes para exibir.</p>
                  <Link
                    href="/financeiro/extrato"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Criar primeiro lançamento
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {overview.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between gap-4 rounded-xl border bg-muted/15 p-4 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm"
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
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <Card>
            <CardHeader>
              <CardTitle>Atalhos operacionais</CardTitle>
              <CardDescription>
                Acesse rapidamente as áreas mais usadas do Financeiro.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {canViewCommissions ? (
                <ShortcutCard
                  href="/financeiro/comissoes"
                  title="Fechar comissões"
                  description="Pague repasses pendentes e registre a despesa no caixa."
                />
              ) : null}
              {canViewDespesas ? (
                <ShortcutCard
                  href="/financeiro/despesas"
                  title="Gerenciar despesas"
                  description="Cadastre custos fixos e variáveis integrados ao extrato do período."
                />
              ) : null}
              {canViewExtrato ? (
                <ShortcutCard
                  href="/financeiro/extrato"
                  title="Analisar extrato"
                  description="Filtre lançamentos por data, tipo e status."
                />
              ) : null}
              {canViewCaixa ? (
                <ShortcutCard
                  href="/financeiro/caixa"
                  title="Operar caixa"
                  description="Abra, acompanhe e feche a sessão atual do caixa."
                />
              ) : null}
            </CardContent>
          </Card>
        </ScrollReveal>
      </section>
    </div>
  );
}

function SummaryMetricCard({
  delay,
  label,
  value,
  note,
  icon: Icon,
  accent,
  iconWrapperClass,
  trend,
}: {
  delay: number;
  label: string;
  value: string;
  note: string;
  icon: ComponentType<{ className?: string }>;
  accent?: string;
  iconWrapperClass?: string;
  trend?: ReactNode;
}) {
  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            iconWrapperClass ?? "bg-muted"
          }`}
        >
          <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold tabular-nums ${accent ?? ""}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        {trend ? <div className="mt-2">{trend}</div> : null}
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
      className="rounded-xl border bg-muted/15 p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] hover:border-primary/35 hover:bg-primary/5"
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
