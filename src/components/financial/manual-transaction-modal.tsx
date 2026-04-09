"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createManualCashTransactionAction } from "@/actions/financial.actions";
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
import { PAYMENT_METHOD_OPTIONS, type PaymentMethodValue } from "@/lib/payment-methods";

type ManualTransactionType = "INCOME" | "EXPENSE";

const paymentMethodSelectOptions = PAYMENT_METHOD_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function ManualTransactionModal({
  open,
  onOpenChange,
  accountId,
  type,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  type: ManualTransactionType;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue>("CASH");

  const isIncome = type === "INCOME";
  const title = isIncome ? "Registrar Suprimento" : "Registrar Sangria";
  const actionLabel = isIncome ? "Salvar suprimento" : "Salvar sangria";
  const successLabel = isIncome ? "Suprimento registrado no caixa." : "Sangria registrada no caixa.";

  function resetForm() {
    setAmount("");
    setDescription("");
    setPaymentMethod("CASH");
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await createManualCashTransactionAction({
        accountId,
        type,
        amount: Number(amount || 0),
        description,
        paymentMethod,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(successLabel);
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Registre uma movimentacao manual vinculada ao caixa aberto atual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Valor</label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descricao</label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                isIncome
                  ? "Ex.: reforco de troco do turno da tarde"
                  : "Ex.: retirada para deposito bancario"
              }
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Meio de pagamento</label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod((value as PaymentMethodValue) ?? "CASH")}
            >
              <SelectTrigger className="w-full">
                <SelectValueLabel
                  value={paymentMethod}
                  options={paymentMethodSelectOptions}
                  placeholder="Selecione o meio"
                />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !accountId}
            variant={isIncome ? "default" : "destructive"}
          >
            {isPending ? "Salvando..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
