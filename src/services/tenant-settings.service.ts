import type { TenantAccentTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import type { ActionResult } from "@/types";

/**
 * Busca o recorte de aparência do tenant para a tela de Configurações.
 * A preferência de paleta é separada do dark/light mode do usuário.
 */
export async function getTenantAppearanceSettings(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      accentTheme: true,
    },
  });

  if (!tenant) {
    throw new Error("Estabelecimento não encontrado.");
  }

  return tenant;
}

/**
 * Atualiza a paleta de cor persistida no Tenant.
 * Essa configuração vale para todo o ERP autenticado do cliente.
 */
export async function updateTenantAccentTheme(
  tenantId: string,
  accentTheme: TenantAccentTheme
): Promise<ActionResult<{ accentTheme: TenantAccentTheme }>> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { success: false, error: "Estabelecimento não encontrado." };
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: { accentTheme },
  });

  return {
    success: true,
    data: { accentTheme },
  };
}
