"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { toast } from "sonner";

import { createCommissionPayoutAction } from "@/actions/commission-payouts.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PayableCommission } from "@/services/commission-payout.service";

import type { AccountOption } from "./commission-payout-toolbar";
import { useCommissionSelection } from "./commission-selection-provider";

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  commissionIds: string[];
  commissions: PayableCommission[];
  accounts: AccountOption[];
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

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CommissionPayoutDialog({
  open,
  onOpenChange,
  commissionIds,
  commissions,
  accounts,
}: Props) {
  const router = useRouter();
  const { clear } = useCommissionSelection();
  const [isPending, startTransition] = useTransition();

  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [paidAtInput, setPaidAtInput] = useState(() => toDateInputValue(new Date()));
  const [notes, setNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const summary = useMemo(() => {
    const total = commissions.reduce((sum, c) => sum + c.commissionValue, 0);
    const professionalName = commissions[0]?.professionalName ?? "";
    const times = commissions
      .map((c) => parseISO(c.occurredAt).getTime())
      .sort((a, b) => a - b);
    return {
      professionalName,
      total: Math.round(total * 100) / 100,
      periodStart: times[0] ? new Date(times[0]) : null,
      periodEnd: times[times.length - 1] ? new Date(times[times.length - 1]!) : null,
    };
  }, [commissions]);

  const accountOptions = useMemo(
    () =>
      accounts.map((acc) => ({
        value: acc.id,
        label: `${acc.name} (${translateAccountType(acc.type)})`,
      })),
    [accounts]
  );

  const hasAccounts = accounts.length > 0;
  const paidAtDate = paidAtInput
    ? new Date(`${paidAtInput}T12:00:00`)
    : new Date();
  const todayOnly = (() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  })();
  const pickedDay = new Date(
    paidAtDate.getFullYear(),
    paidAtDate.getMonth(),
    paidAtDate.getDate()
  );
  const isFutureDate = pickedDay.getTime() > todayOnly.getTime();

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setNotes("");
      setShowDetails(false);
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    if (!hasAccounts) return;
    if (!accountId) {
      toast.error("Selecione a conta financeira de saída.");
      return;
    }

    startTransition(async () => {
      const result = await createCommissionPayoutAction({
        commissionIds,
        financialAccountId: accountId,
        paidAt: paidAtDate.toISOString(),
        notes: notes.trim() ? notes.trim() : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `Acerto fechado! ${commissionIds.length} comissão(ões) pagas para ${summary.professionalName}.`
      );
      clear();
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fechar acerto — {summary.professionalName}</DialogTitle>
          <DialogDescription>
            Ao confirmar, as comissões serão marcadas como pagas e uma despesa
            será registrada na conta selecionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Período:{" "}
                {summary.periodStart && summary.periodEnd ? (
                  summary.periodStart.toDateString() ===
                  summary.periodEnd.toDateString() ? (
                    format(summary.periodEnd, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    <>
                      {format(summary.periodStart, "dd/MM", { locale: ptBR })} a{" "}
                      {format(summary.periodEnd, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  )
                ) : (
                  "—"
                )}
              </span>
              <span>{commissionIds.length} comissão(ões)</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">
              {formatCurrency(summary.total)}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails((v) => !v)}
            className="h-8 gap-1.5 px-2 text-xs"
          >
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {showDetails ? "Ocultar comissões" : "Ver comissões incluídas"}
          </Button>

          {showDetails ? (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border bg-background p-2 text-xs">
              {commissions.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    <span className="text-muted-foreground tabular-nums">
                      {formatShortDate(c.occurredAt)}
                    </span>{" "}
                    — {c.serviceDescription} ({c.customerName})
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(c.commissionValue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {!hasAccounts ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Nenhuma conta financeira ativa. Crie uma conta antes de fechar
                acertos.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="payout-account">
                Conta financeira de saída
              </label>
              <Select
                value={accountId}
                onValueChange={(value) => setAccountId(value ?? "")}
              >
                <SelectTrigger id="payout-account" className="w-full">
                  <SelectValueLabel
                    value={accountId}
                    options={accountOptions}
                    placeholder="Selecione a conta"
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({translateAccountType(acc.type)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="payout-date">
              Data do pagamento
            </label>
            <Input
              id="payout-date"
              type="date"
              value={paidAtInput}
              onChange={(event) => setPaidAtInput(event.target.value)}
            />
            {isFutureDate ? (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <Info className="h-3 w-3" aria-hidden="true" />
                Data futura — a transação será registrada no dia selecionado.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="payout-notes">
              Observações <span className="text-xs text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="payout-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ex: pagamento via PIX, recibo nº 12"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending || !hasAccounts || !accountId || summary.total <= 0
            }
            className={cn("gap-1.5")}
          >
            {isPending ? "Processando…" : "Confirmar acerto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
