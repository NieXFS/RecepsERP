"use client";

import { AlertTriangle, CalendarCheck2, CalendarClock, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ExpensesAgenda, MonthlyExpense } from "@/services/expense.service";
import {
  ExpenseAgendaCard,
  type AgendaColumnKind,
} from "@/components/financial/expense-agenda-card";

export type ExpenseAgendaViewProps = {
  agenda: ExpensesAgenda;
  accounts: Array<{ id: string; name: string; type: string }>;
  canEdit: boolean;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function sumAmount(expenses: MonthlyExpense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

type ColumnConfig = {
  key: AgendaColumnKind;
  title: string;
  icon: typeof AlertTriangle;
  headerClass: string;
  iconClass: string;
  badgeClass: string;
  emptyMessage: string;
};

const COLUMNS: ColumnConfig[] = [
  {
    key: "overdue",
    title: "Atrasadas",
    icon: AlertTriangle,
    headerClass: "bg-red-500/10 text-red-700",
    iconClass: "text-red-600",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-700",
    emptyMessage: "Nenhuma despesa em atraso.",
  },
  {
    key: "dueToday",
    title: "Hoje",
    icon: CalendarClock,
    headerClass: "bg-amber-500/10 text-amber-700",
    iconClass: "text-amber-600",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    emptyMessage: "Nada vence hoje.",
  },
  {
    key: "dueNext7Days",
    title: "Próximos 7 dias",
    icon: CalendarCheck2,
    headerClass: "bg-blue-500/10 text-blue-700",
    iconClass: "text-blue-600",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-700",
    emptyMessage: "Sem vencimentos nos próximos dias.",
  },
  {
    key: "recentlyPaid",
    title: "Pagas recentemente",
    icon: CheckCircle2,
    headerClass: "bg-emerald-500/10 text-emerald-700",
    iconClass: "text-emerald-600",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    emptyMessage: "Nenhum pagamento nos últimos 14 dias.",
  },
];

export function ExpenseAgendaView({ agenda, accounts, canEdit }: ExpenseAgendaViewProps) {
  const allPendingEmpty =
    agenda.overdue.length === 0 &&
    agenda.dueToday.length === 0 &&
    agenda.dueNext7Days.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {allPendingEmpty ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="font-medium">Tudo em dia</p>
            <p className="text-xs text-emerald-700/80">
              Nenhuma despesa atrasada, vencendo hoje ou nos próximos 7 dias.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => {
          const expenses = agenda[column.key];
          const Icon = column.icon;
          const total = sumAmount(expenses);

          return (
            <Card key={column.key} className="flex h-full flex-col overflow-hidden">
              <CardHeader className={cn("gap-2 border-b py-3", column.headerClass)}>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className={cn("h-4 w-4", column.iconClass)} aria-hidden="true" />
                    {column.title}
                  </CardTitle>
                  <Badge variant="outline" className={cn("shrink-0 text-[10px]", column.badgeClass)}>
                    {expenses.length}
                  </Badge>
                </div>
                <p className="text-xs font-medium tabular-nums">
                  {formatCurrency(total)}
                </p>
              </CardHeader>
              <CardContent className="flex-1 p-3">
                {expenses.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    {column.emptyMessage}
                  </p>
                ) : (
                  <div
                    role="list"
                    aria-label={column.title}
                    className="flex flex-col gap-2"
                  >
                    {expenses.map((expense) => (
                      <ExpenseAgendaCard
                        key={expense.id}
                        expense={expense}
                        column={column.key}
                        accounts={accounts}
                        canEdit={canEdit}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
