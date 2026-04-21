import { getAuthUserForPermission } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuditLogs } from "@/services/audit.service";
import { AuditFilters } from "@/components/financial/audit-filters";
import { AuditTimeline } from "@/components/financial/audit-timeline";
import type { AuditEntityType } from "@/lib/audit";
import type { AuditAction } from "@/generated/prisma/enums";

const ENTITY_VALUES: AuditEntityType[] = [
  "Transaction",
  "Expense",
  "CashSession",
  "CashMovement",
  "CommissionPayout",
  "Commission",
  "RevenueGoal",
];

const ACTION_VALUES: AuditAction[] = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "PAYMENT_MARKED",
  "CASH_OPENED",
  "CASH_CLOSED",
  "COMMISSION_PAID",
  "PAYOUT_CREATED",
  "CASH_WITHDRAWAL",
  "CASH_REINFORCEMENT",
  "GOAL_SET",
];

function parseEntityType(value?: string | string[]): AuditEntityType | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && ENTITY_VALUES.includes(v as AuditEntityType)
    ? (v as AuditEntityType)
    : undefined;
}

function parseAction(value?: string | string[]): AuditAction | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && ACTION_VALUES.includes(v as AuditAction)
    ? (v as AuditAction)
    : undefined;
}

function parseDate(value?: string | string[]): Date | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  const date = new Date(v);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseCursor(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<{
    entityType?: string | string[];
    action?: string | string[];
    startDate?: string | string[];
    endDate?: string | string[];
    cursor?: string | string[];
  }>;
}) {
  const user = await getAuthUserForPermission("financeiro.auditoria", "view");
  const query = searchParams ? await searchParams : undefined;

  const entityType = parseEntityType(query?.entityType);
  const action = parseAction(query?.action);
  const startDate = parseDate(query?.startDate);
  const endDate = parseDate(query?.endDate);
  const cursor = parseCursor(query?.cursor);

  const adjustedEndDate = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
    : undefined;

  const { entries, nextCursor } = await getAuditLogs(user.tenantId, {
    entityType,
    action,
    startDate,
    endDate: adjustedEndDate,
    cursor,
    limit: 25,
  });

  const startDateString = Array.isArray(query?.startDate)
    ? query?.startDate[0]
    : query?.startDate;
  const endDateString = Array.isArray(query?.endDate)
    ? query?.endDate[0]
    : query?.endDate;

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-fade-in-down">
        <h2 className="text-xl font-semibold tracking-tight">Auditoria financeira</h2>
        <p className="text-muted-foreground">
          Trilha de ações nos módulos de caixa, comissões, despesas, metas e pagamentos.
        </p>
      </div>

      <AuditFilters
        key={`${entityType ?? ""}|${action ?? ""}|${startDateString ?? ""}|${endDateString ?? ""}`}
        initial={{
          entityType: entityType ?? "",
          action: action ?? "",
          startDate: startDateString,
          endDate: endDateString,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Eventos {entries.length > 0 ? `(${entries.length}${nextCursor ? "+" : ""})` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTimeline entries={entries} nextCursor={nextCursor} />
        </CardContent>
      </Card>
    </div>
  );
}
