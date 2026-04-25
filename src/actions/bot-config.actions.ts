"use server";

import { revalidatePath } from "next/cache";
import {
  isMasterRequiredError,
  MASTER_REQUIRED_MESSAGE,
  requireMasterSession,
} from "@/lib/active-user";
import { requireModuleAccess } from "@/lib/session";
import { botConfigSettingsSchema } from "@/lib/validators/bot-config";
import { upsertBotConfig } from "@/services/bot-config.service";
import type { ActionResult } from "@/types";

type MasterErrorResult = { success: false; error: string };

async function ensureMasterForSensitiveAction(): Promise<MasterErrorResult | null> {
  try {
    await requireMasterSession();
    return null;
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return { success: false, error: MASTER_REQUIRED_MESSAGE };
    }

    throw error;
  }
}

export async function updateBotConfigAction(
  input: unknown
): Promise<ActionResult<{ botName: string }>> {
  const user = await requireModuleAccess("CONFIGURACOES", "edit");
  const masterError = await ensureMasterForSensitiveAction();
  if (masterError) return masterError;

  if (user.role !== "ADMIN") {
    return {
      success: false,
      error: "Apenas administradores podem alterar as configurações do atendente.",
    };
  }

  const parsed = botConfigSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  const result = await upsertBotConfig(user.tenantId, parsed.data);

  if (result.success) {
    revalidatePath("/configuracoes/bot");
  }

  return result;
}
