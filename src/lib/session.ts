import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { SessionUser } from "@/types";
import type { GlobalRole, Role } from "@/generated/prisma/enums";

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

/**
 * Retorna o usuário autenticado. Lança erro se não estiver logado.
 * Uso principal: Server Actions, onde o redirect não funciona diretamente.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await extractSession();
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
  const user = await extractSession();
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
  return extractSession();
}
