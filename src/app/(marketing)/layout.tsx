import { Plus_Jakarta_Sans } from "next/font/google";
import { CookieConsentBanner } from "@/components/marketing/cookie-consent-banner";
import { SiteFooter } from "@/components/marketing/site-footer";
import SiteHeader from "@/components/marketing/site-header";
import { WhatsAppFab } from "@/components/support/whatsapp-fab";
import "@/styles/landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

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
    <div className={`${jakarta.variable} min-h-screen bg-background`}>
      <SiteHeader />

      <main className="pt-[5.5rem] md:pt-[6rem]">{children}</main>

      <SiteFooter />
      <CookieConsentBanner />
      <WhatsAppFab prefilledMessage="Oi! Vim do site do Receps e queria tirar uma dúvida." />
    </div>
  );
}
