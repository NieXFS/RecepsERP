import { z } from "zod";

/**
 * Valida o período mensal usado nas métricas do dashboard.
 */
export const dashboardMonthSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export type DashboardMonthInput = z.infer<typeof dashboardMonthSchema>;
