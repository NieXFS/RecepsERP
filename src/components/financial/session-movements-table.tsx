"use client";

import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import type { CashSessionMovement } from "@/services/financial.service";

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
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma movimentacao foi registrada nesta sessao ate o momento.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Hora</th>
            <th className="pb-2 font-medium">Descricao</th>
            <th className="pb-2 font-medium">Forma de Pagto</th>
            <th className="pb-2 font-medium">Tipo</th>
            <th className="pb-2 font-medium text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="border-b last:border-0">
              <td className="py-3 font-medium">{formatHour(transaction.occurredAt)}</td>
              <td className="py-3">{transaction.description}</td>
              <td className="py-3">
                {PAYMENT_METHOD_LABELS[transaction.paymentMethod] ?? transaction.paymentMethod}
              </td>
              <td className="py-3">
                <Badge
                  variant="outline"
                  className={
                    transaction.type === "INCOME"
                      ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/40 text-red-700 dark:text-red-300"
                  }
                >
                  {transaction.type === "INCOME" ? "Entrada" : "Saida"}
                </Badge>
              </td>
              <td
                className={`py-3 text-right font-medium ${
                  transaction.type === "INCOME" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {transaction.type === "INCOME" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
