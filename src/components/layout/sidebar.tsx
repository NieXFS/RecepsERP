"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TenantModule } from "@/generated/prisma/enums";
import type { TenantCustomPermissions } from "@/lib/tenant-permissions";
import { getPreferredModuleHref } from "@/lib/tenant-permissions";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCog,
  Scissors,
  Package,
  ShoppingBag,
  Landmark,
  FileText,
  Settings,
  Bot,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/layout/brand-logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ModuleUpsellDialog,
  getModuleUpsellTooltip,
} from "@/components/layout/module-upsell-dialog";

type NavItem = {
  module: TenantModule;
  visibleForModules?: readonly TenantModule[];
  href: string;
  label: string;
  icon: LucideIcon;
  activePrefixes?: readonly string[];
  /** Grupo visual para separadores */
  group: "main" | "bot" | "management" | "config";
};

/**
 * Mapa visual da sidebar.
 * Todos os itens aparecem sempre; a assinatura decide se o item fica
 * liberado ou com estado visual de bloqueado/upsell.
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
  {
    module: "PRODUTOS",
    visibleForModules: ["PRODUTOS", "ESTOQUE"],
    href: "/produtos",
    label: "Produtos",
    icon: ShoppingBag,
    activePrefixes: ["/produtos", "/produtos/estoque"],
    group: "management",
  },
  {
    module: "COMISSOES",
    href: "/financeiro",
    label: "Financeiro",
    icon: Landmark,
    activePrefixes: ["/financeiro"],
    group: "management",
  },

  // --- Grupo clínico/config ---
  { module: "PRONTUARIOS", href: "/prontuarios", label: "Prontuários", icon: FileText, group: "config" },

  // --- Atendente IA ---
  { module: "ATENDENTE_IA", href: "/atendente-ia", label: "Atendente IA", icon: Bot, group: "bot" },

  // --- Configurações ---
  { module: "CONFIGURACOES", href: "/configuracoes", label: "Configurações", icon: Settings, group: "config" },
];

export type SidebarProps = {
  userRole: string;
  userName: string;
  allowedModules: TenantModule[];
  permissions: TenantCustomPermissions;
  collapsed?: boolean;
  className?: string;
  onNavigate?: () => void;
};

/** Sidebar com navegação filtrada por permissões efetivas de módulo. */
export function Sidebar({
  userRole,
  userName,
  allowedModules,
  permissions,
  collapsed = false,
  className,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const visibleModuleSet = new Set(allowedModules);
  const [upsellModule, setUpsellModule] = useState<TenantModule | null>(null);

  const visibleItems = navItems.map((item) => ({
    ...item,
    href: getPreferredModuleHref(item.module, permissions),
    isLocked: !(item.visibleForModules ?? [item.module]).some((module) =>
      visibleModuleSet.has(module)
    ),
  }));

  // Agrupa os itens visíveis
  const mainItems = visibleItems.filter((i) => i.group === "main");
  const botItems = visibleItems.filter((i) => i.group === "bot");
  const managementItems = visibleItems.filter((i) => i.group === "management");
  const configItems = visibleItems.filter((i) => i.group === "config");
  const activeUpsellItem = upsellModule
    ? navItems.find((item) => item.module === upsellModule) ?? null
    : null;

  return (
    <TooltipProvider delay={120}>
      <aside
        className={cn(
          "flex h-full flex-col overflow-hidden border-r bg-background transition-[width] duration-300 ease-out",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        {/* Logo e nome do tenant */}
        <div
          className={cn(
            "flex h-[64px] items-center border-b",
            collapsed ? "justify-center px-2" : "justify-center px-6"
          )}
        >
          {collapsed ? (
            <>
              <span className="sr-only">Receps</span>
              <span className="text-lg font-bold text-primary" aria-hidden="true">
                R
              </span>
            </>
          ) : (
            <BrandLogo className="max-w-full" />
          )}
        </div>

        {/* Navegação */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-3")}>
          <NavGroup
            items={mainItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />

          <Separator className="my-3" />
          {!collapsed && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gestão
            </p>
          )}
          <NavGroup
            items={managementItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />

          <Separator className="my-3" />
          <NavGroup
            items={botItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />

          <Separator className="my-3" />
          <NavGroup
            items={configItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />
        </nav>

        {/* Rodapé: info do usuário logado */}
        <div className="border-t p-4">
          <div
            className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}
            title={collapsed ? `${userName} • ${roleLabel(userRole)}` : undefined}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground">
                  {roleLabel(userRole)}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {activeUpsellItem ? (
        <ModuleUpsellDialog
          module={activeUpsellItem.module}
          icon={activeUpsellItem.icon}
          open={Boolean(upsellModule)}
          onOpenChange={(open) => {
            if (!open) {
              setUpsellModule(null);
            }
          }}
        />
      ) : null}
    </TooltipProvider>
  );
}

/** Renderiza uma lista de links de navegação */
function NavGroup({
  items,
  pathname,
  collapsed,
  onNavigate,
  onLockedItemClick,
}: {
  items: (NavItem & { isLocked: boolean })[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
  onLockedItemClick: (module: TenantModule) => void;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const activePrefixes = item.activePrefixes ?? [item.href];
        const isActive = activePrefixes.some((prefix) =>
          pathname === prefix || pathname?.startsWith(prefix + "/")
        );
        const Icon = item.icon;
        const tooltipLabel = item.isLocked ? getModuleUpsellTooltip(item.module) : null;
        const itemClasses = cn(
          collapsed
            ? "mx-auto flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ease-out"
            : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
          item.isLocked
            ? "cursor-pointer text-muted-foreground/70 opacity-60 hover:bg-muted/70 hover:text-foreground hover:opacity-90"
            : isActive
              ? "translate-x-0.5 bg-primary text-primary-foreground shadow-sm"
              : "translate-x-0 text-muted-foreground hover:bg-muted hover:text-foreground"
        );

        const content = collapsed ? (
          <>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.isLocked ? (
              <Lock className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full bg-background p-0.5 text-muted-foreground" />
            ) : null}
            <span className="sr-only">{item.label}</span>
          </>
        ) : (
          <>
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.isLocked ? (
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : null}
          </>
        );

        if (item.isLocked) {
          const trigger = (
            <button
              key={item.href}
              type="button"
              title={collapsed ? item.label : undefined}
              className={cn(itemClasses, collapsed ? "relative" : undefined, "w-full")}
              onClick={() => onLockedItemClick(item.module)}
            >
              {content}
            </button>
          );

          return tooltipLabel ? (
            <Tooltip key={item.href}>
              <TooltipTrigger render={trigger} />
              <TooltipContent>{tooltipLabel}</TooltipContent>
            </Tooltip>
          ) : (
            trigger
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
            className={itemClasses}
          >
            {content}
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
