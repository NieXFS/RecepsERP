"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/session";
import { adminBotConfigSchema } from "@/lib/validators/bot-config";
import {
  createInitialBotConfigAdmin,
  upsertBotConfigAdmin,
} from "@/services/bot-config.service";
import type { ActionResult } from "@/types";

function revalidateRecepsTenantBotPaths(tenantId: string) {
  revalidatePath("/painel-receps/clientes");
  revalidatePath(`/painel-receps/clientes/${tenantId}`);
}

export async function createInitialBotConfigAdminAction(
  tenantId: string
): Promise<ActionResult<{ tenantId: string }>> {
  const user = await requireSuperAdmin();
  const result = await createInitialBotConfigAdmin(tenantId, user.id);

  if (result.success) {
    revalidateRecepsTenantBotPaths(tenantId);
  }

  return result;
}

export async function updateBotConfigAdminAction(
  input: unknown
): Promise<ActionResult<{ botName: string; tenantId: string }>> {
  const user = await requireSuperAdmin();
  const parsed = adminBotConfigSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  const result = await upsertBotConfigAdmin(parsed.data.tenantId, parsed.data, user.id);

  if (result.success) {
    revalidateRecepsTenantBotPaths(parsed.data.tenantId);
  }

  return result;
}
