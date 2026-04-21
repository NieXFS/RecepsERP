"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  Download,
  History,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { getCashSessionDetailAction } from "@/actions/financial.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SessionMovementsTable } from "@/components/financial/session-movements-table";
import { AuditTimelineDialog } from "@/components/financial/audit-timeline-dialog";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";
import type { CashSessionDetail } from "@/services/financial.service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CashSessionDetailDialog({ open, onOpenChange, sessionId }: Props) {
  const [cache, setCache] = useState<{
    sessionId: string;
    detail: CashSessionDetail | null;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (!open || !sessionId) return;

    let cancelled = false;
    startTransition(async () => {
      const result = await getCashSessionDetailAction(sessionId);
      if (cancelled) return;
      setCache({ sessionId, detail: result ?? null });
    });

    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  const detail =
    cache && cache.sessionId === sessionId && cache.detail ? cache.detail : null;
  const notFound =
    cache != null && cache.sessionId === sessionId && cache.detail == null;

  function handleDownload() {
    if (!detail) return;
    window.location.assign(
      `/api/financeiro/export/cash-session?sessionId=${encodeURIComponent(detail.id)}&format=csv`
    );
  }

  const showSkeleton =
    open && sessionId !== null && (isPending || !detail) && !notFound;
  const isOpen = detail?.status === "OPEN";

  const differenceAbs = detail?.difference != null ? Math.abs(detail.difference) : 0;
  const differenceThreshold = detail ? Math.max(detail.expectedBalance * 0.05, 50) : 0;
  const showDifferenceBadge =
    detail != null && detail.difference != null && differenceAbs > differenceThreshold;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <DialogTitle>Detalhe da sessão de caixa</DialogTitle>
              <DialogDescription>
                {detail
                  ? `${detail.accountName} · Abertura ${formatDateTime(detail.openedAt)}`
                  : "Carregando informações da sessão…"}
              </DialogDescription>
            </div>
            {detail ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="gap-1.5"
                >
                  <History className="h-4 w-4" aria-hidden="true" />
                  Ver histórico
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Z em CSV
                </Button>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        {showSkeleton ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-16 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-40 animate-pulse rounded-xl bg-muted/40" />
          </div>
        ) : notFound ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Sessão não encontrada.
          </div>
        ) : detail ? (
          <div className="flex flex-col gap-4">
            {isOpen ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50/60 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Sessão ainda em andamento. O Z exportado será parcial e os totais podem
                  mudar até o fechamento.
                </span>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <InfoLine label="Status" value={isOpen ? "Aberto" : "Fechado"} />
              <InfoLine
                label="Responsáveis"
                value={
                  detail.closedByName
                    ? `${detail.openedByName} → ${detail.closedByName}`
                    : detail.openedByName
                }
              />
              <InfoLine label="Abertura" value={formatDateTime(detail.openedAt)} />
              <InfoLine label="Fechamento" value={formatDateTime(detail.closedAt)} />
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <KpiBlock
                label="Vendas"
                value={formatCurrency(detail.totalSales)}
                icon={<ShoppingBag className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-emerald-600 dark:text-emerald-400"
                wrapperClass="bg-emerald-500/10"
              />
              <KpiBlock
                label="Reforços"
                value={formatCurrency(detail.totalReinforcements)}
                icon={<ArrowUpToLine className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-sky-600 dark:text-sky-400"
                wrapperClass="bg-sky-500/10"
              />
              <KpiBlock
                label="Sangrias"
                value={formatCurrency(detail.totalWithdrawals)}
                icon={<ArrowDownToLine className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-red-600 dark:text-red-400"
                wrapperClass="bg-red-500/10"
              />
              <KpiBlock
                label="Saldo esperado"
                value={formatCurrency(detail.expectedBalance)}
                icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
                accentClass="text-primary"
                wrapperClass="bg-primary/10"
                highlight
              />
            </div>

            <div className="rounded-xl border bg-muted/10 p-3 text-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Composição do saldo esperado
              </p>
              <dl className="mt-2 space-y-1">
                <CompositionRow
                  label="Valor inicial"
                  value={formatCurrency(detail.openingAmount)}
                />
                <CompositionRow
                  label="+ Vendas"
                  value={formatCurrency(detail.totalSales)}
                  accent="text-emerald-600 dark:text-emerald-400"
                />
                <CompositionRow
                  label="+ Reforços"
                  value={formatCurrency(detail.totalReinforcements)}
                  accent="text-sky-600 dark:text-sky-400"
                />
                <CompositionRow
                  label="− Sangrias"
                  value={`-${formatCurrency(detail.totalWithdrawals)}`}
                  accent="text-red-600 dark:text-red-400"
                />
                {detail.totalOtherExpenses > 0 ? (
                  <CompositionRow
                    label="− Outras saídas"
                    value={`-${formatCurrency(detail.totalOtherExpenses)}`}
                    accent="text-muted-foreground"
                  />
                ) : null}
                <div className="border-t pt-1.5">
                  <CompositionRow
                    label="= Saldo esperado"
                    value={formatCurrency(detail.expectedBalance)}
                    emphasize
                  />
                </div>
                {detail.closingAmount != null ? (
                  <>
                    <CompositionRow
                      label="Apurado"
                      value={formatCurrency(detail.closingAmount)}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Diferença</span>
                      <span className="flex items-center gap-2 font-medium tabular-nums">
                        <span
                          className={cn(
                            detail.difference === 0
                              ? "text-muted-foreground"
                              : (detail.difference ?? 0) > 0
                                ? "text-emerald-600"
                                : "text-red-600"
                          )}
                        >
                          {formatCurrency(detail.difference ?? 0)}
                        </span>
                        {showDifferenceBadge ? (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-[10px] text-amber-700 dark:text-amber-300"
                          >
                            Acima do tolerado
                          </Badge>
                        ) : null}
                      </span>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>

            <div className="rounded-xl border bg-muted/10 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vendas por forma de pagamento
              </p>
              {detail.salesByPaymentMethod.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Nenhuma venda nesta sessão.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {detail.salesByPaymentMethod.map((row) => (
                    <li key={row.paymentMethod} className="flex items-center justify-between">
                      <span>
                        {PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({row.count})
                        </span>
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(row.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Movimentações
              </p>
              <SessionMovementsTable transactions={detail.movements} />
            </div>

            {detail.openingNotes || detail.closingNotes ? (
              <div className="rounded-xl border bg-muted/10 p-3 text-sm text-muted-foreground">
                {detail.openingNotes ? (
                  <p>
                    <span className="font-medium text-foreground">
                      Observação de abertura:
                    </span>{" "}
                    {detail.openingNotes}
                  </p>
                ) : null}
                {detail.closingNotes ? (
                  <p className={detail.openingNotes ? "mt-1" : undefined}>
                    <span className="font-medium text-foreground">
                      Observação de fechamento:
                    </span>{" "}
                    {detail.closingNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    <AuditTimelineDialog
      entityType="CashSession"
      entityId={sessionId}
      open={historyOpen}
      onOpenChange={setHistoryOpen}
    />
    </>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/40 p-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}

function KpiBlock({
  label,
  value,
  icon,
  accentClass,
  wrapperClass,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accentClass: string;
  wrapperClass: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        highlight ? "border-primary/30 bg-primary/5" : "bg-muted/10"
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md",
            wrapperClass,
            accentClass
          )}
        >
          {icon}
        </span>
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      </div>
      <p
        className={cn(
          "mt-1.5 text-base font-semibold tabular-nums",
          highlight ? "text-primary" : ""
        )}
      >
        {value}
      </p>
    </div>
  );
}

function CompositionRow({
  label,
  value,
  accent,
  emphasize = false,
}: {
  label: string;
  value: string;
  accent?: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn("text-muted-foreground", emphasize && "font-semibold text-foreground")}>
        {label}
      </dt>
      <dd
        className={cn(
          "font-medium tabular-nums",
          emphasize && "text-foreground",
          accent
        )}
      >
        {value}
      </dd>
    </div>
  );
}
