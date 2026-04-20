"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { CalendarClock, Loader2, Repeat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MonthlyExpense } from "@/services/expense.service";
import { markExpenseAsPaidAction } from "@/actions/expenses.actions";

export type AgendaColumnKind = "overdue" | "dueToday" | "dueNext7Days" | "recentlyPaid";

export type ExpenseAgendaCardProps = {
  expense: MonthlyExpense;
  column: AgendaColumnKind;
  accounts: Array<{ id: string; name: string; type: string }>;
  canEdit: boolean;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const RECURRENCE_LABELS: Record<MonthlyExpense["recurrence"], string> = {
  NONE: "Sem recorrência",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  YEARLY: "Anual",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: "Caixa",
  BANK: "Banco",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  PIX: "PIX",
  OTHER: "Outro",
};

function translateAccountType(type: string) {
  return ACCOUNT_TYPE_LABELS[type] ?? type;
}

function resolveRelativeLabel(column: AgendaColumnKind, expense: MonthlyExpense) {
  if (column === "recentlyPaid" && expense.paidAt) {
    return {
      text: `Pago em ${formatDateShort(expense.paidAt)}`,
      tone: "text-muted-foreground",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseISO(expense.dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(due, today);

  if (diff < 0) {
    const abs = Math.abs(diff);
    return {
      text: abs === 1 ? "Atrasada há 1 dia" : `Atrasada há ${abs} dias`,
      tone: "text-red-600",
    };
  }

  if (diff === 0) {
    return { text: "Vence hoje", tone: "text-amber-600" };
  }

  if (diff === 1) {
    return { text: "Amanhã", tone: "text-muted-foreground" };
  }

  return { text: `Em ${diff} dias`, tone: "text-muted-foreground" };
}

export function ExpenseAgendaCard({
  expense,
  column,
  accounts,
  canEdit,
}: ExpenseAgendaCardProps) {
  const router = useRouter();
  const [payOpen, setPayOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    if (expense.accountId && accounts.some((a) => a.id === expense.accountId)) {
      return expense.accountId;
    }
    return "__auto__";
  });
  const [isPending, startTransition] = useTransition();

  const relative = useMemo(() => resolveRelativeLabel(column, expense), [column, expense]);
  const isPaid = column === "recentlyPaid";

  function handleConfirmPayment() {
    startTransition(async () => {
      const accountId =
        selectedAccountId === "__auto__"
          ? undefined
          : selectedAccountId === "__none__"
            ? null
            : selectedAccountId;

      const result = await markExpenseAsPaidAction({
        expenseId: expense.id,
        accountId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Despesa registrada como paga.");
      setPayOpen(false);
      router.refresh();
    });
  }

  return (
    <div
      role="listitem"
      className={cn(
        "group flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm shadow-sm transition-colors",
        isPaid ? "border-emerald-200/60" : "border-border hover:border-border/80"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 truncate font-medium" title={expense.description}>
          {expense.description}
        </p>
        <Badge variant="outline" className="shrink-0 text-[10px]">
          {expense.category}
        </Badge>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p
          className={cn(
            "text-base font-semibold tabular-nums",
            isPaid ? "text-emerald-700" : "text-foreground"
          )}
        >
          {formatCurrency(expense.amount)}
        </p>
        {expense.recurrence !== "NONE" ? (
          <TooltipProvider delay={150}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className="inline-flex items-center text-muted-foreground"
                    aria-label={`Recorrente — ${RECURRENCE_LABELS[expense.recurrence]}`}
                  >
                    <Repeat className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                }
              />
              <TooltipContent>
                Recorrente — {RECURRENCE_LABELS[expense.recurrence]}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            relative.tone
          )}
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          {relative.text}
        </span>
        {!isPaid && canEdit ? (
          <Button
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setPayOpen(true)}
          >
            Pagar
          </Button>
        ) : null}
      </div>

      {canEdit ? (
        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pagamento</DialogTitle>
              <DialogDescription>
                A despesa será marcada como paga e uma saída será criada no
                extrato, vinculada à conta selecionada quando possível.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="rounded-xl border bg-muted/20 p-3">
                <p className="font-medium">{expense.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {expense.category} ·{" "}
                  {expense.type === "FIXED" ? "Fixa" : "Variável"}
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Conta financeira</span>
                <select
                  value={selectedAccountId}
                  onChange={(event) => setSelectedAccountId(event.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="__auto__">
                    Automático (caixa aberto / primeira conta ativa)
                  </option>
                  <option value="__none__">Sem conta vinculada</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({translateAccountType(account.type)})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setPayOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                disabled={isPending}
                onClick={handleConfirmPayment}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    Processando...
                  </>
                ) : (
                  "Confirmar pagamento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
