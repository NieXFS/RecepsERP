"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role, TenantModule } from "@/generated/prisma/enums";
import { Palette, Users, Scissors, Building2, Landmark } from "lucide-react";

const tabs = [
  {
    href: "/configuracoes/aparencia",
    label: "Aparência",
    icon: Palette,
    module: "CONFIGURACOES" as TenantModule,
  },
  {
    href: "/configuracoes/equipe",
    label: "Equipe",
    icon: Users,
    module: "PROFISSIONAIS" as TenantModule,
  },
  {
    href: "/configuracoes/servicos",
    label: "Serviços",
    icon: Scissors,
    module: "SERVICOS" as TenantModule,
  },
  {
    href: "/configuracoes/recursos",
    label: "Salas & Equipamentos",
    icon: Building2,
    module: "CONFIGURACOES" as TenantModule,
  },
  {
    href: "/configuracoes/contas",
    label: "Contas Bancárias",
    icon: Landmark,
    module: "CONFIGURACOES" as TenantModule,
    adminOnly: true,
  },
];

/**
 * Sub-navegação das Configurações — tabs horizontais que acompanham
 * as sub-rotas do layout aninhado e respeitam os módulos liberados.
 */
export function SettingsNav({
  allowedModules,
  role,
}: {
  allowedModules: TenantModule[];
  role: Role;
}) {
  const pathname = usePathname();
  const visibleModules = new Set(allowedModules);

  return (
    <nav className="flex gap-1 border-b">
      {tabs
        .filter((tab) => visibleModules.has(tab.module) && (!tab.adminOnly || role === "ADMIN"))
        .map((tab) => {
          const isActive = pathname?.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
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
