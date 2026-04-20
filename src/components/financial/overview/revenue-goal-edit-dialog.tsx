"use client";

import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { setRevenueGoalAction } from "@/actions/revenue-goals.actions";
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

type TriggerVariant = "existing" | "empty";

type Props = {
  month: string;
  currentTarget: number | null;
  variant: TriggerVariant;
};

function formatMonthLabel(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1, 12, 0, 0, 0);
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildMonthOptions(anchor: string) {
  const [yearStr, monthStr] = anchor.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  const base = new Date(year, monthIndex, 1, 12, 0, 0, 0);
  const options: { value: string; label: string }[] = [];
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(base.getFullYear(), base.getMonth() + offset, 1, 12, 0, 0, 0);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: formatMonthLabel(value) });
  }
  return options;
}

function formatCurrencyInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const asNumber = Number(digits) / 100;
  return asNumber.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(display: string): number {
  const digits = display.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export function RevenueGoalEditTrigger({ month, currentTarget, variant }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "existing" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Editar meta
        </Button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Definir meta do mês
        </Button>
      )}
      <RevenueGoalEditDialog
        open={open}
        onOpenChange={setOpen}
        initialMonth={month}
        currentTarget={currentTarget}
      />
    </>
  );
}

function RevenueGoalEditDialog({
  open,
  onOpenChange,
  initialMonth,
  currentTarget,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initialMonth: string;
  currentTarget: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(initialMonth);
  const [amountDisplay, setAmountDisplay] = useState<string>(() =>
    currentTarget && currentTarget > 0
      ? currentTarget.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : ""
  );

  const monthOptions = useMemo(() => buildMonthOptions(initialMonth), [initialMonth]);

  const isEditing = currentTarget !== null && currentTarget > 0;
  const actionLabel = isEditing ? "Atualizar meta" : "Salvar meta";

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setMonth(initialMonth);
      setAmountDisplay(
        currentTarget && currentTarget > 0
          ? currentTarget.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : ""
      );
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit() {
    const targetAmount = parseCurrencyInput(amountDisplay);
    if (!targetAmount || targetAmount <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    startTransition(async () => {
      const result = await setRevenueGoalAction({
        month,
        targetAmount,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isEditing ? "Meta atualizada com sucesso." : "Meta salva com sucesso."
      );
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Atualizar meta de faturamento" : "Definir meta de faturamento"}
          </DialogTitle>
          <DialogDescription>
            A meta é usada para calcular ritmo diário, projeção de fechamento e o quanto falta até o fim do mês.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="revenue-goal-month">
              Mês
            </label>
            <Select value={month} onValueChange={(value) => setMonth(value ?? month)}>
              <SelectTrigger id="revenue-goal-month" className="w-full">
                <SelectValueLabel
                  value={month}
                  options={monthOptions}
                  placeholder="Selecione o mês"
                />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="revenue-goal-amount">
              Meta (R$)
            </label>
            <Input
              id="revenue-goal-amount"
              inputMode="numeric"
              placeholder="0,00"
              value={amountDisplay}
              onChange={(event) =>
                setAmountDisplay(formatCurrencyInput(event.target.value))
              }
            />
            <p className="text-[11px] text-muted-foreground">
              Dica: comece pelo faturamento médio dos últimos meses e ajuste conforme o ritmo do salão.
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
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Salvando..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
