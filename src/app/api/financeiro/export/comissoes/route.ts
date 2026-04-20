import { NextRequest } from "next/server";
import { parseCivilDate, type CivilDate } from "@/lib/civil-date";
import { getCommissionsDetailed } from "@/services/financial.service";
import type { ExportColumn, ExportPayload, ExportRowValue } from "@/lib/financial-export";
import {
  authorizeExport,
  parseExportFormat,
  respondWithExport,
} from "../_shared";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  CANCELLED: "Cancelada",
};

function formatCivilDateLabel(date: CivilDate) {
  return `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}/${date.year}`;
}

export async function GET(request: NextRequest) {
  const auth = await authorizeExport("financeiro.comissoes", "view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const format = parseExportFormat(url.searchParams.get("format"));

  const startDate = parseCivilDate(url.searchParams.get("from") ?? undefined);
  const endDate = parseCivilDate(url.searchParams.get("to") ?? undefined);

  const statusParam = url.searchParams.get("status") ?? "ALL";
  const status =
    statusParam === "PENDING" ||
    statusParam === "PAID" ||
    statusParam === "CANCELLED"
      ? statusParam
      : "ALL";

  const professionalId = url.searchParams.get("professionalId") ?? undefined;

  const commissions = await getCommissionsDetailed(auth.user.tenantId, {
    startDate: startDate ?? undefined,
    endDate: endDate ?? undefined,
    status,
    professionalId: professionalId && professionalId.length > 0 ? professionalId : undefined,
  });

  const columns: ExportColumn[] = [
    { header: "Data geração", type: "date", width: 12 },
    { header: "Profissional", type: "text", width: 28 },
    { header: "Cliente", type: "text", width: 28 },
    { header: "Serviço", type: "text", width: 32 },
    { header: "Valor serviço", type: "currency", width: 16 },
    { header: "Comissão", type: "currency", width: 16 },
    { header: "%", type: "percent", width: 9 },
    { header: "Status", type: "text", width: 12 },
    { header: "Data pagamento", type: "date", width: 14 },
  ];

  const rows: ExportRowValue[][] = commissions.map((commission) => [
    new Date(commission.generatedAt),
    commission.professionalName,
    commission.customerName,
    commission.services || null,
    commission.serviceAmount,
    commission.commissionValue,
    commission.commissionRate / 100,
    STATUS_LABELS[commission.status] ?? commission.status,
    commission.paidAt ? new Date(commission.paidAt) : null,
  ]);

  const totals = rows.length > 0
    ? (() => {
        const totalService = commissions.reduce((sum, c) => sum + c.serviceAmount, 0);
        const totalCommission = commissions.reduce((sum, c) => sum + c.commissionValue, 0);
        const paidCount = commissions.filter((c) => c.status === "PAID").length;
        const pendingCount = commissions.filter((c) => c.status === "PENDING").length;
        return [
          null,
          `Totais — ${commissions.length} comissão(ões) · ${paidCount} paga(s) · ${pendingCount} pendente(s)`,
          null,
          null,
          Math.round(totalService * 100) / 100,
          Math.round(totalCommission * 100) / 100,
          null,
          null,
          null,
        ] as ExportRowValue[];
      })()
    : undefined;

  const periodLabel =
    startDate && endDate
      ? `Período: ${formatCivilDateLabel(startDate)} a ${formatCivilDateLabel(endDate)}`
      : "Período: todas as comissões";

  const payload: ExportPayload = {
    sheetName: "Comissões",
    tenantName: auth.user.tenantName,
    periodLabel,
    generatedAt: new Date(),
    columns,
    rows,
    totals,
    emptyMessage: "Sem dados no período",
  };

  return respondWithExport(
    format,
    payload,
    "comissoes",
    startDate ? `${startDate.year}-${String(startDate.month).padStart(2, "0")}-${String(startDate.day).padStart(2, "0")}` : null,
    endDate ? `${endDate.year}-${String(endDate.month).padStart(2, "0")}-${String(endDate.day).padStart(2, "0")}` : null
  );
}
