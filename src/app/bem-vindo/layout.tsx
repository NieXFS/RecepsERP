import type { ReactNode } from "react";

/**
 * Layout isolado do wizard de setup inicial.
 * Não renderiza sidebar nem header do dashboard — apenas um shell
 * full-screen pra manter o foco do usuário no fluxo de configuração.
 */
export default function WelcomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
      {children}
    </div>
  );
}
