import type { TenantAccentTheme } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { normalizeTenantScheduleConfig } from "@/lib/tenant-schedule";
import type { TenantBusinessSettingsInput } from "@/lib/validators/tenant-settings";
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

export async function getTenantBusinessSettings(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      cnpj: true,
      phone: true,
      email: true,
      openingTime: true,
      closingTime: true,
      slotIntervalMinutes: true,
    },
  });

  if (!tenant) {
    throw new Error("Estabelecimento não encontrado.");
  }

  return {
    ...tenant,
    ...normalizeTenantScheduleConfig(tenant),
  };
}

export async function updateTenantBusinessSettings(
  tenantId: string,
  input: TenantBusinessSettingsInput
): Promise<ActionResult<{ name: string }>> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    return { success: false, error: "Estabelecimento não encontrado." };
  }

  const normalizedSchedule = normalizeTenantScheduleConfig({
    openingTime: input.openingTime,
    closingTime: input.closingTime,
    slotIntervalMinutes: input.slotIntervalMinutes,
  });

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      openingTime: normalizedSchedule.openingTime,
      closingTime: normalizedSchedule.closingTime,
      slotIntervalMinutes: normalizedSchedule.slotIntervalMinutes,
    },
  });

  return {
    success: true,
    data: { name: input.name },
  };
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
