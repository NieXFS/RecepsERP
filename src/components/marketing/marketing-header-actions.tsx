"use client";

import Link from "next/link";

export function MarketingHeaderActions() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Entrar
      </Link>

      <Link
        href="/assinar"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
      >
        Começar
      </Link>
    </div>
  );
}
