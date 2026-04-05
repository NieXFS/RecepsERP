"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TenantModule } from "@/generated/prisma/enums";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Scissors,
  Package,
  ShoppingBag,
  DollarSign,
  Warehouse,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  module: TenantModule;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Grupo visual para separadores */
  group: "main" | "management" | "config";
};

/**
 * Mapa visual da sidebar.
 * A visibilidade final de cada item depende do conjunto efetivo de módulos liberados.
 */
const navItems: NavItem[] = [
  // --- Grupo principal ---
  { module: "DASHBOARD", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { module: "AGENDA", href: "/agenda", label: "Agenda", icon: Calendar, group: "main" },
  { module: "CLIENTES", href: "/clientes", label: "Clientes", icon: Users, group: "main" },

  // --- Grupo gestão ---
  { module: "PROFISSIONAIS", href: "/profissionais", label: "Profissionais", icon: UserCog, group: "management" },
  { module: "SERVICOS", href: "/servicos", label: "Serviços", icon: Scissors, group: "management" },
  { module: "PACOTES", href: "/pacotes", label: "Pacotes", icon: Package, group: "management" },
  { module: "PRODUTOS", href: "/produtos", label: "Produtos", icon: ShoppingBag, group: "management" },
  { module: "COMISSOES", href: "/comissoes", label: "Comissões", icon: DollarSign, group: "management" },
  { module: "ESTOQUE", href: "/estoque", label: "Estoque", icon: Warehouse, group: "management" },

  // --- Grupo clínico/config ---
  { module: "PRONTUARIOS", href: "/prontuarios", label: "Prontuários", icon: FileText, group: "config" },
  { module: "CONFIGURACOES", href: "/configuracoes", label: "Configurações", icon: Settings, group: "config" },
];

type SidebarProps = {
  userRole: string;
  userName: string;
  tenantName?: string;
  allowedModules: TenantModule[];
};

/** Sidebar com navegação filtrada por permissões efetivas de módulo. */
export function Sidebar({
  userRole,
  userName,
  tenantName,
  allowedModules,
}: SidebarProps) {
  const pathname = usePathname();
  const visibleModuleSet = new Set(allowedModules);

  // Filtra itens com base nas permissões efetivas por módulo
  const visibleItems = navItems.filter((item) => visibleModuleSet.has(item.module));

  // Agrupa os itens visíveis
  const mainItems = visibleItems.filter((i) => i.group === "main");
  const managementItems = visibleItems.filter((i) => i.group === "management");
  const configItems = visibleItems.filter((i) => i.group === "config");

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo e nome do tenant */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          R
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">Receps ERP</span>
          {tenantName && (
            <span className="text-xs text-muted-foreground leading-tight truncate max-w-[140px]">
              {tenantName}
            </span>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto p-3">
        <NavGroup items={mainItems} pathname={pathname} />

        {managementItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gestão
            </p>
            <NavGroup items={managementItems} pathname={pathname} />
          </>
        )}

        {configItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <NavGroup items={configItems} pathname={pathname} />
          </>
        )}
      </nav>

      {/* Rodapé: info do usuário logado */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {roleLabel(userRole)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** Renderiza uma lista de links de navegação */
function NavGroup({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(item.href + "/");
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Traduz a role para um label legível */
function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    ADMIN: "Administrador",
    RECEPTIONIST: "Recepcionista",
    PROFESSIONAL: "Profissional",
  };
  return labels[role] ?? role;
}
