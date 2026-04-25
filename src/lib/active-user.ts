import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import type { GlobalRole, Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getEffectivePermissionSnapshot } from "@/services/user-permission.service";
import type { SessionUser, SessionUserWithAccess } from "@/types";

export const ACTIVE_USER_COOKIE = "recep_active_user_id";
export const MASTER_REQUIRED_MESSAGE =
  "esta ação só pode ser feita por quem fez login. Volte pra sua conta principal e tente de novo.";

const ACTIVE_USER_MAX_AGE = 30 * 24 * 60 * 60;

export async function setActiveUserCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACTIVE_USER_MAX_AGE,
    path: "/",
  });
}

export async function clearActiveUserCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_USER_COOKIE);
}

export async function getActiveUserIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_USER_COOKIE)?.value ?? null;
}

function extractMasterUserFromSession(session: Session | null): SessionUser {
  if (!session?.user) {
    throw new Error("Não autorizado.");
  }

  const user = session.user as unknown as {
    id?: string;
    tenantId?: string;
    name?: string | null;
    email?: string | null;
    role?: Role;
    globalRole?: GlobalRole | null;
    avatarUrl?: string | null;
  };

  if (!user.id || !user.tenantId || !user.role) {
    throw new Error("Sessão incompleta.");
  }

  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
    globalRole: user.globalRole ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}

async function getActiveUserIdForMaster(
  masterUser: Pick<SessionUser, "id" | "tenantId">
): Promise<string> {
  const activeUserId = await getActiveUserIdFromCookie();
  return resolveActiveUserIdForMaster(masterUser, activeUserId);
}

export async function resolveActiveUserIdForMaster(
  masterUser: Pick<SessionUser, "id" | "tenantId">,
  activeUserId: string | null
): Promise<string> {
  if (!activeUserId) {
    return masterUser.id;
  }

  const activeUser = await db.user.findFirst({
    where: {
      id: activeUserId,
      tenantId: masterUser.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  return activeUser?.id ?? masterUser.id;
}

export async function getActiveUserId(): Promise<string> {
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  const masterUser = extractMasterUserFromSession(session);

  return getActiveUserIdForMaster(masterUser);
}

export async function resolveEffectiveUserForPermissions(input: {
  masterUser: Pick<SessionUser, "id" | "tenantId">;
  activeUserId: string | null;
}): Promise<SessionUserWithAccess | null> {
  const effectiveUserId = await resolveActiveUserIdForMaster(
    input.masterUser,
    input.activeUserId
  );

  const user = await db.user.findFirst({
    where: {
      id: effectiveUserId,
      tenantId: input.masterUser.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      role: true,
      globalRole: true,
      avatarUrl: true,
      customPermissions: true,
      modulePermissions: {
        select: {
          module: true,
          isAllowed: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const permissionSnapshot = getEffectivePermissionSnapshot(
    user.role,
    user.customPermissions,
    user.modulePermissions
  );

  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    globalRole: user.globalRole ?? null,
    avatarUrl: user.avatarUrl ?? null,
    customPermissions: permissionSnapshot.customPermissions,
    moduleAccess: permissionSnapshot.moduleAccess,
    allowedModules: permissionSnapshot.allowedModules,
  };
}

export async function getEffectiveUserForPermissions(): Promise<SessionUserWithAccess> {
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  const masterUser = extractMasterUserFromSession(session);
  const activeUserId = await getActiveUserIdFromCookie();
  const effectiveUser = await resolveEffectiveUserForPermissions({
    masterUser,
    activeUserId,
  });

  if (!effectiveUser) {
    throw new Error("Não autorizado.");
  }

  return effectiveUser;
}

export function assertMasterSessionIsActive(input: {
  masterUserId: string;
  effectiveActiveUserId: string;
}): void {
  if (input.effectiveActiveUserId !== input.masterUserId) {
    throw new Error(`MASTER_REQUIRED: ${MASTER_REQUIRED_MESSAGE}`);
  }
}

export function isMasterRequiredError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("MASTER_REQUIRED:");
}

export async function requireMasterSession(): Promise<SessionUser> {
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  const masterUser = extractMasterUserFromSession(session);
  const effectiveActiveUserId = await getActiveUserIdForMaster(masterUser);

  assertMasterSessionIsActive({
    masterUserId: masterUser.id,
    effectiveActiveUserId,
  });

  const dbUser = await db.user.findFirst({
    where: {
      id: masterUser.id,
      tenantId: masterUser.tenantId,
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      role: true,
      globalRole: true,
      avatarUrl: true,
    },
  });

  if (!dbUser) {
    throw new Error("Não autorizado.");
  }

  return {
    id: dbUser.id,
    tenantId: dbUser.tenantId,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    globalRole: dbUser.globalRole ?? null,
    avatarUrl: dbUser.avatarUrl ?? null,
  };
}
