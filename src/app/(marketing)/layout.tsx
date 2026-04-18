import Link from "next/link";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner";
import { MarketingHeaderActions } from "@/components/marketing/marketing-header-actions";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { WhatsAppFab } from "@/components/support/whatsapp-fab";

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
          <Link href="/" aria-label="Receps — página inicial" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_texto.svg" alt="Receps" className="h-9 max-h-8 w-auto" />
          </Link>

          <MarketingNav />

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
