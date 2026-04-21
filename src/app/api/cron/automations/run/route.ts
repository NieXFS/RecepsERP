import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MetaTemplateStatus, BotAutomationType } from "@/generated/prisma/enums";
import {
  runBirthdayAutomation,
  syncTemplateStatus,
} from "@/services/bot-automation.service";

export const dynamic = "force-dynamic";

type TenantResult = {
  tenantId: string;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron/automations] CRON_SECRET não configurado.");
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (authHeader !== expected) {
    return unauthorized();
  }

  const tenants = await db.tenant.findMany({
    where: {
      isActive: true,
      botConfig: { isActive: true },
    },
    select: { id: true },
  });

  const perTenant: TenantResult[] = [];
  const totals = { sent: 0, failed: 0, skipped: 0 };

  for (const tenant of tenants) {
    try {
      const birthday = await db.botAutomation.findUnique({
        where: {
          tenantId_type: {
            tenantId: tenant.id,
            type: BotAutomationType.BIRTHDAY,
          },
        },
        select: { metaTemplateStatus: true, metaTemplateName: true },
      });

      if (birthday?.metaTemplateName && birthday.metaTemplateStatus !== MetaTemplateStatus.APPROVED) {
        try {
          await syncTemplateStatus(tenant.id, BotAutomationType.BIRTHDAY);
        } catch (syncError) {
          console.error(
            `[cron/automations] falha ao sync template BIRTHDAY tenant=${tenant.id}`,
            syncError
          );
        }
      }

      const result = await runBirthdayAutomation(tenant.id);
      totals.sent += result.sent;
      totals.failed += result.failed;
      totals.skipped += result.skipped;
      perTenant.push({
        tenantId: tenant.id,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error(
        `[cron/automations] falha geral no tenant ${tenant.id}`,
        error
      );
      perTenant.push({
        tenantId: tenant.id,
        sent: 0,
        failed: 0,
        skipped: 0,
        error: message,
      });
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    tenantsProcessed: tenants.length,
    totals,
    perTenant,
  });
}
