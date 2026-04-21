"use server";

import { requirePermission } from "@/lib/session";
import {
  getAuditLogs,
  getEntityTimeline,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/services/audit.service";
import type { AuditEntityType } from "@/lib/audit";
import type { AuditAction } from "@/generated/prisma/enums";

type ListAuditLogsInput = {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: string;
  endDate?: string;
  cursor?: string;
  limit?: number;
};

/**
 * Server Action: lista entradas de auditoria do tenant com filtros opcionais.
 * Retorna cursor para paginação progressiva.
 */
export async function getAuditLogsAction(
  input: ListAuditLogsInput = {}
): Promise<{ entries: AuditLogEntry[]; nextCursor: string | null }> {
  const session = await requirePermission("financeiro.auditoria", "view");

  const filters: AuditLogFilters = {
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    userId: input.userId,
    cursor: input.cursor,
    limit: input.limit,
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
  };

  return getAuditLogs(session.tenantId, filters);
}

/**
 * Server Action: timeline de uma entidade específica (Despesa X, Sessão Y, etc.).
 */
export async function getEntityTimelineAction(
  entityType: AuditEntityType,
  entityId: string
): Promise<AuditLogEntry[]> {
  const session = await requirePermission("financeiro.auditoria", "view");
  return getEntityTimeline(session.tenantId, entityType, entityId);
}
