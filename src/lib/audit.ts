import type { Prisma } from "@/generated/prisma/client";
import type { AuditAction } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export type AuditActor = {
  userId: string | null;
  userName: string;
};

export type AuditEntityType =
  | "Transaction"
  | "Expense"
  | "CashSession"
  | "CashMovement"
  | "CommissionPayout"
  | "Commission"
  | "RevenueGoal";

export type RecordAuditInput = {
  tenantId: string;
  actor: AuditActor;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  summary: string;
  changes?: unknown;
  snapshot?: unknown;
  metadata?: unknown;
};

type AuditClient = Prisma.TransactionClient | typeof db;

/**
 * Registra uma entrada de auditoria dentro da mesma transação (quando `tx` é passado).
 * Fail-safe: erros de auditoria não propagam — apenas logam em stderr. Isso garante
 * que a operação principal nunca falha por problema na trilha de auditoria.
 */
export async function recordAudit(
  client: AuditClient,
  input: RecordAuditInput
): Promise<void> {
  try {
    await client.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.actor.userId,
        userNameSnapshot: input.actor.userName || "Sistema",
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        changes: sanitizeJson(input.changes),
        snapshot: sanitizeJson(input.snapshot),
        metadata: sanitizeJson(input.metadata),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", {
      error,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
    });
  }
}

export type DiffEntry = { from: unknown; to: unknown };
export type DiffMap = Record<string, DiffEntry>;

/**
 * Calcula o diff simples (campo por campo) entre dois snapshots. Retorna
 * `null` se nada mudou, o que permite pular o audit silenciosamente.
 */
export function computeDiff<T extends Record<string, unknown>>(
  before: T | null | undefined,
  after: T | null | undefined,
  fields: readonly (keyof T)[]
): DiffMap | null {
  if (!before && !after) return null;
  const diff: DiffMap = {};
  for (const field of fields) {
    const fromValue = before ? normalizeDiffValue(before[field]) : undefined;
    const toValue = after ? normalizeDiffValue(after[field]) : undefined;
    if (!valuesEqual(fromValue, toValue)) {
      diff[String(field)] = { from: fromValue, to: toValue };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}

/**
 * Constrói um `AuditActor` a partir do objeto de sessão autenticada.
 * Tolerante a user null (uso raro: jobs internos, webhooks).
 */
export function buildUserSnapshot(
  user: { id: string; name: string | null } | null | undefined
): AuditActor {
  if (!user) {
    return { userId: null, userName: "Sistema" };
  }
  return {
    userId: user.id,
    userName: user.name?.trim() || "Usuário sem nome",
  };
}

function sanitizeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  try {
    return JSON.parse(JSON.stringify(value, (_key, v) => {
      if (typeof v === "bigint") return v.toString();
      if (v && typeof v === "object" && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
        return (v as { toNumber: () => number }).toNumber();
      }
      return v;
    })) as Prisma.InputJsonValue;
  } catch {
    return undefined;
  }
}

function normalizeDiffValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a == null && b == null;
  if (typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}
