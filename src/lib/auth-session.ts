import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import type { GlobalRole, Role } from "@/generated/prisma/enums";

const AUTH_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function getSessionCookieConfig() {
  const secureCookie =
    process.env.NEXTAUTH_URL?.startsWith("https://") ?? Boolean(process.env.VERCEL);

  return {
    secureCookie,
    cookieName: secureCookie
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token",
  };
}

function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("NEXTAUTH_SECRET não configurado.");
  }

  return secret;
}

export async function startUserSession(input: {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  globalRole?: GlobalRole | null;
}) {
  const { secureCookie, cookieName } = getSessionCookieConfig();
  const sessionToken = await encode({
    secret: getAuthSecret(),
    maxAge: AUTH_SESSION_MAX_AGE,
    token: {
      sub: input.id,
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      role: input.role,
      globalRole: input.globalRole ?? null,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: secureCookie,
    maxAge: AUTH_SESSION_MAX_AGE,
  });
}
