"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemePreferenceProvider } from "@/components/theme-preference-provider";

/**
 * Providers globais da aplicação (Client Component).
 * A decisão de tema (auto/claro/escuro) é feita pelo ThemePreferenceProvider;
 * o NextThemesProvider aplica somente os modos "light" e "dark" recebidos.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      themes={["light", "dark"]}
      enableSystem={false}
      disableTransitionOnChange
    >
      <ThemePreferenceProvider>{children}</ThemePreferenceProvider>
    </NextThemesProvider>
  );
}
