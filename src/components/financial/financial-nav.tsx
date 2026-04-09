"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartColumn,
  CircleDollarSign,
  ReceiptText,
  Tags,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hasPermission, type TenantCustomPermissions } from "@/lib/tenant-permissions";

const tabs = [
  {
    href: "/financeiro",
    label: "Geral",
    icon: ChartColumn,
    permission: "financeiro.geral",
  },
  {
    href: "/financeiro/comissoes",
    label: "Comissões",
    icon: WalletCards,
    permission: "financeiro.comissoes",
  },
  {
    href: "/financeiro/despesas",
    label: "Despesas",
    icon: Tags,
    permission: "financeiro.despesas",
  },
  {
    href: "/financeiro/extrato",
    label: "Extrato por datas",
    icon: ReceiptText,
    permission: "financeiro.extrato",
  },
  {
    href: "/financeiro/caixa",
    label: "Caixa",
    icon: CircleDollarSign,
    permission: "financeiro.caixa",
  },
] as const;

/**
 * Subnavegação do módulo Financeiro filtrada pelas permissões granulares.
 */
export function FinancialNav({
  permissions,
}: {
  permissions: TenantCustomPermissions;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {tabs
        .filter((tab) => hasPermission(permissions, tab.permission, "view"))
        .map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/financeiro"
              ? pathname === "/financeiro"
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
