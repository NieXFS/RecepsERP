"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";

import { switchBackToMasterAction } from "@/actions/account.actions";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAccountChip } from "@/components/layout/user-account-chip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type UserChipData = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
};

type HeaderProps = {
  tenantName?: string;
  activeUser: UserChipData & { hasPin: boolean };
  masterUser: UserChipData;
  sidebarProps?: Omit<SidebarProps, "className" | "collapsed" | "onNavigate">;
};

/** Barra superior do dashboard — tenant como contexto discreto e ações do usuário. */
export function Header({
  tenantName,
  activeUser,
  masterUser,
  sidebarProps,
}: HeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const displayTenantName = tenantName ?? "Receps Admin";

  async function handleLogout() {
    try {
      await switchBackToMasterAction();
    } finally {
      await signOut({ callbackUrl: "/login" });
    }
  }

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

        <UserAccountChip
          tenantName={displayTenantName}
          currentUser={activeUser}
          masterUser={masterUser}
        />
      </div>

      <div
        className="flex items-center gap-3.5 pl-4 text-[13px] text-muted-foreground sm:gap-[14px]"
        title={`${activeUser.name} • ${roleLabel(activeUser.role)}`}
      >
        <span className="hidden sm:inline">{activeUser.email}</span>
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
          onClick={() => void handleLogout()}
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
