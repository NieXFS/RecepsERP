import { withAuth } from "next-auth/middleware";

/**
 * Proxy do NextAuth — protege todas as rotas autenticadas da aplicação.
 * Redireciona para /login se o usuário não estiver autenticado.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agenda/:path*",
    "/appointments/:path*",
    "/clientes/:path*",
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
    "/painel-receps/:path*",
  ],
};
