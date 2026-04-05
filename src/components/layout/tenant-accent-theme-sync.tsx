"use client";

import { useEffect } from "react";
import type { TenantAccentTheme } from "@/generated/prisma/enums";

/**
 * Sincroniza a paleta do tenant no elemento raiz do documento.
 * Isso garante que portais/modais do dashboard herdem a mesma identidade visual.
 */
export function TenantAccentThemeSync({
  accentTheme,
}: {
  accentTheme: TenantAccentTheme;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.getAttribute("data-accent-theme");

    root.setAttribute("data-accent-theme", accentTheme);

    return () => {
      if (previousTheme) {
        root.setAttribute("data-accent-theme", previousTheme);
      } else {
        root.removeAttribute("data-accent-theme");
      }
    };
  }, [accentTheme]);

  return null;
}
