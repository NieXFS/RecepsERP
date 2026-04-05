"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

type HeaderProps = {
  userName: string;
  userEmail: string;
  userRole: string;
};

/** Barra superior do dashboard — dados do usuário, toggle de tema e logout */
export function Header({ userName, userEmail, userRole }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="text-sm text-muted-foreground">
        Olá, <span className="font-medium text-foreground">{userName}</span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          {roleLabel(userRole)}
        </Badge>
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
