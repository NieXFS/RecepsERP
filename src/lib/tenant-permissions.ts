import { z } from "zod";
import type { Role, TenantModule } from "@/generated/prisma/enums";
import type { ModuleAccessMap } from "@/lib/tenant-modules";
import { TENANT_MODULE_VALUES } from "@/lib/tenant-modules";

export type PermissionAction = "view" | "edit";

export type PermissionScope = {
  view: boolean;
  edit: boolean;
};

export type FinanceSubmoduleKey =
  | "geral"
  | "comissoes"
  | "despesas"
  | "extrato"
  | "caixa";

export type PermissionModuleKey =
  | "dashboard"
  | "agenda"
  | "clientes"
  | "profissionais"
  | "servicos"
  | "pacotes"
  | "produtos"
  | "financeiro"
  | "estoque"
  | "prontuarios"
  | "configuracoes";

export type PermissionPath =
  | PermissionModuleKey
  | `financeiro.${FinanceSubmoduleKey}`;

export type TenantCustomPermissions = {
  dashboard: PermissionScope;
  agenda: PermissionScope;
  clientes: PermissionScope;
  profissionais: PermissionScope;
  servicos: PermissionScope;
  pacotes: PermissionScope;
  produtos: PermissionScope;
  financeiro: PermissionScope & {
    sub: Record<FinanceSubmoduleKey, PermissionScope>;
  };
  estoque: PermissionScope;
  prontuarios: PermissionScope;
  configuracoes: PermissionScope;
};

type ModulePermissionOverride = {
  module: TenantModule;
  isAllowed: boolean;
};

const permissionScopeInputSchema = z
  .object({
    view: z.boolean().optional(),
    edit: z.boolean().optional(),
  })
  .partial();

export const customPermissionsSchema = z
  .object({
    dashboard: permissionScopeInputSchema.optional(),
    agenda: permissionScopeInputSchema.optional(),
    clientes: permissionScopeInputSchema.optional(),
    profissionais: permissionScopeInputSchema.optional(),
    servicos: permissionScopeInputSchema.optional(),
    pacotes: permissionScopeInputSchema.optional(),
    produtos: permissionScopeInputSchema.optional(),
    financeiro: permissionScopeInputSchema
      .extend({
        sub: z
          .object({
            geral: permissionScopeInputSchema.optional(),
            comissoes: permissionScopeInputSchema.optional(),
            despesas: permissionScopeInputSchema.optional(),
            extrato: permissionScopeInputSchema.optional(),
            caixa: permissionScopeInputSchema.optional(),
          })
          .partial()
          .optional(),
      })
      .optional(),
    estoque: permissionScopeInputSchema.optional(),
    prontuarios: permissionScopeInputSchema.optional(),
    configuracoes: permissionScopeInputSchema.optional(),
  })
  .partial();

export const FINANCIAL_SUBMODULE_DEFINITIONS = [
  {
    key: "geral",
    label: "Geral",
    description: "Visão executiva do financeiro, cards de resumo e atalhos do módulo.",
    href: "/financeiro",
  },
  {
    key: "comissoes",
    label: "Comissões",
    description: "Comissões pendentes, repasses e fechamento por profissional.",
    href: "/financeiro/comissoes",
  },
  {
    key: "despesas",
    label: "Despesas",
    description: "Cadastro, pagamento e acompanhamento das despesas operacionais.",
    href: "/financeiro/despesas",
  },
  {
    key: "extrato",
    label: "Extrato",
    description: "Consulta de lançamentos por período, status e conta financeira.",
    href: "/financeiro/extrato",
  },
  {
    key: "caixa",
    label: "Caixa",
    description: "Abertura, fechamento, sangrias, suprimentos e conferência do caixa.",
    href: "/financeiro/caixa",
  },
] as const satisfies ReadonlyArray<{
  key: FinanceSubmoduleKey;
  label: string;
  description: string;
  href: string;
}>;

export const MODULE_KEY_BY_TENANT_MODULE = {
  DASHBOARD: "dashboard",
  AGENDA: "agenda",
  CLIENTES: "clientes",
  PROFISSIONAIS: "profissionais",
  SERVICOS: "servicos",
  PACOTES: "pacotes",
  PRODUTOS: "produtos",
  COMISSOES: "financeiro",
  ESTOQUE: "estoque",
  PRONTUARIOS: "prontuarios",
  CONFIGURACOES: "configuracoes",
} as const satisfies Record<TenantModule, PermissionModuleKey>;

const ALL_MODULE_KEYS = [
  "dashboard",
  "agenda",
  "clientes",
  "profissionais",
  "servicos",
  "pacotes",
  "produtos",
  "financeiro",
  "estoque",
  "prontuarios",
  "configuracoes",
] as const satisfies readonly PermissionModuleKey[];

const FINANCE_SUBMODULE_KEYS = FINANCIAL_SUBMODULE_DEFINITIONS.map(
  (item) => item.key
) as readonly FinanceSubmoduleKey[];

function createPermissionScope(view = false, edit = false): PermissionScope {
  return { view, edit };
}

function clonePermissionScope(scope: PermissionScope): PermissionScope {
  return {
    view: scope.view,
    edit: scope.edit,
  };
}

function clonePermissions(permissions: TenantCustomPermissions): TenantCustomPermissions {
  return {
    dashboard: clonePermissionScope(permissions.dashboard),
    agenda: clonePermissionScope(permissions.agenda),
    clientes: clonePermissionScope(permissions.clientes),
    profissionais: clonePermissionScope(permissions.profissionais),
    servicos: clonePermissionScope(permissions.servicos),
    pacotes: clonePermissionScope(permissions.pacotes),
    produtos: clonePermissionScope(permissions.produtos),
    financeiro: {
      ...clonePermissionScope(permissions.financeiro),
      sub: {
        geral: clonePermissionScope(permissions.financeiro.sub.geral),
        comissoes: clonePermissionScope(permissions.financeiro.sub.comissoes),
        despesas: clonePermissionScope(permissions.financeiro.sub.despesas),
        extrato: clonePermissionScope(permissions.financeiro.sub.extrato),
        caixa: clonePermissionScope(permissions.financeiro.sub.caixa),
      },
    },
    estoque: clonePermissionScope(permissions.estoque),
    prontuarios: clonePermissionScope(permissions.prontuarios),
    configuracoes: clonePermissionScope(permissions.configuracoes),
  };
}

function createEmptyPermissions(): TenantCustomPermissions {
  return {
    dashboard: createPermissionScope(),
    agenda: createPermissionScope(),
    clientes: createPermissionScope(),
    profissionais: createPermissionScope(),
    servicos: createPermissionScope(),
    pacotes: createPermissionScope(),
    produtos: createPermissionScope(),
    financeiro: {
      ...createPermissionScope(),
      sub: {
        geral: createPermissionScope(),
        comissoes: createPermissionScope(),
        despesas: createPermissionScope(),
        extrato: createPermissionScope(),
        caixa: createPermissionScope(),
      },
    },
    estoque: createPermissionScope(),
    prontuarios: createPermissionScope(),
    configuracoes: createPermissionScope(),
  };
}

function grantScope(
  permissions: TenantCustomPermissions,
  path: PermissionPath,
  config: Partial<PermissionScope>
) {
  const scope = getPermissionScope(permissions, path);

  if (config.view !== undefined) {
    scope.view = config.view;
  }

  if (config.edit !== undefined) {
    scope.edit = config.edit;
  }

  normalizeScope(scope);
}

function normalizeScope(scope: PermissionScope) {
  if (scope.edit) {
    scope.view = true;
  }

  if (!scope.view) {
    scope.edit = false;
  }
}

function getPermissionScope(
  permissions: TenantCustomPermissions,
  path: PermissionPath
): PermissionScope {
  if (path.startsWith("financeiro.")) {
    const submodule = path.split(".")[1] as FinanceSubmoduleKey;
    return permissions.financeiro.sub[submodule];
  }

  return permissions[path as PermissionModuleKey];
}

function mergeScope(
  base: PermissionScope,
  input?: Partial<PermissionScope>
): PermissionScope {
  if (input?.view !== undefined) {
    base.view = input.view;
  }

  if (input?.edit !== undefined) {
    base.edit = input.edit;
  }

  normalizeScope(base);
  return base;
}

function synchronizeFinancialRoot(permissions: TenantCustomPermissions) {
  if (permissions.financeiro.edit) {
    permissions.financeiro.view = true;
  }

  if (permissions.financeiro.view) {
    permissions.financeiro.sub.geral.view = true;
  }

  if (permissions.financeiro.edit) {
    permissions.financeiro.sub.geral.edit = true;
  }

  normalizeScope(permissions.financeiro.sub.geral);
}

function buildProfessionalDefaults() {
  const permissions = createEmptyPermissions();

  grantScope(permissions, "dashboard", { view: true, edit: true });
  grantScope(permissions, "agenda", { view: true, edit: true });
  grantScope(permissions, "clientes", { view: true, edit: true });
  grantScope(permissions, "prontuarios", { view: true, edit: true });
  grantScope(permissions, "financeiro.comissoes", { view: true, edit: false });

  return permissions;
}

function buildReceptionistDefaults() {
  const permissions = createEmptyPermissions();

  grantScope(permissions, "dashboard", { view: true, edit: true });
  grantScope(permissions, "agenda", { view: true, edit: true });
  grantScope(permissions, "clientes", { view: true, edit: true });
  grantScope(permissions, "servicos", { view: true, edit: true });
  grantScope(permissions, "pacotes", { view: true, edit: true });
  grantScope(permissions, "estoque", { view: true, edit: true });

  return permissions;
}

function buildAdminDefaults() {
  const permissions = createEmptyPermissions();

  for (const moduleKey of ALL_MODULE_KEYS) {
    grantScope(permissions, moduleKey, { view: true, edit: true });
  }

  for (const submoduleKey of FINANCE_SUBMODULE_KEYS) {
    grantScope(permissions, `financeiro.${submoduleKey}`, {
      view: true,
      edit: true,
    });
  }

  return permissions;
}

export function getDefaultCustomPermissions(role: Role): TenantCustomPermissions {
  switch (role) {
    case "ADMIN":
      return buildAdminDefaults();
    case "PROFESSIONAL":
      return buildProfessionalDefaults();
    case "RECEPTIONIST":
    default:
      return buildReceptionistDefaults();
  }
}

function applyLegacyModuleOverrides(
  permissions: TenantCustomPermissions,
  overrides: readonly ModulePermissionOverride[]
) {
  const nextPermissions = clonePermissions(permissions);

  for (const override of overrides) {
    const moduleKey = MODULE_KEY_BY_TENANT_MODULE[override.module];

    if (moduleKey === "financeiro") {
      mergeScope(nextPermissions.financeiro, {
        view: override.isAllowed,
        edit: override.isAllowed,
      });

      for (const submoduleKey of FINANCE_SUBMODULE_KEYS) {
        mergeScope(nextPermissions.financeiro.sub[submoduleKey], {
          view: override.isAllowed,
          edit: override.isAllowed,
        });
      }

      continue;
    }

    mergeScope(nextPermissions[moduleKey], {
      view: override.isAllowed,
      edit: override.isAllowed,
    });
  }

  return nextPermissions;
}

export function normalizeCustomPermissions(
  role: Role,
  input: unknown
): TenantCustomPermissions {
  const defaults = getDefaultCustomPermissions(role);
  const parsed = customPermissionsSchema.safeParse(input);

  if (!parsed.success || !parsed.data) {
    return defaults;
  }

  const nextPermissions = clonePermissions(defaults);

  for (const moduleKey of ALL_MODULE_KEYS) {
    if (moduleKey === "financeiro") {
      const financeInput = parsed.data.financeiro;

      if (financeInput) {
        mergeScope(nextPermissions.financeiro, financeInput);

        for (const submoduleKey of FINANCE_SUBMODULE_KEYS) {
          mergeScope(
            nextPermissions.financeiro.sub[submoduleKey],
            financeInput.sub?.[submoduleKey]
          );
        }
      }

      continue;
    }

    mergeScope(nextPermissions[moduleKey], parsed.data[moduleKey]);
  }

  synchronizeFinancialRoot(nextPermissions);
  return nextPermissions;
}

export function resolveEffectivePermissionSnapshot(
  role: Role,
  customPermissions: unknown,
  modulePermissions: readonly ModulePermissionOverride[]
) {
  const parsed = customPermissionsSchema.safeParse(customPermissions);
  const permissions = parsed.success && parsed.data
    ? normalizeCustomPermissions(role, parsed.data)
    : applyLegacyModuleOverrides(getDefaultCustomPermissions(role), modulePermissions);

  const moduleAccess = getModuleAccessMap(permissions);

  return {
    customPermissions: permissions,
    moduleAccess,
    allowedModules: listAllowedModules(moduleAccess),
  };
}

export function getModuleAccessMap(
  permissions: TenantCustomPermissions
): ModuleAccessMap {
  const financeVisible =
    permissions.financeiro.view ||
    FINANCE_SUBMODULE_KEYS.some((submoduleKey) => permissions.financeiro.sub[submoduleKey].view);

  return {
    DASHBOARD: permissions.dashboard.view,
    AGENDA: permissions.agenda.view,
    CLIENTES: permissions.clientes.view,
    PROFISSIONAIS: permissions.profissionais.view,
    SERVICOS: permissions.servicos.view,
    PACOTES: permissions.pacotes.view,
    PRODUTOS: permissions.produtos.view,
    COMISSOES: financeVisible,
    ESTOQUE: permissions.estoque.view,
    PRONTUARIOS: permissions.prontuarios.view,
    CONFIGURACOES: permissions.configuracoes.view,
  };
}

export function listAllowedModules(access: ModuleAccessMap): TenantModule[] {
  return TENANT_MODULE_VALUES.filter((module) => access[module]);
}

export function getDefaultModuleAccess(role: Role): ModuleAccessMap {
  return getModuleAccessMap(getDefaultCustomPermissions(role));
}

export function resolveEffectiveModuleAccess(
  role: Role,
  overrides: readonly ModulePermissionOverride[]
): ModuleAccessMap {
  return getModuleAccessMap(
    applyLegacyModuleOverrides(getDefaultCustomPermissions(role), overrides)
  );
}

export function hasPermission(
  permissions: TenantCustomPermissions,
  path: PermissionPath,
  action: PermissionAction = "view"
): boolean {
  if (path === "financeiro") {
    if (permissions.financeiro[action]) {
      return true;
    }

    return FINANCE_SUBMODULE_KEYS.some(
      (submoduleKey) => permissions.financeiro.sub[submoduleKey][action]
    );
  }

  return getPermissionScope(permissions, path)[action];
}

export function getPreferredModuleHref(
  module: TenantModule,
  permissions: TenantCustomPermissions
): string {
  if (module === "PRODUTOS") {
    return permissions.produtos.view ? "/produtos" : "/produtos/estoque";
  }

  if (module === "COMISSOES") {
    return getFirstAccessibleFinanceHref(permissions) ?? "/financeiro";
  }

  switch (module) {
    case "DASHBOARD":
      return "/dashboard";
    case "AGENDA":
      return "/agenda";
    case "CLIENTES":
      return "/clientes";
    case "PROFISSIONAIS":
      return "/profissionais";
    case "SERVICOS":
      return "/servicos";
    case "PACOTES":
      return "/pacotes";
    case "ESTOQUE":
      return "/produtos/estoque";
    case "PRONTUARIOS":
      return "/prontuarios";
    case "CONFIGURACOES":
      return "/configuracoes";
    default:
      return "/dashboard";
  }
}

export function getFirstAccessibleFinanceHref(
  permissions: TenantCustomPermissions
): string | null {
  if (hasPermission(permissions, "financeiro.geral", "view")) {
    return "/financeiro";
  }

  for (const item of FINANCIAL_SUBMODULE_DEFINITIONS.filter(
    (entry) => entry.key !== "geral"
  )) {
    if (hasPermission(permissions, `financeiro.${item.key}`, "view")) {
      return item.href;
    }
  }

  return permissions.financeiro.view ? "/financeiro" : null;
}

export function getDefaultAccessibleHref(
  permissions: TenantCustomPermissions,
  allowedModules: TenantModule[]
): string {
  const firstModule = allowedModules[0];
  return firstModule ? getPreferredModuleHref(firstModule, permissions) : "/login";
}

export function getModulePermissionOverrides(
  role: Role,
  customPermissions: TenantCustomPermissions
): ModulePermissionOverride[] {
  const defaults = getModuleAccessMap(getDefaultCustomPermissions(role));
  const access = getModuleAccessMap(customPermissions);

  return TENANT_MODULE_VALUES.filter((module) => defaults[module] !== access[module]).map(
    (module) => ({
      module,
      isAllowed: access[module],
    })
  );
}
