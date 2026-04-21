"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "@/lib/audit-labels";
import type { AuditAction } from "@/generated/prisma/enums";
import type { AuditEntityType } from "@/lib/audit";

export type AuditFiltersValue = {
  entityType?: AuditEntityType | "";
  action?: AuditAction | "";
  startDate?: string;
  endDate?: string;
};

export function AuditFilters({ initial }: { initial: AuditFiltersValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [entityType, setEntityType] = useState(initial.entityType ?? "");
  const [action, setAction] = useState(initial.action ?? "");
  const [startDate, setStartDate] = useState(initial.startDate ?? "");
  const [endDate, setEndDate] = useState(initial.endDate ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams?.toString() ?? "");

    const values: Record<string, string> = {
      entityType,
      action,
      startDate,
      endDate,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value.length > 0) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }
    next.delete("cursor");

    startTransition(() => {
      router.replace(`?${next.toString()}`);
    });
  }

  function handleReset() {
    setEntityType("");
    setAction("");
    setStartDate("");
    setEndDate("");
    startTransition(() => {
      router.replace("?");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 lg:grid-cols-5" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Entidade</label>
            <select
              name="entityType"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as AuditEntityType | "")}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todas</option>
              {Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Ação</label>
            <select
              name="action"
              value={action}
              onChange={(e) => setAction(e.target.value as AuditAction | "")}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Todas</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">De</label>
            <Input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Até</label>
            <Input
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1" disabled={isPending}>
              Aplicar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
