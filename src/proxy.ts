import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

/**
 * Proxy do NextAuth — protege todas as rotas autenticadas da aplicação.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export default withAuth(
  function proxy(request) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-receps-pathname", request.nextUrl.pathname);

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
