"use client";

import { LayoutGrid, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExpensesView = "table" | "agenda";

type ExpensesViewToggleProps = {
  value: ExpensesView;
  onChange: (next: ExpensesView) => void;
};

const OPTIONS: Array<{
  value: ExpensesView;
  label: string;
  icon: typeof Table2;
}> = [
  { value: "table", label: "Tabela", icon: Table2 },
  { value: "agenda", label: "Agenda", icon: LayoutGrid },
];

export function ExpensesViewToggle({ value, onChange }: ExpensesViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Alternar visão das despesas"
      className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
