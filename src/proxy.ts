import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";
import { withAuth } from "next-auth/middleware";
import { getSubscriptionStatus } from "@/services/billing.service";

// -------------------------------------------------------------------
// Marketing paths: quando acessadas via app.receps.com.br -> 308 para
// receps.com.br (subdominio canonico).
// -------------------------------------------------------------------
const MARKETING_EXACT_PATHS = new Set<string>([
  "/erp",
  "/atendentes-ia",
  "/erp-atendente-ia",
  "/cadastro",
  "/termos",
  "/privacidade",
  "/solicitar-acesso",
  "/aguarde-aprovacao",
]);

function isMarketingPath(pathname: string): boolean {
  if (MARKETING_EXACT_PATHS.has(pathname)) return true;
  if (pathname === "/ajuda" || pathname.startsWith("/ajuda/")) return true;
  return false;
}

// -------------------------------------------------------------------
// Auth-protected prefixes: identicos ao matcher original do withAuth.
// -------------------------------------------------------------------
const AUTH_PREFIXES = [
  "/dashboard",
  "/agenda",
  "/appointments",
  "/clientes",
  "/profissionais",
  "/servicos",
  "/pacotes",
  "/produtos",
  "/comissoes",
  "/prontuarios",
  "/professionals",
  "/services",
  "/packages",
  "/products",
  "/financial",
  "/financeiro",
  "/inventory",
  "/estoque",
  "/records",
  "/settings",
  "/configuracoes",
  "/assinatura",
  "/painel-receps",
  "/bem-vindo",
];

function isAuthProtectedPath(pathname: string): boolean {
  return AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

// -------------------------------------------------------------------
// Billing exemptions (identico ao original).
// -------------------------------------------------------------------
const BILLING_EXEMPT_PATH_PREFIXES = [
  "/assinatura/bloqueada",
  "/logout",
  "/bem-vindo",
] as const;

function isBillingExemptPath(pathname: string) {
  return BILLING_EXEMPT_PATH_PREFIXES.some((prefix) =>
    pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix)
  );
}

// -------------------------------------------------------------------
// Handler do withAuth - mesma logica do arquivo original, so extraida
// para ser chamada manualmente nos paths protegidos.
// -------------------------------------------------------------------
const authHandler = withAuth(
  async function authProxy(request) {
    const pathname = request.nextUrl.pathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-receps-pathname", pathname);

    const token = request.nextauth.token;
    if (
      token?.tenantId &&
      token.globalRole !== "SUPER_ADMIN" &&
      !isBillingExemptPath(pathname)
    ) {
      const subscriptionStatus = await getSubscriptionStatus(
        String(token.tenantId)
      );
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

// -------------------------------------------------------------------
// Proxy principal:
//  1. Se vier via app.receps.com.br e for rota de marketing -> 308
//     para receps.com.br/<mesmo-path>.
//  2. Se vier via app.receps.com.br e for "/" -> 307 para /login.
//  3. Se path estiver em AUTH_PREFIXES -> delega pro withAuth
//     (NextAuth + billing check).
//  4. Qualquer outra coisa -> NextResponse.next() sem tocar.
// -------------------------------------------------------------------
export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent
) {
  const pathname = request.nextUrl.pathname;
  const host = (request.headers.get("host") ?? "").toLowerCase();
  const isAppSubdomain = host.startsWith("app.");

  if (pathname === "/assinar" || pathname === "/assinar/") {
    const target = new URL(
      "/erp-atendente-ia" + request.nextUrl.search,
      "https://receps.com.br"
    );
    return NextResponse.redirect(target, 308);
  }

  if (isAppSubdomain) {
    if (isMarketingPath(pathname)) {
      const targetUrl = new URL(
        pathname + request.nextUrl.search,
        "https://receps.com.br"
      );
      return NextResponse.redirect(targetUrl, 308);
    }
    if (pathname === "/") {
      const loginUrl = new URL(
        "/login" + request.nextUrl.search,
        "https://app.receps.com.br"
      );
      return NextResponse.redirect(loginUrl, 307);
    }
  }

  if (isAuthProtectedPath(pathname)) {
    return (
      authHandler as unknown as (
        req: NextRequest,
        ev: NextFetchEvent
      ) => Promise<Response>
    )(request, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Todas as rotas exceto APIs, assets estaticos do Next e arquivos com extensao.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
