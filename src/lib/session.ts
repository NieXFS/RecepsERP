import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getModuleDefinition } from "@/lib/tenant-modules";
import { getEffectiveModuleAccessSnapshot } from "@/services/user-permission.service";
import type { SessionUser, SessionUserWithAccess } from "@/types";
import type { GlobalRole, Role, TenantModule } from "@/generated/prisma/enums";

/**
 * Extrai os campos customizados (id, tenantId, role) do objeto de sessão NextAuth.
 * Retorna null se a sessão não existir ou estiver incompleta.
 */
async function extractSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const u = session.user as unknown as Record<string, unknown>;

  if (!u.id || !u.tenantId || !u.role) {
    return null;
  }

  return {
    id: u.id as string,
    tenantId: u.tenantId as string,
    name: u.name as string,
    email: u.email as string,
    role: u.role as Role,
    globalRole: (u.globalRole as GlobalRole | null) ?? null,
  };
}

async function hydrateSessionUser(user: SessionUser): Promise<SessionUser | null> {
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
      tenantId: user.tenantId,
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
    },
  });

  if (!dbUser) {
    return null;
  }

  return {
    id: dbUser.id,
    tenantId: dbUser.tenantId,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    globalRole: dbUser.globalRole ?? null,
  };
}

async function getHydratedSession(): Promise<SessionUser | null> {
  const sessionUser = await extractSession();
  if (!sessionUser) {
    return null;
  }

  return hydrateSessionUser(sessionUser);
}

async function loadSessionUserWithAccess(
  user: SessionUser
): Promise<SessionUserWithAccess | null> {
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
      tenantId: user.tenantId,
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
      modulePermissions: {
        select: {
          module: true,
          isAllowed: true,
        },
      },
    },
  });

  if (!dbUser) {
    return null;
  }

  const moduleSnapshot = getEffectiveModuleAccessSnapshot(
    dbUser.role,
    dbUser.modulePermissions
  );

  return {
    id: dbUser.id,
    tenantId: dbUser.tenantId,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    globalRole: dbUser.globalRole ?? null,
    moduleAccess: moduleSnapshot.access,
    allowedModules: moduleSnapshot.allowedModules,
  };
}

/**
 * Retorna o usuário autenticado. Lança erro se não estiver logado.
 * Uso principal: Server Actions, onde o redirect não funciona diretamente.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getHydratedSession();
  if (!user) {
    throw new Error("Não autorizado");
  }
  return user;
}

/**
 * Retorna o usuário autenticado. Redireciona para /login se não estiver logado.
 * Uso principal: Server Components (pages/layouts), onde redirect funciona.
 */
export async function getAuthUser(): Promise<SessionUser> {
  const user = await getHydratedSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Exige que o usuário tenha role ADMIN. Lança erro caso contrário.
 * Uso: Server Actions de acesso restrito (financeiro, acerto de comissões, etc.)
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Acesso restrito a administradores.");
  }
  return user;
}

/**
 * Exige que o usuário tenha uma das roles informadas.
 * Uso: Server Actions que permitem mais de um cargo (ex: ADMIN ou RECEPTIONIST).
 */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error(`Acesso restrito aos cargos: ${roles.join(", ")}.`);
  }
  return user;
}

/**
 * Exige que o usuário possua contexto global SUPER_ADMIN.
 * Uso: ações e páginas internas de operação da Receps, separadas do RBAC do tenant.
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.globalRole !== "SUPER_ADMIN") {
    throw new Error("Acesso restrito ao time interno da Receps.");
  }
  return user;
}

/**
 * Retorna a sessão se existir, ou null — use quando a autenticação é opcional.
 */
export async function getOptionalSession(): Promise<SessionUser | null> {
  return getHydratedSession();
}

/**
 * Retorna o usuário autenticado com o mapa efetivo de permissões por módulo.
 * Útil para sidebar, guards de rota e telas que precisam decidir acesso por módulo.
 */
export async function getAuthUserWithAccess(): Promise<SessionUserWithAccess> {
  const sessionUser = await getAuthUser();
  const user = await loadSessionUserWithAccess(sessionUser);

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Exige acesso ao módulo informado em Server Actions.
 * Lança erro se o usuário não possuir a permissão efetiva.
 */
export async function requireModuleAccess(
  module: TenantModule
): Promise<SessionUserWithAccess> {
  const sessionUser = await requireAuth();
  const user = await loadSessionUserWithAccess(sessionUser);

  if (!user || !user.moduleAccess[module]) {
    throw new Error(`Acesso restrito ao módulo ${module}.`);
  }

  return user;
}

/**
 * Garante acesso a um módulo em páginas/layouts do dashboard.
 * Redireciona para /dashboard se o usuário não puder acessar a rota.
 */
export async function getAuthUserForModule(
  module: TenantModule
): Promise<SessionUserWithAccess> {
  const user = await getAuthUserWithAccess();

  if (!user.moduleAccess[module]) {
    const fallbackModule = user.allowedModules[0];
    redirect(fallbackModule ? getModuleDefinition(fallbackModule).href : "/login");
  }

  return user;
}
