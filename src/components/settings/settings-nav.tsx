"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Role, TenantModule } from "@/generated/prisma/enums";
import {
  Building2,
  CreditCard,
  Gift,
  Landmark,
  type LucideIcon,
  Palette,
  Store,
  UserRound,
} from "lucide-react";

type SettingsTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  module?: TenantModule;
  adminOnly?: boolean;
  personal?: boolean;
};

const tabs: SettingsTab[] = [
  {
    href: "/configuracoes/conta",
    label: "Conta",
    icon: UserRound,
    personal: true,
  },
  {
    href: "/configuracoes/negocio",
    label: "Negócio",
    icon: Store,
    module: "CONFIGURACOES",
    adminOnly: true,
  },
  {
    href: "/configuracoes/aparencia",
    label: "Aparência",
    icon: Palette,
    module: "CONFIGURACOES",
  },
  {
    href: "/configuracoes/recursos",
    label: "Salas & Equipamentos",
    icon: Building2,
    module: "CONFIGURACOES",
  },
  {
    href: "/configuracoes/contas",
    label: "Contas Bancárias",
    icon: Landmark,
    module: "CONFIGURACOES",
    adminOnly: true,
  },
  {
    href: "/configuracoes/assinatura",
    label: "Assinatura",
    icon: CreditCard,
    module: "CONFIGURACOES",
  },
  {
    href: "/configuracoes/indicacoes",
    label: "Indicações",
    icon: Gift,
    module: "CONFIGURACOES",
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
        .filter(
          (tab) =>
            tab.personal ||
            (tab.module && visibleModules.has(tab.module) && (!tab.adminOnly || role === "ADMIN"))
        )
        .map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
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
