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
  /** Grupo visual para separadores. A ordem dos grupos é: main, management, bot, config. */
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

  // --- Atendente IA ---
  { module: "ATENDENTE_IA", href: "/atendente-ia", label: "Atendente IA", icon: Bot, group: "bot" },

  // --- Grupo clínico/config ---
  { module: "PRONTUARIOS", href: "/prontuarios", label: "Prontuários", icon: FileText, group: "config" },
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

  const mainItems = visibleItems.filter((i) => i.group === "main");
  const botItems = visibleItems.filter((i) => i.group === "bot");
  const managementItems = visibleItems.filter((i) => i.group === "management");
  const configItems = visibleItems.filter((i) => i.group === "config");
  const activeUpsellItem = upsellModule
    ? navItems.find((item) => item.module === upsellModule) ?? null
    : null;

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TooltipProvider delay={120}>
      <aside
        className={cn(
          "flex h-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out",
          collapsed ? "w-16" : "w-[260px]",
          className
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex items-center px-4 pb-5 pt-5",
            collapsed ? "justify-center" : "gap-2.5"
          )}
        >
          <span
            aria-hidden="true"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-[linear-gradient(135deg,#8B5CF6_0%,#6223CF_100%)] text-[16px] font-black tracking-[-0.04em] text-white shadow-[0_8px_20px_rgba(139,92,246,0.35)]"
          >
            R
          </span>
          {!collapsed && (
            <span className="text-[19px] font-extrabold tracking-[-0.03em] text-sidebar-foreground">
              receps
            </span>
          )}
          <span className="sr-only">Receps</span>
        </div>

        {/* Nav */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          <NavGroup
            items={mainItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />

          <NavDivider />
          <NavGroup
            items={managementItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />

          <NavDivider />
          <NavGroup
            items={botItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />

          <NavDivider />
          <NavGroup
            items={configItems}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
            onLockedItemClick={setUpsellModule}
          />
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "flex items-center px-4 py-4",
            collapsed ? "justify-center" : "gap-[11px]"
          )}
          title={collapsed ? `${userName} • ${roleLabel(userRole)}` : undefined}
        >
          <div
            aria-hidden="true"
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#8B5CF6,#6223CF)] text-sm font-bold text-white shadow-[0_0_0_2px_var(--sidebar),0_0_0_3px_rgba(139,92,246,0.3)]"
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-bold text-sidebar-foreground">
                {userName}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {roleLabel(userRole)}
              </div>
            </div>
          )}
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

/** Divisor de gradiente sutil entre grupos de navegação. */
function NavDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-3 my-3.5 h-px bg-[linear-gradient(90deg,transparent_0%,var(--sidebar-border)_20%,var(--sidebar-border)_80%,transparent_100%)]"
    />
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

        const baseClasses = collapsed
          ? "mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ease-out"
          : "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-200 ease-out";

        const stateClasses = item.isLocked
          ? "cursor-pointer text-muted-foreground opacity-60 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:opacity-90"
          : isActive
            ? "bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/35 dark:bg-primary/20 dark:text-sidebar-foreground dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-primary/30"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground";

        const itemClasses = cn(baseClasses, stateClasses);

        const content = collapsed ? (
          <>
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            {item.isLocked ? (
              <Lock className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full bg-background p-0.5 text-muted-foreground" />
            ) : null}
            <span className="sr-only">{item.label}</span>
          </>
        ) : (
          <>
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
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
