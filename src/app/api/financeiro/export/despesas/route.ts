import { NextRequest } from "next/server";
import { parseCivilMonthFromQuery } from "@/lib/civil-date";
import { getExpensesDetailed } from "@/services/financial.service";
import type { ExportColumn, ExportPayload, ExportRowValue } from "@/lib/financial-export";
import {
  authorizeExport,
  parseExportFormat,
  respondWithExport,
} from "../_shared";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  OVERDUE: "Vencida",
  CANCELLED: "Cancelada",
};

const TYPE_LABELS: Record<string, string> = {
  FIXED: "Fixa",
  VARIABLE: "Variável",
};

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "—",
  MONTHLY: "Mensal",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  YEARLY: "Anual",
};

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function GET(request: NextRequest) {
  const auth = await authorizeExport("financeiro.despesas", "view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const format = parseExportFormat(url.searchParams.get("format"));

  const period = parseCivilMonthFromQuery(
    url.searchParams.get("month") ?? undefined,
    url.searchParams.get("year") ?? undefined
  );

  const statusParam = url.searchParams.get("status") ?? "ALL";
  const status =
    statusParam === "PENDING" ||
    statusParam === "PAID" ||
    statusParam === "OVERDUE" ||
    statusParam === "CANCELLED"
      ? statusParam
      : "ALL";

  const typeParam = url.searchParams.get("type") ?? "ALL";
  const type =
    typeParam === "FIXED" || typeParam === "VARIABLE" ? typeParam : "ALL";

  const categoryId = url.searchParams.get("categoryId") ?? undefined;

  const expenses = await getExpensesDetailed(auth.user.tenantId, {
    month: period,
    status,
    type,
    categoryId: categoryId && categoryId.length > 0 ? categoryId : undefined,
  });

  const columns: ExportColumn[] = [
    { header: "Descrição", type: "text", width: 36 },
    { header: "Categoria", type: "text", width: 22 },
    { header: "Tipo", type: "text", width: 10 },
    { header: "Valor", type: "currency", width: 16 },
    { header: "Vencimento", type: "date", width: 12 },
    { header: "Pagamento", type: "date", width: 12 },
    { header: "Status", type: "text", width: 12 },
    { header: "Conta", type: "text", width: 22 },
    { header: "Recorrência", type: "text", width: 14 },
    { header: "Observações", type: "text", width: 40 },
  ];

  const rows: ExportRowValue[][] = expenses.map((expense) => [
    expense.description,
    expense.categoryName,
    TYPE_LABELS[expense.type] ?? expense.type,
    expense.amount,
    new Date(expense.dueDate),
    expense.paidAt ? new Date(expense.paidAt) : null,
    STATUS_LABELS[expense.status] ?? expense.status,
    expense.accountName,
    RECURRENCE_LABELS[expense.recurrence] ?? expense.recurrence,
    expense.notes,
  ]);

  const totals = rows.length > 0
    ? (() => {
        const totalPeriod = expenses.reduce((sum, e) => sum + e.amount, 0);
        const paidCount = expenses.filter((e) => e.status === "PAID").length;
        const pendingCount = expenses.filter((e) => e.status === "PENDING").length;
        const overdueCount = expenses.filter((e) => e.status === "OVERDUE").length;
        return [
          `Totais — ${expenses.length} despesa(s) · ${paidCount} paga(s) · ${pendingCount} pendente(s) · ${overdueCount} vencida(s)`,
          null,
          null,
          Math.round(totalPeriod * 100) / 100,
          null,
          null,
          null,
          null,
          null,
          null,
        ] as ExportRowValue[];
      })()
    : undefined;

  const monthLabel = `${capitalize(MONTH_NAMES[period.month - 1]!)} de ${period.year}`;
  const periodLabel = `Mês: ${monthLabel}`;

  const payload: ExportPayload = {
    sheetName: "Despesas",
    tenantName: auth.user.tenantName,
    periodLabel,
    generatedAt: new Date(),
    columns,
    rows,
    totals,
    emptyMessage: "Sem dados no período",
  };

  const periodStart = `${period.year}-${String(period.month).padStart(2, "0")}`;

  return respondWithExport(format, payload, "despesas", periodStart, null);
}
