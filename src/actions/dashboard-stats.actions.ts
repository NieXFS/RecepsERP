"use server";

import { requireModuleAccess } from "@/lib/session";
import { dashboardMonthSchema } from "@/lib/validators/dashboard";
import {
  getDailyRevenueForTenant,
  getMonthlyStatsForTenant,
} from "@/services/dashboard.service";

/**
 * Server action para consolidar as métricas mensais do dashboard.
 * O tenantId é sempre validado contra a sessão autenticada.
 */
export async function getMonthlyStats(
  tenantId: string,
  month: number,
  year: number
) {
  const session = await requireModuleAccess("DASHBOARD");
  const parsed = dashboardMonthSchema.safeParse({ month, year });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Período mensal inválido.");
  }

  if (tenantId !== session.tenantId) {
    throw new Error("Tenant inválido para o contexto autenticado.");
  }

  return getMonthlyStatsForTenant(session.tenantId, parsed.data);
}

/**
 * Server action para buscar a série diária do gráfico mensal.
 * O tenantId é validado contra a sessão para manter o isolamento multitenant.
 */
export async function getDailyRevenue(
  tenantId: string,
  month: number,
  year: number
) {
  const session = await requireModuleAccess("DASHBOARD");
  const parsed = dashboardMonthSchema.safeParse({ month, year });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Período mensal inválido.");
  }

  if (tenantId !== session.tenantId) {
    throw new Error("Tenant inválido para o contexto autenticado.");
  }

  return getDailyRevenueForTenant(session.tenantId, parsed.data);
}
