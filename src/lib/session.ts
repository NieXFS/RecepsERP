import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getDefaultAccessibleHref,
  hasPermission,
  type PermissionAction,
  type PermissionPath,
} from "@/lib/tenant-permissions";
import { normalizePlanSlug } from "@/lib/plans";
import { getEffectivePermissionSnapshot } from "@/services/user-permission.service";
import type { SessionUser, SessionUserWithAccess } from "@/types";
import type { GlobalRole, Role, TenantModule } from "@/generated/prisma/enums";

/**
 * Retorna o slug do plano ativo do tenant, ou null se não houver assinatura
 * (billing bypass, super admin, etc).
 */
export async function getTenantPlanSlug(tenantId: string): Promise<string | null> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      billingBypassEnabled: true,
      subscription: {
        select: {
          plan: {
            select: { slug: true },
          },
        },
      },
    },
  });

  if (!tenant || tenant.billingBypassEnabled) {
    return null; // billing bypass = tudo liberado
  }

  return normalizePlanSlug(tenant.subscription?.plan?.slug) ?? tenant.subscription?.plan?.slug ?? null;
}

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
      customPermissions: true,
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

  const permissionSnapshot = getEffectivePermissionSnapshot(
    dbUser.role,
    dbUser.customPermissions,
    dbUser.modulePermissions
  );

  return {
    id: dbUser.id,
    tenantId: dbUser.tenantId,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    globalRole: dbUser.globalRole ?? null,
    customPermissions: permissionSnapshot.customPermissions,
    moduleAccess: permissionSnapshot.moduleAccess,
    allowedModules: permissionSnapshot.allowedModules,
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
  module: TenantModule,
  action: PermissionAction = "view"
): Promise<SessionUserWithAccess> {
  const sessionUser = await requireAuth();
  const user = await loadSessionUserWithAccess(sessionUser);

  if (!user) {
    throw new Error("Não autorizado.");
  }

  const allowed =
    action === "view"
      ? user.moduleAccess[module]
      : hasPermission(user.customPermissions, getPermissionPathForModule(module), action);

  if (!allowed) {
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
    redirect(getDefaultAccessibleHref(user.customPermissions, user.allowedModules));
  }

  return user;
}

export async function requirePermission(
  path: PermissionPath,
  action: PermissionAction = "view"
): Promise<SessionUserWithAccess> {
  const sessionUser = await requireAuth();
  const user = await loadSessionUserWithAccess(sessionUser);

  if (!user || !hasPermission(user.customPermissions, path, action)) {
    throw new Error(`Acesso restrito à permissão ${path}:${action}.`);
  }

  return user;
}

export async function getAuthUserForPermission(
  path: PermissionPath,
  action: PermissionAction = "view"
): Promise<SessionUserWithAccess> {
  const user = await getAuthUserWithAccess();

  if (!hasPermission(user.customPermissions, path, action)) {
    redirect(getDefaultAccessibleHref(user.customPermissions, user.allowedModules));
  }

  return user;
}

function getPermissionPathForModule(module: TenantModule): PermissionPath {
  switch (module) {
    case "DASHBOARD":
      return "dashboard";
    case "AGENDA":
      return "agenda";
    case "CLIENTES":
      return "clientes";
    case "PROFISSIONAIS":
      return "profissionais";
    case "SERVICOS":
      return "servicos";
    case "PACOTES":
      return "pacotes";
    case "PRODUTOS":
      return "produtos";
    case "COMISSOES":
      return "financeiro";
    case "ESTOQUE":
      return "estoque";
    case "PRONTUARIOS":
      return "prontuarios";
    case "ATENDENTE_IA":
      return "atendente_ia";
    case "CONFIGURACOES":
      return "configuracoes";
    default:
      return "dashboard";
  }
}
