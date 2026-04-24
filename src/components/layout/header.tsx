"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronsUpDown, LogOut, Menu } from "lucide-react";

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

  const displayTenantName = tenantName ?? "Receps Admin";
  const tenantInitial = displayTenantName.trim().charAt(0).toUpperCase() || "R";

  return (
    <header
      className={
        "relative flex h-16 items-center justify-between bg-background px-4 sm:px-8 " +
        // Hairline gradient underline — fades at edges, violet accent at center.
        "after:pointer-events-none after:absolute after:bottom-0 after:left-4 after:right-4 after:h-px sm:after:left-8 sm:after:right-8 " +
        "after:bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.06)_15%,rgba(139,92,246,0.28)_50%,rgba(15,23,42,0.06)_85%,transparent)] " +
        "dark:after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1)_15%,rgba(139,92,246,0.28)_50%,rgba(255,255,255,0.1)_85%,transparent)]"
      }
    >
      <div className="flex min-w-0 items-center gap-2">
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

        <div
          className="inline-flex min-w-0 items-center gap-2.5 rounded-full py-1 pl-1 pr-3.5 transition-colors duration-[180ms] hover:bg-[rgba(139,92,246,0.06)] dark:hover:bg-[rgba(139,92,246,0.08)]"
          title={displayTenantName}
        >
          <span
            aria-hidden="true"
            className="relative grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[9px] bg-[linear-gradient(135deg,#8B5CF6_0%,#6223CF_100%)] text-[13px] font-extrabold tracking-[-0.02em] text-white shadow-[0_4px_10px_rgba(139,92,246,0.32)]"
          >
            {tenantInitial}
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_var(--background)]"
            />
          </span>
          <div className="flex min-w-0 flex-col leading-[1.15]">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Estabelecimento
            </span>
            <span className="mt-px truncate text-[13.5px] font-bold tracking-[-0.015em] text-foreground">
              {displayTenantName}
            </span>
          </div>
          <ChevronsUpDown
            aria-hidden="true"
            className="ml-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70"
          />
        </div>
      </div>

      <div
        className="flex items-center gap-3.5 pl-4 text-[13px] text-muted-foreground sm:gap-[14px]"
        title={`${userName} • ${roleLabel(userRole)}`}
      >
        <span className="hidden sm:inline">{userEmail}</span>
        <span
          aria-hidden="true"
          className="hidden h-[18px] w-px bg-[rgba(15,23,42,0.1)] sm:inline-block dark:bg-[rgba(255,255,255,0.08)]"
        />
        <ThemeToggle />
        <span
          aria-hidden="true"
          className="hidden h-[18px] w-px bg-[rgba(15,23,42,0.1)] sm:inline-block dark:bg-[rgba(255,255,255,0.08)]"
        />
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
