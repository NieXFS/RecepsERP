import { NextRequest } from "next/server";
import {
  formatCivilDateToQuery,
  getTodayCivilDate,
  parseCivilDate,
  type CivilDate,
} from "@/lib/civil-date";
import { PAYMENT_METHOD_LABELS, type PaymentMethodValue } from "@/lib/payment-methods";
import {
  FINANCIAL_STATEMENT_STATUS_VALUES,
  FINANCIAL_STATEMENT_TYPE_VALUES,
} from "@/lib/validators/financial";
import { getFinancialStatement } from "@/services/financial.service";
import type { ExportColumn, ExportPayload, ExportRowValue } from "@/lib/financial-export";
import {
  authorizeExport,
  parseExportFormat,
  respondWithExport,
} from "../_shared";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
  REFUNDED: "Estornado",
};

function formatCivilDateLabel(date: CivilDate) {
  return `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}/${date.year}`;
}

export async function GET(request: NextRequest) {
  const auth = await authorizeExport("financeiro.extrato", "view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const format = parseExportFormat(url.searchParams.get("format"));

  const today = getTodayCivilDate();
  const defaultStart = { year: today.year, month: today.month, day: 1 } satisfies CivilDate;

  const startDate = parseCivilDate(url.searchParams.get("from") ?? undefined) ?? defaultStart;
  const endDate = parseCivilDate(url.searchParams.get("to") ?? undefined) ?? today;

  const typeParam = url.searchParams.get("type") ?? "ALL";
  const type = FINANCIAL_STATEMENT_TYPE_VALUES.includes(
    typeParam as (typeof FINANCIAL_STATEMENT_TYPE_VALUES)[number]
  )
    ? (typeParam as (typeof FINANCIAL_STATEMENT_TYPE_VALUES)[number])
    : "ALL";

  const statusParam = url.searchParams.get("status") ?? "ALL";
  const status = FINANCIAL_STATEMENT_STATUS_VALUES.includes(
    statusParam as (typeof FINANCIAL_STATEMENT_STATUS_VALUES)[number]
  )
    ? (statusParam as (typeof FINANCIAL_STATEMENT_STATUS_VALUES)[number])
    : "ALL";

  const statement = await getFinancialStatement(auth.user.tenantId, {
    startDate,
    endDate,
    type,
    status,
  });

  const columns: ExportColumn[] = [
    { header: "Data", type: "date", width: 12 },
    { header: "Descrição", type: "text", width: 40 },
    { header: "Método", type: "text", width: 18 },
    { header: "Conta", type: "text", width: 22 },
    { header: "Tipo", type: "text", width: 10 },
    { header: "Status", type: "text", width: 12 },
    { header: "Vencimento", type: "date", width: 12 },
    { header: "Valor", type: "currency", width: 16 },
  ];

  const rows: ExportRowValue[][] = statement.entries.map((entry) => {
    const signedAmount = entry.type === "INCOME" ? entry.amount : -entry.amount;
    return [
      new Date(entry.effectiveDate),
      entry.description ?? "Sem descrição",
      PAYMENT_METHOD_LABELS[entry.paymentMethod as PaymentMethodValue] ?? entry.paymentMethod,
      entry.accountName ?? "Sem conta",
      entry.type === "INCOME" ? "Entrada" : "Saída",
      STATUS_LABELS[entry.paymentStatus] ?? entry.paymentStatus,
      entry.dueDate ? new Date(entry.dueDate) : null,
      signedAmount,
    ];
  });

  const totalsRow: ExportRowValue[] = [
    null,
    "Totais — Entradas / Saídas / Saldo",
    null,
    null,
    null,
    null,
    null,
    statement.summary.saldoPeriodo,
  ];

  const periodLabel = `Período: ${formatCivilDateLabel(startDate)} a ${formatCivilDateLabel(endDate)}`;

  const payload: ExportPayload = {
    sheetName: "Extrato",
    tenantName: auth.user.tenantName,
    periodLabel,
    generatedAt: new Date(),
    columns,
    rows,
    totals: rows.length > 0 ? totalsRow : undefined,
    emptyMessage: "Sem dados no período",
  };

  return respondWithExport(
    format,
    payload,
    "extrato",
    formatCivilDateToQuery(startDate),
    formatCivilDateToQuery(endDate)
  );
}
