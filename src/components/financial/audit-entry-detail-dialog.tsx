"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_LABELS,
  formatAuditFieldValue,
  labelForAuditField,
} from "@/lib/audit-labels";
import type { AuditLogEntry } from "@/services/audit.service";
import type { AuditEntityType } from "@/lib/audit";

type DiffMapLike = Record<string, { from: unknown; to: unknown }>;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function isDiffMap(value: unknown): value is DiffMapLike {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).every(
    (entry) =>
      entry !== null &&
      typeof entry === "object" &&
      "from" in (entry as object) &&
      "to" in (entry as object)
  );
}

function resolveEntityLabel(entityType: string) {
  return (
    AUDIT_ENTITY_LABELS[entityType as AuditEntityType] ?? entityType
  );
}

export function AuditEntryDetailDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: AuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do evento</DialogTitle>
          <DialogDescription>
            {entry
              ? `${AUDIT_ACTION_LABELS[entry.action] ?? entry.action} · ${resolveEntityLabel(entry.entityType)}`
              : "Selecione uma entrada para ver os detalhes."}
          </DialogDescription>
        </DialogHeader>

        {entry ? (
          <div className="flex flex-col gap-4 text-sm">
            <div className="grid gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground sm:grid-cols-2">
              <div>
                <span className="block font-semibold text-foreground">Quando</span>
                {formatDateTime(entry.createdAt)}
              </div>
              <div>
                <span className="block font-semibold text-foreground">Quem</span>
                {entry.userName}
              </div>
              <div>
                <span className="block font-semibold text-foreground">Entidade</span>
                {resolveEntityLabel(entry.entityType)} ·{" "}
                <code className="text-[11px]">{entry.entityId}</code>
              </div>
              <div>
                <span className="block font-semibold text-foreground">Ação</span>
                <Badge variant="outline">
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                </Badge>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase text-muted-foreground">
                Resumo
              </span>
              <p className="mt-1">{entry.summary}</p>
            </div>

            {isDiffMap(entry.changes) && Object.keys(entry.changes).length > 0 ? (
              <div>
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  Mudanças
                </span>
                <div className="mt-2 overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="p-2 font-medium">Campo</th>
                        <th className="p-2 font-medium">De</th>
                        <th className="p-2 font-medium">Para</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(entry.changes).map(([field, diff]) => (
                        <tr key={field} className="border-b last:border-0">
                          <td className="p-2 font-medium">
                            {labelForAuditField(field)}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {formatAuditFieldValue(field, diff.from)}
                          </td>
                          <td className="p-2">
                            {formatAuditFieldValue(field, diff.to)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {entry.snapshot ? (
              <details className="rounded-lg border p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase text-muted-foreground">
                  Snapshot
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-muted/30 p-2 text-[11px]">
                  {JSON.stringify(entry.snapshot, null, 2)}
                </pre>
              </details>
            ) : null}

            {entry.metadata ? (
              <details className="rounded-lg border p-3">
                <summary className="cursor-pointer text-xs font-semibold uppercase text-muted-foreground">
                  Metadados
                </summary>
                <pre className="mt-2 overflow-x-auto rounded bg-muted/30 p-2 text-[11px]">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
