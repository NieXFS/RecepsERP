"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@/generated/prisma/enums";
import {
  clearActiveUserCookie,
  isMasterRequiredError,
  MASTER_REQUIRED_MESSAGE,
  requireMasterSession,
  setActiveUserCookie,
} from "@/lib/active-user";
import {
  switchActiveUserCore,
  type ActiveUserSummary,
} from "@/lib/active-user-switch";
import { db } from "@/lib/db";
import { hashPin, validatePinFormat, verifyPin } from "@/lib/pin";
import { requireAuth } from "@/lib/session";

type ErrorResult = { success: false; error: string; retryAfterSec?: number };
type PinActionResult = { success: true } | ErrorResult;

type SwitchActiveUserResult =
  | { success: true; activeUser: ActiveUserSummary }
  | ErrorResult;

export type SwitchableUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  hasPin: boolean;
  isActive: boolean;
};

function revalidatePinConsumers() {
  revalidatePath("/configuracoes/conta");
  revalidatePath("/profissionais");
}

function forbidden(message: string): ErrorResult {
  return { success: false, error: `403: ${message}` };
}

export async function setMyPinAction(input: {
  newPin: string;
  confirmPin: string;
  currentPin?: string;
}): Promise<PinActionResult> {
  let sessionUser: Awaited<ReturnType<typeof requireMasterSession>>;
  try {
    sessionUser = await requireMasterSession();
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return { success: false, error: MASTER_REQUIRED_MESSAGE };
    }

    throw error;
  }

  const user = await db.user.findFirst({
    where: {
      id: sessionUser.id,
      tenantId: sessionUser.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      pin: true,
      pinConfiguredAt: true,
    },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  const format = validatePinFormat(input.newPin);
  if (!format.valid) {
    return { success: false, error: format.error ?? "PIN inválido." };
  }

  if (input.confirmPin !== input.newPin) {
    return { success: false, error: "A confirmação do PIN não confere." };
  }

  if (user.pin) {
    if (!input.currentPin) {
      return { success: false, error: "Informe o PIN atual." };
    }

    const currentPinValid = await verifyPin(input.currentPin, user.pin);
    if (!currentPinValid) {
      return { success: false, error: "PIN atual incorreto." };
    }
  }

  const now = new Date();
  const nextPinHash = await hashPin(input.newPin);

  await db.user.update({
    where: { id: user.id },
    data: {
      pin: nextPinHash,
      pinConfiguredAt: user.pinConfiguredAt ?? now,
      pinLastChangedAt: user.pin ? now : null,
    },
  });

  revalidatePinConsumers();
  return { success: true };
}

export async function removeMyPinAction(input: {
  currentPin: string;
}): Promise<PinActionResult> {
  let sessionUser: Awaited<ReturnType<typeof requireMasterSession>>;
  try {
    sessionUser = await requireMasterSession();
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return { success: false, error: MASTER_REQUIRED_MESSAGE };
    }

    throw error;
  }

  const user = await db.user.findFirst({
    where: {
      id: sessionUser.id,
      tenantId: sessionUser.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      pin: true,
    },
  });

  if (!user?.pin) {
    return { success: false, error: "Nenhum PIN configurado." };
  }

  const currentPinValid = await verifyPin(input.currentPin, user.pin);
  if (!currentPinValid) {
    return { success: false, error: "PIN atual incorreto." };
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      pin: null,
      pinConfiguredAt: null,
    },
  });

  revalidatePinConsumers();
  return { success: true };
}

export async function resetUserPinAction(input: {
  userId: string;
}): Promise<PinActionResult> {
  let sessionUser: Awaited<ReturnType<typeof requireMasterSession>>;
  try {
    sessionUser = await requireMasterSession();
  } catch (error) {
    if (isMasterRequiredError(error)) {
      return { success: false, error: MASTER_REQUIRED_MESSAGE };
    }

    throw error;
  }

  if (sessionUser.role !== "ADMIN") {
    return forbidden("Acesso restrito a administradores.");
  }

  if (input.userId === sessionUser.id) {
    return {
      success: false,
      error: "Use a seção Conta para alterar ou remover seu próprio PIN.",
    };
  }

  const targetUser = await db.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      tenantId: true,
    },
  });

  if (!targetUser) {
    return { success: false, error: "Usuário não encontrado." };
  }

  if (targetUser.tenantId !== sessionUser.tenantId) {
    return forbidden("Usuário fora do tenant atual.");
  }

  await db.user.update({
    where: { id: targetUser.id },
    data: {
      pin: null,
      pinConfiguredAt: null,
    },
  });

  revalidatePinConsumers();
  return { success: true };
}

export async function listSwitchableUsersAction(): Promise<SwitchableUser[]> {
  const sessionUser = await requireAuth();

  const users = await db.user.findMany({
    where: {
      tenantId: sessionUser.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      pin: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    hasPin: user.pin !== null,
    isActive: user.isActive,
  }));
}

export async function switchActiveUserAction(input: {
  targetUserId: string;
  pin: string;
}): Promise<SwitchActiveUserResult> {
  const masterUser = await requireAuth();
  const result = await switchActiveUserCore(masterUser, input);

  if (!result.success) {
    return result;
  }

  if (result.shouldSetCookie) {
    await setActiveUserCookie(result.activeUser.id);
  }

  return { success: true, activeUser: result.activeUser };
}

export async function switchBackToMasterAction(): Promise<{ success: true }> {
  await requireAuth();
  await clearActiveUserCookie();
  return { success: true };
}
