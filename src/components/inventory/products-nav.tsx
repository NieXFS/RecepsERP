"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TenantModule } from "@/generated/prisma/enums";
import { Boxes, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductsNavProps = {
  allowedModules: TenantModule[];
};

const tabs = [
  {
    href: "/produtos",
    label: "Geral",
    icon: Boxes,
    module: "PRODUTOS" as const,
  },
  {
    href: "/produtos/estoque",
    label: "Estoque",
    icon: Warehouse,
    module: "ESTOQUE" as const,
  },
];

/**
 * Subnavegação do módulo Produtos.
 * Mantém o agrupamento entre cadastro mestre e operação de estoque.
 */
export function ProductsNav({ allowedModules }: ProductsNavProps) {
  const pathname = usePathname();
  const allowedSet = new Set(allowedModules);

  const visibleTabs = tabs.filter((tab) => allowedSet.has(tab.module));

  return (
    <nav className="flex gap-1 border-b">
      {visibleTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/produtos"
            ? pathname === "/produtos"
            : pathname === tab.href || pathname?.startsWith(tab.href + "/");

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
