import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Receps — Gestão Premium para Clínicas e Estéticas",
  description:
    "Sistema de gestão premium com ERP financeiro e Atendente IA no WhatsApp para clínicas de estética, odontologia, barbearias, salões, centros estéticos e estúdios. Agende, controle e cresça no piloto automático.",
  other: {
    "facebook-domain-verification": "tg7vs0ai92i3y8w1fpelfhsge1q4ur",
  },
};

/**
 * Route group isolado para a landing page da marca.
 * Não usa MarketingNav/SiteFooter — a landing traz seu próprio header e footer.
 */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={jakarta.variable}>{children}</div>;
}
