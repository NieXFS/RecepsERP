"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReferralCtaLink } from "@/components/marketing/referral-cta-link";

export function MarketingHeaderActions() {
  const pathname = usePathname();
  const isAtendentesIaPage = pathname === "/atendentes-ia";
  const isErpPage = pathname === "/erp";

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Entrar
      </Link>

      {isAtendentesIaPage ? (
        <ReferralCtaLink
          planSlug="somente-atendente-ia"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Assinar Atendente IA
        </ReferralCtaLink>
      ) : isErpPage ? (
        <ReferralCtaLink
          planSlug="somente-erp"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Assinar ERP
        </ReferralCtaLink>
      ) : (
        <Link
          href="/assinar"
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Assinar
        </Link>
      )}
    </div>
  );
}
