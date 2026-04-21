"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronDown, ChevronUp, History, Inbox, Landmark, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PayoutHistoryItem } from "@/services/commission-payout.service";
import { AuditTimelineDialog } from "@/components/financial/audit-timeline-dialog";

type Props = {
  payouts: PayoutHistoryItem[];
  highlightId?: string | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatShortDate(iso: string) {
  try {
    return format(parseISO(iso), "dd/MM", { locale: ptBR });
  } catch {
    return iso;
  }
}

function formatFullDate(iso: string) {
  try {
    return format(parseISO(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return iso;
  }
}

function translateAccountType(type: string) {
  switch (type) {
    case "CASH":
      return "Caixa";
    case "BANK":
      return "Banco";
    default:
      return type;
  }
}

export function PayoutHistoryView({ payouts, highlightId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(
    highlightId ?? null
  );
  const [auditPayoutId, setAuditPayoutId] = useState<string | null>(null);

  if (payouts.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold">Nenhum acerto fechado ainda</p>
            <p className="text-sm text-muted-foreground">
              Selecione comissões pendentes e feche o primeiro acerto na aba ao lado.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-3">
      {payouts.map((payout) => {
        const isExpanded = expandedId === payout.id;
        const isHighlighted = highlightId === payout.id;
        return (
          <Card
            key={payout.id}
            className={cn(
              "overflow-hidden transition-all",
              isHighlighted && "ring-2 ring-primary/40"
            )}
          >
            <button
              type="button"
              onClick={() =>
                setExpandedId((current) => (current === payout.id ? null : payout.id))
              }
              className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30"
              aria-expanded={isExpanded}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatFullDate(payout.paidAt)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {payout.commissionCount} comissão(ões)
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" aria-hidden="true" />
                    {payout.professional.name}
                  </span>
                  {payout.financialAccount ? (
                    <span className="inline-flex items-center gap-1">
                      <Landmark className="h-3 w-3" aria-hidden="true" />
                      {payout.financialAccount.name} (
                      {translateAccountType(payout.financialAccount.type)})
                    </span>
                  ) : null}
                  <span>
                    Período:{" "}
                    {formatShortDate(payout.periodStart)} a{" "}
                    {formatShortDate(payout.periodEnd)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-amber-600 tabular-nums dark:text-amber-400">
                  {formatCurrency(payout.totalAmount)}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </button>

            {isExpanded ? (
              <CardContent className="border-t bg-muted/10 p-4">
                {payout.notes ? (
                  <p className="mb-3 text-xs italic text-muted-foreground">
                    {payout.notes}
                  </p>
                ) : null}
                <ul className="space-y-1 text-xs">
                  {payout.commissions.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-muted-foreground tabular-nums">
                          {formatShortDate(c.occurredAt)}
                        </span>{" "}
                        <span className="font-medium">{c.serviceDescription}</span>{" "}
                        <span className="text-muted-foreground">
                          · {c.customerName}
                        </span>
                      </div>
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatCurrency(c.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between gap-2">
                  {payout.createdBy?.name ? (
                    <p className="text-[11px] text-muted-foreground">
                      Fechado por {payout.createdBy.name}
                    </p>
                  ) : <span />}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAuditPayoutId(payout.id);
                    }}
                  >
                    <History className="h-3.5 w-3.5" aria-hidden="true" />
                    Ver histórico
                  </Button>
                </div>
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
    <AuditTimelineDialog
      entityType="CommissionPayout"
      entityId={auditPayoutId}
      open={auditPayoutId !== null}
      onOpenChange={(open) => {
        if (!open) setAuditPayoutId(null);
      }}
    />
    </>
  );
}
