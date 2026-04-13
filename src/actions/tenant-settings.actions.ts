"use server";

import { revalidatePath } from "next/cache";
import type { TenantAccentTheme } from "@/generated/prisma/enums";
import { requireModuleAccess } from "@/lib/session";
import { tenantAppearanceSchema } from "@/lib/validators/appearance";
import { tenantBusinessSettingsSchema } from "@/lib/validators/tenant-settings";
import {
  updateTenantAccentTheme,
  updateTenantBusinessSettings,
} from "@/services/tenant-settings.service";
import type { ActionResult } from "@/types";

/**
 * Server Action: atualiza a paleta visual do tenant autenticado.
 * A preferência é global para o cliente, mas separada do dark/light mode.
 */
export async function updateTenantAccentThemeAction(
  accentTheme: string
): Promise<ActionResult<{ accentTheme: TenantAccentTheme }>> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");

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

export async function updateTenantSettingsAction(
  input: unknown
): Promise<ActionResult<{ name: string }>> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");

  if (user.role !== "ADMIN") {
    return {
      success: false,
      error: "Apenas administradores podem alterar os dados do negócio.",
    };
  }

  const parsed = tenantBusinessSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  const result = await updateTenantBusinessSettings(user.tenantId, parsed.data);

  if (result.success) {
    revalidatePath("/dashboard", "layout");
    revalidatePath("/agenda");
    revalidatePath("/configuracoes/negocio");
  }

  return result;
}
