"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PayableCommission } from "@/services/commission-payout.service";

import {
  CommissionPayoutToolbar,
  type AccountOption,
} from "./commission-payout-toolbar";
import { useCommissionSelection } from "./commission-selection-provider";

type Props = {
  commissions: PayableCommission[];
  accounts: AccountOption[];
  canPay: boolean;
};

type GroupedByProfessional = {
  professionalId: string;
  professionalName: string;
  commissions: PayableCommission[];
  total: number;
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

export function PendingCommissionsView({ commissions, accounts, canPay }: Props) {
  const grouped = useMemo<GroupedByProfessional[]>(() => {
    const map = new Map<string, GroupedByProfessional>();
    for (const c of commissions) {
      const existing = map.get(c.professionalId);
      if (existing) {
        existing.commissions.push(c);
        existing.total += c.commissionValue;
      } else {
        map.set(c.professionalId, {
          professionalId: c.professionalId,
          professionalName: c.professionalName,
          commissions: [c],
          total: c.commissionValue,
        });
      }
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      total: Math.round(g.total * 100) / 100,
    }));
  }, [commissions]);

  if (grouped.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold">Tudo em dia</p>
            <p className="text-sm text-muted-foreground">
              Nenhuma comissão pendente aguardando acerto.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 pb-28">
        {grouped.map((group) => (
          <ProfessionalGroup key={group.professionalId} group={group} canPay={canPay} />
        ))}
      </div>
      <CommissionPayoutToolbar commissions={commissions} accounts={accounts} />
    </>
  );
}

function ProfessionalGroup({
  group,
  canPay,
}: {
  group: GroupedByProfessional;
  canPay: boolean;
}) {
  const { selectMany, toggle, isSelected, selectedProfessionalId, selectedIds } =
    useCommissionSelection();

  const pendingIds = useMemo(
    () => group.commissions.map((c) => c.id),
    [group.commissions]
  );

  const isGroupFullySelected = useMemo(() => {
    if (pendingIds.length === 0) return false;
    return pendingIds.every((id) => selectedIds.has(id));
  }, [pendingIds, selectedIds]);

  const disabledSelectAll =
    !canPay ||
    (selectedProfessionalId !== null &&
      selectedProfessionalId !== group.professionalId);

  function handleSelectAll() {
    if (isGroupFullySelected) {
      for (const id of pendingIds) {
        if (selectedIds.has(id)) toggle(id, group.professionalId);
      }
    } else {
      selectMany(pendingIds, group.professionalId);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {group.professionalName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{group.professionalName}</p>
              <p className="text-xs text-muted-foreground">
                {group.commissions.length} pendente(s) · total{" "}
                {formatCurrency(group.total)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabledSelectAll}
          >
            {isGroupFullySelected
              ? "Desmarcar todas"
              : `Selecionar todas (${group.commissions.length})`}
          </Button>
        </div>

        <ul className="divide-y">
          {group.commissions.map((commission) => {
            const selected = isSelected(commission.id);
            const disableRow =
              !canPay ||
              (selectedProfessionalId !== null &&
                selectedProfessionalId !== group.professionalId &&
                !selected);

            return (
              <li
                key={commission.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 px-4 py-3 text-sm transition-colors",
                  selected && "bg-primary/5",
                  disableRow && "opacity-50"
                )}
              >
                <input
                  type="checkbox"
                  aria-label={`Selecionar comissão ${commission.serviceDescription}`}
                  checked={selected}
                  onChange={() =>
                    toggle(commission.id, commission.professionalId)
                  }
                  disabled={disableRow}
                  className="h-4 w-4 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed"
                />
                <div className="w-14 text-xs text-muted-foreground tabular-nums">
                  {formatShortDate(commission.occurredAt)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {commission.serviceDescription}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {commission.customerName}
                  </p>
                </div>
                <div className="hidden w-24 text-right text-xs text-muted-foreground tabular-nums sm:block">
                  {formatCurrency(commission.serviceAmount)}
                </div>
                <Badge
                  variant="outline"
                  className="hidden text-[10px] sm:inline-flex"
                >
                  {commission.commissionRate}%
                </Badge>
                <div className="w-24 text-right font-semibold text-amber-600 tabular-nums dark:text-amber-400">
                  {formatCurrency(commission.commissionValue)}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
