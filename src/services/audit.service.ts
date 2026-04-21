import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/enums";
import type { AuditEntityType } from "@/lib/audit";

export type AuditLogEntry = {
  id: string;
  createdAt: string;
  userId: string | null;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary: string;
  changes: unknown;
  snapshot: unknown;
  metadata: unknown;
};

export type AuditLogFilters = {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  cursor?: string;
  limit?: number;
};

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function serializeAuditLog(
  record: {
    id: string;
    createdAt: Date;
    userId: string | null;
    userNameSnapshot: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    summary: string;
    changes: Prisma.JsonValue | null;
    snapshot: Prisma.JsonValue | null;
    metadata: Prisma.JsonValue | null;
  }
): AuditLogEntry {
  return {
    id: record.id,
    createdAt: record.createdAt.toISOString(),
    userId: record.userId,
    userName: record.userNameSnapshot,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    summary: record.summary,
    changes: record.changes,
    snapshot: record.snapshot,
    metadata: record.metadata,
  };
}

/**
 * Lista paginada de entradas de auditoria. Usa cursor-based pagination:
 * o chamador envia `cursor` (id da última entrada exibida) e recebe `nextCursor`
 * quando ainda há mais. O cursor respeita a ordem `createdAt desc, id desc`.
 */
export async function getAuditLogs(
  tenantId: string,
  filters: AuditLogFilters = {}
): Promise<{ entries: AuditLogEntry[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const where: Prisma.AuditLogWhereInput = {
    tenantId,
    ...(filters.entityType ? { entityType: filters.entityType } : {}),
    ...(filters.entityId ? { entityId: filters.entityId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          createdAt: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        }
      : {}),
  };

  const records = await db.auditLog.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(filters.cursor
      ? {
          cursor: { id: filters.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = records.length > limit;
  const visible = hasMore ? records.slice(0, limit) : records;

  return {
    entries: visible.map(serializeAuditLog),
    nextCursor: hasMore ? visible[visible.length - 1].id : null,
  };
}

/**
 * Timeline completa de uma entidade específica (ex: histórico de uma despesa).
 * Retorna até 200 entradas, ordem cronológica decrescente.
 */
export async function getEntityTimeline(
  tenantId: string,
  entityType: AuditEntityType,
  entityId: string
): Promise<AuditLogEntry[]> {
  const records = await db.auditLog.findMany({
    where: { tenantId, entityType, entityId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 200,
  });

  return records.map(serializeAuditLog);
}
