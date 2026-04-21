"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { CASH_HISTORY_DEFAULT_LIMIT } from "@/lib/cash-history-filters";

type AccountOption = {
  id: string;
  name: string;
};

type Props = {
  accounts: AccountOption[];
  initialAccountId: string;
  initialFromInput: string;
  initialToInput: string;
  initialLimit: number;
};

const ALL_VALUE = "__all__";

export function CashHistoryFilters({
  accounts,
  initialAccountId,
  initialFromInput,
  initialToInput,
  initialLimit,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [accountId, setAccountId] = useState(initialAccountId || ALL_VALUE);
  const [fromInput, setFromInput] = useState(initialFromInput);
  const [toInput, setToInput] = useState(initialToInput);

  const accountOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: "Todas as contas" },
      ...accounts.map((account) => ({ value: account.id, label: account.name })),
    ],
    [accounts]
  );

  function applyFilters() {
    const params = new URLSearchParams();
    if (accountId && accountId !== ALL_VALUE) params.set("account", accountId);
    if (fromInput) params.set("from", fromInput);
    if (toInput) params.set("to", toInput);
    if (initialLimit !== CASH_HISTORY_DEFAULT_LIMIT) {
      params.set("limit", String(initialLimit));
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function clearFilters() {
    setAccountId(ALL_VALUE);
    setFromInput("");
    setToInput("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const isCustomized =
    (initialAccountId && initialAccountId.length > 0) ||
    initialFromInput.length > 0 ||
    initialToInput.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-muted/10 p-3 md:flex-row md:flex-wrap md:items-end">
      <div className="flex flex-1 flex-col gap-1 md:max-w-xs">
        <label className="text-xs font-medium text-muted-foreground">Conta</label>
        <Select
          value={accountId}
          onValueChange={(value) => setAccountId(value ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-full">
            <SelectValueLabel
              value={accountId}
              options={accountOptions}
              placeholder="Todas as contas"
            />
          </SelectTrigger>
          <SelectContent>
            {accountOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">De</label>
        <Input
          type="date"
          value={fromInput}
          onChange={(event) => setFromInput(event.target.value)}
          className="md:w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Até</label>
        <Input
          type="date"
          value={toInput}
          onChange={(event) => setToInput(event.target.value)}
          className="md:w-40"
        />
      </div>

      <div className="flex gap-2 md:ml-auto">
        <Button
          type="button"
          size="sm"
          onClick={applyFilters}
          disabled={isPending}
          className="gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
          Aplicar
        </Button>
        {isCustomized ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={clearFilters}
            disabled={isPending}
            className="gap-1.5"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
