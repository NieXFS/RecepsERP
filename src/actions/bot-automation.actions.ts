"use server";

import { revalidatePath } from "next/cache";
import {
  isMasterRequiredError,
  MASTER_REQUIRED_MESSAGE,
  requireMasterSession,
} from "@/lib/active-user";
import { getAuthUserWithAccess } from "@/lib/session";
import {
  saveAutomationSchema,
  syncAutomationStatusSchema,
  triggerAutomationTestSchema,
} from "@/lib/validators/bot-automation";
import {
  saveAutomation,
  sendAutomationTest,
  syncTemplateStatus,
  SyncDebouncedError,
  toBotAutomationVM,
  type BotAutomationVM,
} from "@/services/bot-automation.service";
import { MetaTemplateQuarantineError } from "@/lib/whatsapp-cloud";
import type { ActionResult } from "@/types";

async function assertAdmin() {
  const user = await getAuthUserWithAccess();
  if (user.role !== "ADMIN") {
    return {
      ok: false as const,
      error: "Apenas administradores podem gerenciar automações.",
    };
  }
  try {
    await requireMasterSession();
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return {
        ok: false as const,
        error: MASTER_REQUIRED_MESSAGE,
      };
    }

    throw error;
  }

  return { ok: true as const, user };
}

export async function saveBotAutomationAction(
  input: unknown
): Promise<ActionResult<BotAutomationVM>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const parsed = saveAutomationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  try {
    const row = await saveAutomation(auth.user.tenantId, parsed.data);
    revalidatePath("/atendente-ia");
    return { success: true, data: toBotAutomationVM(row) };
  } catch (error) {
    if (error instanceof MetaTemplateQuarantineError) {
      revalidatePath("/atendente-ia");
      return {
        success: false,
        error:
          "Aguardando Meta liberar o nome anterior (~10 min). Tente novamente em alguns minutos.",
      };
    }
    const message =
      error instanceof Error ? error.message : "Não foi possível salvar a automação.";
    return { success: false, error: message };
  }
}

export async function syncBotAutomationStatusAction(
  input: unknown
): Promise<ActionResult<BotAutomationVM>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const parsed = syncAutomationStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  try {
    const row = await syncTemplateStatus(auth.user.tenantId, parsed.data.type);
    revalidatePath("/atendente-ia");
    return { success: true, data: toBotAutomationVM(row) };
  } catch (error) {
    if (error instanceof SyncDebouncedError) {
      return {
        success: false,
        error: "Sincronização recente em andamento. Aguarde alguns segundos.",
      };
    }
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível consultar o status do template.";
    return { success: false, error: message };
  }
}

export async function triggerBotAutomationTestAction(
  input: unknown
): Promise<ActionResult<{ messageId: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { success: false, error: auth.error };

  const parsed = triggerAutomationTestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    };
  }

  try {
    const result = await sendAutomationTest(
      auth.user.tenantId,
      parsed.data.type,
      parsed.data.to,
      parsed.data.overrideValues
    );
    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível enviar o teste.";
    return { success: false, error: message };
  }
}
