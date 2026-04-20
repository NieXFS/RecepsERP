import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/landing.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_URL = "https://receps.com.br";
const TITLE = "Receps — Gestão Premium para Clínicas e Estéticas";
const DESCRIPTION =
  "Sistema de gestão premium com ERP financeiro e Atendente IA no WhatsApp para clínicas de estética, odontologia, barbearias, salões, centros estéticos e estúdios. Agende, controle e cresça no piloto automático.";
const OG_IMAGE = "/og-combo.svg";
const OG_ALT = "Receps — Gestão para clínicas e estética";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "ERP clínica",
    "ERP clínica de estética",
    "sistema para clínica estética",
    "atendente IA WhatsApp",
    "recepcionista virtual",
    "agendamento automático WhatsApp",
    "gestão para barbearia",
    "sistema para salão de beleza",
    "ERP odontológico",
    "sistema de comissões",
    "fluxo de caixa clínica",
    "gestão para consultório",
    "chatbot WhatsApp clínica",
    "software para estética",
    "Receps",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Receps",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: OG_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  other: {
    "facebook-domain-verification": "tg7vs0ai92i3y8w1fpelfhsge1q4ur",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Receps",
  url: SITE_URL,
  logo: `${SITE_URL}/landing-wordmark.svg`,
  sameAs: [
    "https://app.receps.com.br",
    "https://wa.me/5516991113783",
  ],
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Receps",
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  url: SITE_URL,
  offers: [
    {
      "@type": "Offer",
      name: "Atendente IA",
      price: "149.99",
      priceCurrency: "BRL",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "149.99",
        priceCurrency: "BRL",
        unitCode: "MON",
      },
      category: "subscription",
      url: `${SITE_URL}/atendentes-ia`,
    },
    {
      "@type": "Offer",
      name: "ERP",
      price: "219.99",
      priceCurrency: "BRL",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "219.99",
        priceCurrency: "BRL",
        unitCode: "MON",
      },
      category: "subscription",
      url: `${SITE_URL}/erp`,
    },
    {
      "@type": "Offer",
      name: "Atendente IA + ERP",
      price: "299.99",
      priceCurrency: "BRL",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "299.99",
        priceCurrency: "BRL",
        unitCode: "MON",
      },
      category: "subscription",
      url: `${SITE_URL}/erp-atendente-ia`,
    },
  ],
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
  return (
    <div className={jakarta.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      {children}
    </div>
  );
}
