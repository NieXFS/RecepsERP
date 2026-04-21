import { NextRequest } from "next/server";
import { PAYMENT_METHOD_LABELS } from "@/lib/payment-methods";
import { getCashSessionDetail } from "@/services/financial.service";
import type {
  CashSessionDetail,
  CashSessionMovement,
} from "@/services/financial.service";
import { authorizeExport } from "../_shared";

const CSV_BOM = "﻿";

function formatCurrencyBR(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTimeBR(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeBR(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

function filenameDate(isoDate: string) {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function csvEscape(value: string | number | null | undefined) {
  if (value == null) return "";
  const str = typeof value === "number" ? formatCurrencyBR(value) : String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: Array<string | number | null | undefined>) {
  return values.map(csvEscape).join(";");
}

const MOVEMENT_LABELS: Record<CashSessionMovement["movementType"], string> = {
  SALE: "Venda",
  REINFORCEMENT: "Reforço",
  WITHDRAWAL: "Sangria",
  OTHER_EXPENSE: "Outra saída",
};

function buildCashSessionCsv(detail: CashSessionDetail): string {
  const lines: string[] = [];
  const isOpen = detail.status === "OPEN";

  if (isOpen) {
    lines.push(csvRow(["ATENÇÃO", "Z PARCIAL — SESSÃO AINDA EM ANDAMENTO"]));
    lines.push("");
  }

  lines.push(csvRow(["RESUMO"]));
  lines.push(csvRow(["Conta", detail.accountName]));
  lines.push(csvRow(["Status", isOpen ? "Aberto" : "Fechado"]));
  lines.push(csvRow(["Abertura", formatDateTimeBR(detail.openedAt)]));
  lines.push(csvRow(["Fechamento", formatDateTimeBR(detail.closedAt)]));
  lines.push(csvRow(["Aberto por", detail.openedByName]));
  lines.push(csvRow(["Fechado por", detail.closedByName ?? ""]));
  lines.push(csvRow(["Valor inicial", detail.openingAmount]));
  lines.push(csvRow(["Total de vendas", detail.totalSales]));
  lines.push(csvRow(["Total de reforços", detail.totalReinforcements]));
  lines.push(csvRow(["Total de sangrias", detail.totalWithdrawals]));
  if (detail.totalOtherExpenses > 0) {
    lines.push(csvRow(["Outras saídas", detail.totalOtherExpenses]));
  }
  lines.push(csvRow(["Saldo esperado", detail.expectedBalance]));
  if (detail.closingAmount != null) {
    lines.push(csvRow(["Total apurado", detail.closingAmount]));
    lines.push(csvRow(["Diferença", detail.difference ?? 0]));
  }
  lines.push("");

  lines.push(csvRow(["VENDAS POR MÉTODO"]));
  lines.push(csvRow(["Método", "Quantidade", "Total"]));
  if (detail.salesByPaymentMethod.length === 0) {
    lines.push(csvRow(["(nenhuma venda registrada)", "", ""]));
  } else {
    for (const row of detail.salesByPaymentMethod) {
      lines.push(
        csvRow([
          PAYMENT_METHOD_LABELS[row.paymentMethod] ?? row.paymentMethod,
          row.count,
          row.total,
        ])
      );
    }
  }
  lines.push("");

  const withdrawals = detail.movements.filter((m) => m.movementType === "WITHDRAWAL");
  lines.push(csvRow(["SANGRIAS"]));
  lines.push(csvRow(["Hora", "Motivo", "Descrição", "Valor"]));
  if (withdrawals.length === 0) {
    lines.push(csvRow(["(nenhuma sangria registrada)", "", "", ""]));
  } else {
    for (const movement of withdrawals) {
      lines.push(
        csvRow([
          formatTimeBR(movement.occurredAt),
          movement.cashMovementReason ?? "",
          movement.description,
          movement.amount,
        ])
      );
    }
  }
  lines.push("");

  const reinforcements = detail.movements.filter(
    (m) => m.movementType === "REINFORCEMENT"
  );
  lines.push(csvRow(["REFORÇOS"]));
  lines.push(csvRow(["Hora", "Motivo", "Descrição", "Valor"]));
  if (reinforcements.length === 0) {
    lines.push(csvRow(["(nenhum reforço registrado)", "", "", ""]));
  } else {
    for (const movement of reinforcements) {
      lines.push(
        csvRow([
          formatTimeBR(movement.occurredAt),
          movement.cashMovementReason ?? "",
          movement.description,
          movement.amount,
        ])
      );
    }
  }
  lines.push("");

  lines.push(csvRow(["MOVIMENTAÇÕES"]));
  lines.push(csvRow(["Hora", "Tipo", "Descrição", "Forma de pagto", "Valor"]));
  if (detail.movements.length === 0) {
    lines.push(csvRow(["(nenhuma movimentação)", "", "", "", ""]));
  } else {
    for (const movement of detail.movements) {
      const signed = movement.type === "INCOME" ? movement.amount : -movement.amount;
      lines.push(
        csvRow([
          formatTimeBR(movement.occurredAt),
          MOVEMENT_LABELS[movement.movementType],
          movement.description,
          PAYMENT_METHOD_LABELS[movement.paymentMethod] ?? movement.paymentMethod,
          signed,
        ])
      );
    }
  }
  lines.push("");

  lines.push(csvRow(["OBSERVAÇÕES"]));
  lines.push(csvRow(["Abertura", detail.openingNotes ?? ""]));
  lines.push(csvRow(["Fechamento", detail.closingNotes ?? ""]));

  return CSV_BOM + lines.join("\r\n") + "\r\n";
}

export async function GET(request: NextRequest) {
  const auth = await authorizeExport("financeiro.caixa", "view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId")?.trim();
  const format = url.searchParams.get("format")?.trim() ?? "csv";

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: "sessionId é obrigatório" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (format !== "csv") {
    return new Response(
      JSON.stringify({ error: "Formato não suportado (apenas csv)" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const detail = await getCashSessionDetail(auth.user.tenantId, sessionId);
  if (!detail) {
    return new Response(
      JSON.stringify({ error: "Sessão não encontrada" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const csv = buildCashSessionCsv(detail);
  const accountSlug = slugify(detail.accountName) || "caixa";
  const datePart = filenameDate(detail.openedAt);
  const filename = `caixa-${accountSlug}-${datePart}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
