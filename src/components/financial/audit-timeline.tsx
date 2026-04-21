"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
} from "@/lib/audit-labels";
import type { AuditLogEntry } from "@/services/audit.service";
import type { AuditEntityType } from "@/lib/audit";
import { AuditEntryDetailDialog } from "@/components/financial/audit-entry-detail-dialog";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function resolveEntityLabel(entityType: string) {
  return (
    AUDIT_ENTITY_LABELS[entityType as AuditEntityType] ?? entityType
  );
}

export function AuditTimeline({
  entries,
  nextCursor,
}: {
  entries: AuditLogEntry[];
  nextCursor: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [open, setOpen] = useState(false);

  function loadMore() {
    if (!nextCursor) return;
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("cursor", nextCursor);
    startTransition(() => {
      router.replace(`?${next.toString()}`);
    });
  }

  function openDetail(entry: AuditLogEntry) {
    setSelected(entry);
    setOpen(true);
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma entrada encontrada para os filtros atuais.
      </div>
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => openDetail(entry)}
              className="flex w-full items-start gap-4 rounded-xl border bg-card p-4 text-left transition hover:border-primary/50 hover:bg-accent"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDateTime(entry.createdAt)}</span>
                  <span>·</span>
                  <span className="font-medium text-foreground">
                    {entry.userName}
                  </span>
                  <span>·</span>
                  <Badge variant="outline" className="font-normal">
                    {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                  </Badge>
                  <Badge variant="secondary" className="font-normal">
                    {resolveEntityLabel(entry.entityType)}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm font-medium">{entry.summary}</p>
              </div>
            </button>
          </li>
        ))}
      </ol>

      {nextCursor ? (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      ) : null}

      <AuditEntryDetailDialog
        entry={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
