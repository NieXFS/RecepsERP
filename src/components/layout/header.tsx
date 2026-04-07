"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type HeaderProps = {
  tenantName?: string;
  userName: string;
  userEmail: string;
  userRole: string;
};

/** Barra superior do dashboard — destaca o tenant atual e mantém o usuário como contexto secundário. */
export function Header({ tenantName, userName, userEmail, userRole }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-foreground sm:text-lg">
          {tenantName ?? "Estabelecimento"}
        </p>
      </div>

      <div className="flex items-center gap-3 pl-4">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {userEmail}
        </span>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Admin",
    RECEPTIONIST: "Recepcionista",
    PROFESSIONAL: "Profissional",
  };
  return labels[role] ?? role;
}
