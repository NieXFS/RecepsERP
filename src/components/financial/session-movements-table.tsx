"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { cn } from "@/lib/utils";
import type {
  CashSessionMovement,
  CashSessionMovementKind,
} from "@/services/financial.service";

type FilterValue = "ALL" | "SALE" | "REINFORCEMENT" | "WITHDRAWAL" | "OTHER_EXPENSE";

const FILTERS: Array<{ value: FilterValue; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "SALE", label: "Vendas" },
  { value: "REINFORCEMENT", label: "Reforços" },
  { value: "WITHDRAWAL", label: "Sangrias" },
  { value: "OTHER_EXPENSE", label: "Outras" },
];

const TYPE_BADGE: Record<
  CashSessionMovementKind,
  { label: string; className: string }
> = {
  SALE: {
    label: "Venda",
    className: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  },
  REINFORCEMENT: {
    label: "Reforço",
    className: "border-sky-500/40 text-sky-700 dark:text-sky-300",
  },
  WITHDRAWAL: {
    label: "Sangria",
    className: "border-red-500/40 text-red-700 dark:text-red-300",
  },
  OTHER_EXPENSE: {
    label: "Outra saída",
    className: "border-border text-muted-foreground",
  },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatHour(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SessionMovementsTable({
  transactions,
}: {
  transactions: CashSessionMovement[];
}) {
  const [filter, setFilter] = useState<FilterValue>("ALL");

  const counts = useMemo(() => {
    const accumulator: Record<FilterValue, number> = {
      ALL: transactions.length,
      SALE: 0,
      REINFORCEMENT: 0,
      WITHDRAWAL: 0,
      OTHER_EXPENSE: 0,
    };
    for (const transaction of transactions) {
      accumulator[transaction.movementType] += 1;
    }
    return accumulator;
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") return transactions;
    return transactions.filter((transaction) => transaction.movementType === filter);
  }, [filter, transactions]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma movimentação foi registrada nesta sessão até o momento.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar movimentações">
        {FILTERS.map((option) => {
          const isActive = filter === option.value;
          const count = counts[option.value];
          const isDisabled = option.value !== "ALL" && count === 0;
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setFilter(option.value)}
              disabled={isDisabled}
              className="h-8 gap-1.5 rounded-full px-3 text-xs"
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhuma movimentação para este filtro.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 font-medium">Hora</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Descrição / Motivo</th>
                <th className="pb-2 font-medium">Forma de pagto</th>
                <th className="pb-2 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => {
                const badge = TYPE_BADGE[transaction.movementType];
                const isIncome = transaction.type === "INCOME";
                const primaryLabel =
                  transaction.movementType === "WITHDRAWAL" ||
                  transaction.movementType === "REINFORCEMENT"
                    ? transaction.cashMovementReason ?? transaction.description
                    : transaction.description;

                return (
                  <tr key={transaction.id} className="border-b last:border-0">
                    <td className="py-3 font-medium tabular-nums">
                      {formatHour(transaction.occurredAt)}
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className={cn("text-[10px]", badge.className)}>
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{primaryLabel}</span>
                        {(transaction.movementType === "WITHDRAWAL" ||
                          transaction.movementType === "REINFORCEMENT") &&
                        transaction.description &&
                        transaction.description !== primaryLabel ? (
                          <span className="text-xs text-muted-foreground">
                            {transaction.description}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3">
                      {PAYMENT_METHOD_LABELS[transaction.paymentMethod] ??
                        transaction.paymentMethod}
                    </td>
                    <td
                      className={cn(
                        "py-3 text-right font-medium tabular-nums",
                        isIncome ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
