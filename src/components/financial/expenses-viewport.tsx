"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  ExpensesViewToggle,
  type ExpensesView,
} from "@/components/financial/expenses-view-toggle";
import { ExpensePanel } from "@/components/financial/expense-panel";
import { ExpenseAgendaView } from "@/components/financial/expense-agenda-view";
import type {
  ExpenseCategoryListItem,
  ExpensesAgenda,
  MonthlyExpenseSummary,
} from "@/services/expense.service";

const STORAGE_KEY = "receps-despesas-view";

type AccountOption = { id: string; name: string; type: string };

export type ExpensesViewportProps = {
  summary: MonthlyExpenseSummary;
  agenda: ExpensesAgenda;
  categories: ExpenseCategoryListItem[];
  accounts: AccountOption[];
  canEdit: boolean;
};

function isExpensesView(value: string | null): value is ExpensesView {
  return value === "table" || value === "agenda";
}

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) onStoreChange();
  }
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): ExpensesView {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isExpensesView(stored) ? stored : "table";
  } catch {
    return "table";
  }
}

function getServerSnapshot(): ExpensesView {
  return "table";
}

function notify() {
  for (const listener of listeners) listener();
}

export function ExpensesViewport({
  summary,
  agenda,
  categories,
  accounts,
  canEdit,
}: ExpensesViewportProps) {
  const view = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const handleChange = useCallback((next: ExpensesView) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage indisponível — preferência não persistida
    }
    notify();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ExpensesViewToggle value={view} onChange={handleChange} />
      </div>

      {view === "table" ? (
        <ExpensePanel
          period={summary.period}
          summary={summary}
          categories={categories}
          canEdit={canEdit}
          accounts={accounts}
        />
      ) : (
        <ExpenseAgendaView agenda={agenda} accounts={accounts} canEdit={canEdit} />
      )}
    </div>
  );
}
