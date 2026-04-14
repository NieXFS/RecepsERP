import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";
import { getSubscriptionStatus } from "@/services/billing.service";

const BILLING_EXEMPT_PATH_PREFIXES = [
  "/assinatura/bloqueada",
  "/logout",
] as const;

function isBillingExemptPath(pathname: string) {
  return BILLING_EXEMPT_PATH_PREFIXES.some((prefix) =>
    pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix)
  );
}

/**
 * Proxy do NextAuth — protege todas as rotas autenticadas da aplicação.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export default withAuth(
  async function proxy(request) {
    const pathname = request.nextUrl.pathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-receps-pathname", pathname);

    const token = request.nextauth.token;

    if (
      token?.tenantId &&
      token.globalRole !== "SUPER_ADMIN" &&
      !isBillingExemptPath(pathname)
    ) {
      const subscriptionStatus = await getSubscriptionStatus(String(token.tenantId));

      if (!subscriptionStatus.hasAccess) {
        const blockedUrl = request.nextUrl.clone();
        blockedUrl.pathname = "/assinatura/bloqueada";
        blockedUrl.searchParams.set("status", subscriptionStatus.status);
        blockedUrl.searchParams.set("reason", subscriptionStatus.reason);

        return NextResponse.redirect(blockedUrl);
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/appointments/:path*",
    "/clientes/:path*",
    "/profissionais/:path*",
    "/servicos/:path*",
    "/pacotes/:path*",
    "/produtos/:path*",
    "/comissoes/:path*",
    "/prontuarios/:path*",
    "/professionals/:path*",
    "/services/:path*",
    "/packages/:path*",
    "/products/:path*",
    "/financial/:path*",
    "/financeiro/:path*",
    "/inventory/:path*",
    "/estoque/:path*",
    "/records/:path*",
    "/settings/:path*",
    "/configuracoes/:path*",
    "/assinatura/:path*",
    "/painel-receps/:path*",
  ],
};
