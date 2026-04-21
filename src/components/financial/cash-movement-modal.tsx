"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownToLine, ArrowUpToLine, Info } from "lucide-react";

import { recordCashMovementAction } from "@/actions/financial.actions";
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

export type CashMovementType = "WITHDRAWAL" | "REINFORCEMENT";

const WITHDRAWAL_REASONS = [
  "Depósito em banco",
  "Pagamento de fornecedor",
  "Retirada para conferência",
  "Troco para outro caixa",
  "Outro",
] as const;

const REINFORCEMENT_REASONS = [
  "Troco inicial do dia",
  "Aporte do proprietário",
  "Devolução de sangria",
  "Outro",
] as const;

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  type: CashMovementType;
  expectedBalance?: number;
};

export function CashMovementModal({
  open,
  onOpenChange,
  sessionId,
  type,
  expectedBalance,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isWithdrawal = type === "WITHDRAWAL";
  const reasonSuggestions = isWithdrawal ? WITHDRAWAL_REASONS : REINFORCEMENT_REASONS;

  const [amount, setAmount] = useState("");
  const [reasonPreset, setReasonPreset] = useState<string>(reasonSuggestions[0]);
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");

  const reasonOptions = useMemo(
    () => reasonSuggestions.map((value) => ({ value, label: value })),
    [reasonSuggestions]
  );

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setAmount("");
      setReasonPreset(reasonSuggestions[0]);
      setCustomReason("");
      setNotes("");
    }
    onOpenChange(nextOpen);
  }

  const isOtherReason = reasonPreset === "Outro";
  const effectiveReason = isOtherReason ? customReason.trim() : reasonPreset;
  const parsedAmount = Number(amount.replace(",", "."));
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const isReasonValid = effectiveReason.length > 0;

  const title = isWithdrawal ? "Registrar sangria" : "Registrar reforço";
  const description = isWithdrawal
    ? "Retirada de dinheiro do caixa (ex.: depósito em banco, pagamento em espécie, troco para outro caixa)."
    : "Entrada de dinheiro no caixa sem relação com uma venda (ex.: troco inicial, aporte do proprietário).";

  const accentClass = isWithdrawal
    ? "bg-red-500/10 text-red-700 dark:text-red-300"
    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";

  const willLeaveNegative =
    isWithdrawal &&
    isAmountValid &&
    typeof expectedBalance === "number" &&
    parsedAmount > expectedBalance;

  function handleSubmit() {
    if (!isAmountValid) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    if (!isReasonValid) {
      toast.error("Informe o motivo da movimentação.");
      return;
    }

    startTransition(async () => {
      const result = await recordCashMovementAction({
        sessionId,
        type,
        amount: parsedAmount,
        reason: effectiveReason,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isWithdrawal ? "Sangria registrada." : "Reforço registrado.");
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                accentClass
              )}
            >
              {isWithdrawal ? (
                <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowUpToLine className="h-4 w-4" aria-hidden="true" />
              )}
            </span>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="cash-movement-amount">
              Valor
            </label>
            <Input
              id="cash-movement-amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
            {willLeaveNegative ? (
              <p className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                O valor ultrapassa o saldo esperado ({formatCurrency(expectedBalance ?? 0)}). O
                caixa ficará negativo.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="cash-movement-reason">
              Motivo
            </label>
            <Select
              value={reasonPreset}
              onValueChange={(value) => setReasonPreset(value ?? reasonSuggestions[0])}
            >
              <SelectTrigger id="cash-movement-reason" className="w-full">
                <SelectValueLabel
                  value={reasonPreset}
                  options={reasonOptions}
                  placeholder="Selecione um motivo"
                />
              </SelectTrigger>
              <SelectContent>
                {reasonSuggestions.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isOtherReason ? (
              <Input
                className="mt-2"
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Descreva o motivo"
                maxLength={200}
              />
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="cash-movement-notes">
              Observação <span className="text-xs text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="cash-movement-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={
                isWithdrawal
                  ? "Ex.: envelope nº 12 enviado ao banco"
                  : "Ex.: troco em notas miúdas"
              }
              rows={2}
            />
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3 w-3" aria-hidden="true" />
              Esta movimentação não representa uma venda — ela ajusta o saldo do caixa e fica
              registrada no extrato da sessão.
            </p>
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
            disabled={isPending || !isAmountValid || !isReasonValid}
            variant={isWithdrawal ? "destructive" : "default"}
          >
            {isPending ? "Registrando…" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
