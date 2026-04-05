"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Providers globais da aplicação (Client Component).
 * Envolve a aplicação com ThemeProvider para suporte a dark/light mode.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
