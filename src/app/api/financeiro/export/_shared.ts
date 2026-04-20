import "server-only";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOptionalSession } from "@/lib/session";
import {
  hasPermission,
  type PermissionAction,
  type PermissionPath,
} from "@/lib/tenant-permissions";
import { getEffectivePermissionSnapshot } from "@/services/user-permission.service";
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
  const session = await getOptionalSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const [dbUser, tenant] = await Promise.all([
    db.user.findFirst({
      where: {
        id: session.id,
        tenantId: session.tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        role: true,
        customPermissions: true,
        modulePermissions: {
          select: { module: true, isAllowed: true },
        },
      },
    }),
    db.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true },
    }),
  ]);

  if (!dbUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const snapshot = getEffectivePermissionSnapshot(
    dbUser.role,
    dbUser.customPermissions,
    dbUser.modulePermissions
  );

  if (!hasPermission(snapshot.customPermissions, path, action)) {
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
      id: session.id,
      tenantId: session.tenantId,
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
