"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, MailPlus, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/painel-receps",
    label: "Visão Geral",
    icon: BarChart3,
    match: (pathname: string) => pathname === "/painel-receps",
  },
  {
    href: "/painel-receps/clientes",
    label: "Clientes",
    icon: Building2,
    match: (pathname: string) => pathname.startsWith("/painel-receps/clientes"),
  },
  {
    href: "/painel-receps/leads",
    label: "Leads",
    icon: UsersRound,
    match: (pathname: string) => pathname.startsWith("/painel-receps/leads"),
  },
  {
    href: "/painel-receps/convites",
    label: "Convites",
    icon: MailPlus,
    match: (pathname: string) => pathname.startsWith("/painel-receps/convites"),
  },
];

/**
 * Navegação lateral enxuta do painel global da Receps.
 * Mantém overview, clientes, leads e convites claramente separados.
 */
export function RecepsPanelNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.match(pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
