import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { GlobalRole, Role } from "@/generated/prisma/enums";
import {
  clearActiveUserCookie,
  getActiveUserIdFromCookie,
} from "@/lib/active-user";
import { db } from "@/lib/db";

/**
 * Configuração central do NextAuth —
 * Usa CredentialsProvider com email/senha verificado via bcrypt contra o banco.
 * O JWT carrega tenantId, role e id para uso em Server Actions e middlewares,
 * eliminando a necessidade de query ao banco em cada request.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      /** Valida credenciais contra o banco — retorna null se inválidas */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            tenant: {
              select: {
                isActive: true,
                lifecycleStatus: true,
              },
            },
          },
        });

        if (
          !user ||
          !user.isActive ||
          user.deletedAt ||
          !user.tenant.isActive ||
          user.tenant.lifecycleStatus !== "ACTIVE"
        ) {
          return null;
        }

        // Verifica a senha com bcrypt (hash armazenado no campo passwordHash)
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
          globalRole: user.globalRole,
          avatarUrl: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    /** Injeta tenantId, id, role e globalRole no JWT para acesso em qualquer Server Component */
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = u.id as string;
        token.tenantId = u.tenantId as string;
        token.role = u.role as Role;
        token.globalRole = (u.globalRole as GlobalRole | null) ?? null;
        token.avatarUrl = (u.avatarUrl as string | null) ?? null;
      }

      // Retrocompatibilidade para sessões JWT criadas antes do PASSO 12.
      // Se o token não carregar globalRole (ou outros campos de contexto),
      // busca o usuário atual no banco e reidrata os claims necessários.
      if (
        token.email &&
        (!token.id ||
          !token.tenantId ||
          !token.role ||
          typeof token.globalRole === "undefined" ||
          typeof token.avatarUrl === "undefined")
      ) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            tenantId: true,
            role: true,
            globalRole: true,
            avatarUrl: true,
            isActive: true,
            deletedAt: true,
          },
        });

        if (dbUser && dbUser.isActive && !dbUser.deletedAt) {
          token.id = dbUser.id;
          token.tenantId = dbUser.tenantId;
          token.role = dbUser.role;
          token.globalRole = dbUser.globalRole ?? null;
          token.avatarUrl = dbUser.avatarUrl ?? null;
        }
      }

      return token;
    },
    /** Expõe tenantId, id, role e globalRole na session acessível via useSession() e getServerSession() */
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = token.id;
        u.tenantId = token.tenantId;
        u.role = token.role;
        u.globalRole = (token.globalRole as string | null) ?? null;
        u.avatarUrl = (token.avatarUrl as string | null) ?? null;

        const masterUser = {
          id: u.id as string,
          name: (u.name as string | null) ?? "",
          email: (u.email as string | null) ?? "",
          role: u.role as Role,
          avatarUrl: (u.avatarUrl as string | null) ?? null,
        };
        const activeUserId = await getActiveUserIdFromCookie();
        let activeUser: typeof masterUser | null = null;

        if (activeUserId && activeUserId !== masterUser.id) {
          const candidate = await db.user.findUnique({
            where: { id: activeUserId },
            select: {
              id: true,
              tenantId: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
              isActive: true,
              deletedAt: true,
            },
          });

          if (
            candidate &&
            candidate.tenantId === u.tenantId &&
            candidate.isActive &&
            !candidate.deletedAt
          ) {
            activeUser = {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              role: candidate.role,
              avatarUrl: candidate.avatarUrl,
            };
          }
        }

        session.activeUser = activeUser ?? masterUser;
        session.masterUserId = masterUser.id;
      }
      return session;
    },
  },
  events: {
    async signOut() {
      await clearActiveUserCookie();
    },
  },
};
