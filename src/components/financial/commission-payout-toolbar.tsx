"use client";

import { useMemo, useState } from "react";
import { DollarSign, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PayableCommission } from "@/services/commission-payout.service";

import { CommissionPayoutDialog } from "./commission-payout-dialog";
import { useCommissionSelection } from "./commission-selection-provider";

export type AccountOption = { id: string; name: string; type: string };

type Props = {
  commissions: PayableCommission[];
  accounts: AccountOption[];
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function CommissionPayoutToolbar({ commissions, accounts }: Props) {
  const { selectedIds, size, clear, selectedProfessionalId } =
    useCommissionSelection();
  const [dialogOpen, setDialogOpen] = useState(false);

  const summary = useMemo(() => {
    const selected = commissions.filter((c) => selectedIds.has(c.id));
    const total = selected.reduce((sum, c) => sum + c.commissionValue, 0);
    const professionalName = selected[0]?.professionalName ?? "";
    return {
      ids: selected.map((c) => c.id),
      total: Math.round(total * 100) / 100,
      professionalName,
    };
  }, [commissions, selectedIds]);

  if (size === 0) return null;

  return (
    <>
      <div
        role="region"
        aria-label="Seleção de comissões"
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex flex-wrap items-center gap-3 rounded-full border bg-popover px-4 py-2 text-sm shadow-lg sm:gap-4 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
              {size}
            </span>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-xs text-muted-foreground">
                {summary.professionalName || "Profissional"}
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(summary.total)}
              </span>
            </div>
            <span className="text-xs font-semibold tabular-nums sm:hidden">
              {formatCurrency(summary.total)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="gap-1.5"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="gap-1.5"
              disabled={summary.total <= 0}
            >
              <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
              Fechar acerto
            </Button>
          </div>
        </div>
      </div>

      {dialogOpen && selectedProfessionalId ? (
        <CommissionPayoutDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          commissionIds={summary.ids}
          commissions={commissions.filter((c) => selectedIds.has(c.id))}
          accounts={accounts}
        />
      ) : null}
    </>
  );
}
