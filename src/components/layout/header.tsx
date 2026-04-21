"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

/** Barra superior do dashboard — tenant como contexto discreto e ações do usuário. */
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
    <header className="flex h-16 items-center justify-between bg-background px-4 sm:px-8">
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
            <SheetContent side="left" className="w-[260px] p-0">
              <Sidebar
                {...sidebarProps}
                collapsed={false}
                className="w-full border-r-0"
                onNavigate={() => setSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        <p className="truncate text-[14px] font-medium text-muted-foreground">
          {tenantName ?? "Receps Admin"}
        </p>
      </div>

      <div
        className="flex items-center gap-4 pl-4 text-[13px] text-muted-foreground"
        title={`${userName} • ${roleLabel(userRole)}`}
      >
        <Link
          href="/ajuda"
          className="hidden font-medium transition-colors hover:text-foreground md:inline"
        >
          Ajuda
        </Link>
        <span className="hidden sm:inline">{userEmail}</span>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground"
        >
          <LogOut className="h-[15px] w-[15px]" aria-hidden="true" />
          <span className="hidden sm:inline">Sair</span>
        </button>
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
