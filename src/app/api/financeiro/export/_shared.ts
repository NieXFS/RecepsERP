import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getEffectiveUserForPermissions } from "@/lib/active-user";
import {
  hasPermission,
  type PermissionAction,
  type PermissionPath,
} from "@/lib/tenant-permissions";
import {
  buildCsv,
  buildExportFilename,
  buildXlsx,
  csvMimeType,
  xlsxMimeType,
  type ExportPayload,
} from "@/lib/financial-export";

export type ExportAuthResult =
  | {
      ok: true;
      user: {
        id: string;
        tenantId: string;
        tenantName: string;
      };
    }
  | { ok: false; response: NextResponse };

/**
 * Garante autenticação + permissão para rotas de export financeiro.
 * Retorna 401 quando não há sessão e 403 quando a permissão está ausente.
 */
export async function authorizeExport(
  path: PermissionPath,
  action: PermissionAction = "view"
): Promise<ExportAuthResult> {
  let user;
  try {
    user = await getEffectiveUserForPermissions();
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        (error.message === "Não autorizado." || error.message === "Sessão incompleta.")
      )
    ) {
      throw error;
    }

    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    select: { name: true },
  });

  if (!hasPermission(user.customPermissions, path, action)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      tenantId: user.tenantId,
      tenantName: tenant?.name ?? "Receps ERP",
    },
  };
}

export type ExportFormat = "csv" | "xlsx";

export function parseExportFormat(value: string | null): ExportFormat {
  if (value === "csv") return "csv";
  return "xlsx";
}

export async function respondWithExport(
  format: ExportFormat,
  payload: ExportPayload,
  filenameBase: string,
  periodStart: string | null,
  periodEnd: string | null
): Promise<Response> {
  if (format === "csv") {
    const buffer = buildCsv(payload);
    const filename = buildExportFilename(filenameBase, periodStart, periodEnd, "csv");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": csvMimeType(),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const buffer = await buildXlsx(payload);
  const filename = buildExportFilename(filenameBase, periodStart, periodEnd, "xlsx");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": xlsxMimeType(),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export function readSingle(value: string | null) {
  return value && value.length > 0 ? value : null;
}
