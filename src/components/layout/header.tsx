"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type HeaderProps = {
  tenantName?: string;
  userName: string;
  userEmail: string;
  userRole: string;
  sidebarProps?: Omit<SidebarProps, "className" | "collapsed" | "onNavigate">;
};

/** Barra superior do dashboard — destaca o tenant atual e mantém o usuário como contexto secundário. */
export function Header({
  tenantName,
  userName,
  userEmail,
  userRole,
  sidebarProps,
}: HeaderProps) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {sidebarProps && (
          <Sheet open={sheetOpen} onOpenChange={(open) => setSheetOpen(open)}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Abrir menu de navegação"
                />
              }
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <Sidebar
                {...sidebarProps}
                collapsed={false}
                className="w-full border-r-0"
                onNavigate={() => setSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        <p className="truncate text-base font-semibold text-foreground sm:text-lg">
          {tenantName ?? "Estabelecimento"}
        </p>
      </div>

      <div
        className="flex items-center gap-3 pl-4"
        title={`${userName} • ${roleLabel(userRole)}`}
      >
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
          <LogOut className="h-4 w-4" aria-hidden="true" />
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
