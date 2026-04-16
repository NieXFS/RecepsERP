import Link from "next/link";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner";
import { MarketingHeaderActions } from "@/components/marketing/marketing-header-actions";
import { SiteFooter } from "@/components/marketing/site-footer";
import { WhatsAppFab } from "@/components/support/whatsapp-fab";

const navigation = [
  { href: "/", label: "Receps" },
  { href: "/atendentes-ia", label: "Atendentes IA" },
  { href: "/erp", label: "ERP" },
];

/**
 * Layout público institucional da Receps.
 * Organiza as páginas comerciais da marca sem acoplar a navegação ao app autenticado.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
              R
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Receps</p>
              <p className="text-xs text-muted-foreground">Plataforma comercial + operação</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <MarketingHeaderActions />
        </div>
      </header>

      <main>{children}</main>

      <SiteFooter />
      <CookieConsentBanner />
      <WhatsAppFab prefilledMessage="Oi! Vim do site do Receps e queria tirar uma dúvida." />
    </div>
  );
}
