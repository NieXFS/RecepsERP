import type { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { validatePinFormat, verifyPin } from "@/lib/pin";
import {
  checkLock,
  recordFailure,
  recordSuccess,
} from "@/lib/pin-rate-limit";

export type ActiveUserSummary = {
  id: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
};

export type SwitchMasterUser = {
  id: string;
  tenantId: string;
  name: string;
  role: Role;
};

export type SwitchActiveUserCoreResult =
  | { success: true; activeUser: ActiveUserSummary; shouldSetCookie: boolean }
  | { success: false; error: string; retryAfterSec?: number };

function forbidden(message: string): { success: false; error: string } {
  return { success: false, error: `403: ${message}` };
}

function logSwitchFailure(masterUserId: string, targetUserId: string, reason: string) {
  console.log(`[switch] master=${masterUserId} → active=${targetUserId} failed reason=${reason}`);
}

function logSwitchSuccess(masterUserId: string, targetUserId: string) {
  console.log(`[switch] master=${masterUserId} → active=${targetUserId} success`);
}

export async function switchActiveUserCore(
  masterUser: SwitchMasterUser,
  input: { targetUserId: string; pin: string }
): Promise<SwitchActiveUserCoreResult> {
  if (input.targetUserId === masterUser.id) {
    const master = await db.user.findFirst({
      where: {
        id: masterUser.id,
        tenantId: masterUser.tenantId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    logSwitchSuccess(masterUser.id, masterUser.id);
    return {
      success: true,
      shouldSetCookie: false,
      activeUser: {
        id: master?.id ?? masterUser.id,
        name: master?.name ?? masterUser.name,
        role: master?.role ?? masterUser.role,
        avatarUrl: master?.avatarUrl ?? null,
      },
    };
  }

  const target = await db.user.findUnique({
    where: { id: input.targetUserId },
    select: {
      id: true,
      tenantId: true,
      name: true,
      role: true,
      avatarUrl: true,
      pin: true,
      isActive: true,
      deletedAt: true,
    },
  });

  if (!target || target.deletedAt) {
    logSwitchFailure(masterUser.id, input.targetUserId, "not_found");
    return { success: false, error: "Usuário não encontrado." };
  }

  if (target.tenantId !== masterUser.tenantId) {
    logSwitchFailure(masterUser.id, target.id, "cross_tenant");
    return forbidden("Usuário fora do tenant atual.");
  }

  if (!target.isActive) {
    logSwitchFailure(masterUser.id, target.id, "inactive_user");
    return { success: false, error: "Usuário inativo." };
  }

  if (!target.pin) {
    logSwitchFailure(masterUser.id, target.id, "pin_not_configured");
    return { success: false, error: "Esse usuário ainda não configurou um PIN." };
  }

  const lock = checkLock(target.id);
  if (lock.locked) {
    const retryAfterSec = lock.retryAfterSec ?? 1;
    logSwitchFailure(masterUser.id, target.id, "rate_limited");
    return {
      success: false,
      error: `Muitas tentativas. Aguarde ${retryAfterSec}s.`,
      retryAfterSec,
    };
  }

  const format = validatePinFormat(input.pin);
  if (!format.valid) {
    logSwitchFailure(masterUser.id, target.id, "invalid_format");
    return { success: false, error: format.error ?? "PIN inválido." };
  }

  const validPin = await verifyPin(input.pin, target.pin);
  if (!validPin) {
    const failure = recordFailure(target.id);
    logSwitchFailure(masterUser.id, target.id, "invalid_pin");
    return {
      success: false,
      error: "PIN incorreto.",
      retryAfterSec: failure.retryAfterSec,
    };
  }

  recordSuccess(target.id);
  logSwitchSuccess(masterUser.id, target.id);

  return {
    success: true,
    shouldSetCookie: true,
    activeUser: {
      id: target.id,
      name: target.name,
      role: target.role,
      avatarUrl: target.avatarUrl,
    },
  };
}
