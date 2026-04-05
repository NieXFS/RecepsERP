"use server";

import { revalidatePath } from "next/cache";
import type { TenantAccentTheme } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/session";
import { tenantAppearanceSchema } from "@/lib/validators/appearance";
import { updateTenantAccentTheme } from "@/services/tenant-settings.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: atualiza a paleta visual do tenant autenticado.
 * A preferência é global para o cliente, mas separada do dark/light mode.
 */
export async function updateTenantAccentThemeAction(
  accentTheme: string
): Promise<ActionResult<{ accentTheme: TenantAccentTheme }>> {
  const user = await requireRole("ADMIN");

  const parsed = tenantAppearanceSchema.safeParse({ accentTheme });
  if (!parsed.success) {
    return { success: false, error: "Selecione uma paleta válida." };
  }

  const result = await updateTenantAccentTheme(
    user.tenantId,
    parsed.data.accentTheme
  );

  if (result.success) {
    revalidatePath("/dashboard", "layout");
    revalidatePath("/configuracoes/aparencia");
  }

  return result;
}
