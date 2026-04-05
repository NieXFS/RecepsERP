import { z } from "zod";
import { TENANT_ACCENT_THEME_VALUES } from "@/lib/tenant-accent-theme";

/**
 * Validação explícita da paleta do tenant.
 * Mantém a preferência em um conjunto fechado de presets conhecidos.
 */
export const tenantAppearanceSchema = z.object({
  accentTheme: z.enum(TENANT_ACCENT_THEME_VALUES),
});

export type TenantAppearanceInput = z.infer<typeof tenantAppearanceSchema>;
