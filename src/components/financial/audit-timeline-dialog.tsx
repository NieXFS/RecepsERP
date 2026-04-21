"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getEntityTimelineAction } from "@/actions/audit.actions";
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

export function AuditTimelineDialog({
  entityType,
  entityId,
  open,
  onOpenChange,
  title,
}: {
  entityType: AuditEntityType;
  entityId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!open || !entityId) return;
    startTransition(async () => {
      setError(null);
      try {
        const result = await getEntityTimelineAction(entityType, entityId);
        setEntries(result);
      } catch {
        setError("Não foi possível carregar o histórico.");
      }
    });
  }, [open, entityId, entityType]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {title ?? `Histórico · ${AUDIT_ENTITY_LABELS[entityType]}`}
            </DialogTitle>
            <DialogDescription>
              Linha do tempo das ações registradas para este item.
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Carregando histórico…
            </div>
          ) : error ? (
            <div className="py-6 text-center text-sm text-destructive">{error}</div>
          ) : entries.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum evento registrado ainda para este item.
            </div>
          ) : (
            <ol className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(entry);
                      setDetailOpen(true);
                    }}
                    className="flex w-full items-start gap-3 rounded-lg border bg-card p-3 text-left transition hover:border-primary/50 hover:bg-accent"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDateTime(entry.createdAt)}</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">
                          {entry.userName}
                        </span>
                        <Badge variant="outline" className="font-normal">
                          {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm font-medium">
                        {entry.summary}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>

      <AuditEntryDetailDialog
        entry={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
