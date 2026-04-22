import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MetaTemplateStatus, BotAutomationType } from "@/generated/prisma/enums";
import {
  runAllAutomationsForTenant,
  syncTemplateStatus,
} from "@/services/bot-automation.service";

export const dynamic = "force-dynamic";

type PerTypeSummary = {
  sent: number;
  failed: number;
  skipped: number;
};

type TenantResult = {
  tenantId: string;
  sent: number;
  failed: number;
  skipped: number;
  byType: {
    birthday: PerTypeSummary;
    inactive: PerTypeSummary;
    postAppointment: PerTypeSummary;
    reschedule: PerTypeSummary;
  };
  error?: string;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

const TYPES_TO_SYNC = [
  BotAutomationType.BIRTHDAY,
  BotAutomationType.INACTIVE,
  BotAutomationType.POST_APPOINTMENT,
  BotAutomationType.RESCHEDULE,
];

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
      const rows = await db.botAutomation.findMany({
        where: { tenantId: tenant.id, type: { in: TYPES_TO_SYNC } },
        select: {
          type: true,
          metaTemplateStatus: true,
          metaTemplateName: true,
        },
      });

      for (const row of rows) {
        if (
          row.metaTemplateName &&
          row.metaTemplateStatus !== MetaTemplateStatus.APPROVED
        ) {
          try {
            await syncTemplateStatus(tenant.id, row.type);
          } catch (syncError) {
            console.error(
              `[cron/automations] falha ao sync template ${row.type} tenant=${tenant.id}`,
              syncError
            );
          }
        }
      }

      const result = await runAllAutomationsForTenant(tenant.id);
      const tenantSent =
        result.birthday.sent +
        result.inactive.sent +
        result.postAppointment.sent +
        result.reschedule.sent;
      const tenantFailed =
        result.birthday.failed +
        result.inactive.failed +
        result.postAppointment.failed +
        result.reschedule.failed;
      const tenantSkipped =
        result.birthday.skipped +
        result.inactive.skipped +
        result.postAppointment.skipped +
        result.reschedule.skipped;

      totals.sent += tenantSent;
      totals.failed += tenantFailed;
      totals.skipped += tenantSkipped;
      perTenant.push({
        tenantId: tenant.id,
        sent: tenantSent,
        failed: tenantFailed,
        skipped: tenantSkipped,
        byType: {
          birthday: {
            sent: result.birthday.sent,
            failed: result.birthday.failed,
            skipped: result.birthday.skipped,
          },
          inactive: {
            sent: result.inactive.sent,
            failed: result.inactive.failed,
            skipped: result.inactive.skipped,
          },
          postAppointment: {
            sent: result.postAppointment.sent,
            failed: result.postAppointment.failed,
            skipped: result.postAppointment.skipped,
          },
          reschedule: {
            sent: result.reschedule.sent,
            failed: result.reschedule.failed,
            skipped: result.reschedule.skipped,
          },
        },
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
        byType: {
          birthday: { sent: 0, failed: 0, skipped: 0 },
          inactive: { sent: 0, failed: 0, skipped: 0 },
          postAppointment: { sent: 0, failed: 0, skipped: 0 },
          reschedule: { sent: 0, failed: 0, skipped: 0 },
        },
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
