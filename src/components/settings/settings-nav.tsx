"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Palette, Users, Scissors, Building2 } from "lucide-react";

const tabs = [
  { href: "/configuracoes/aparencia", label: "Aparência", icon: Palette },
  { href: "/configuracoes/equipe", label: "Equipe", icon: Users },
  { href: "/configuracoes/servicos", label: "Serviços", icon: Scissors },
  { href: "/configuracoes/recursos", label: "Salas & Equipamentos", icon: Building2 },
];

/**
 * Sub-navegação das Configurações — tabs horizontais que acompanham
 * as sub-rotas do layout aninhado.
 */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const isActive = pathname?.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
