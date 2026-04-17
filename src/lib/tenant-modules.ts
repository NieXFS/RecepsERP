import type { Role, TenantModule } from "@/generated/prisma/enums";

export const TENANT_MODULE_VALUES = [
  "DASHBOARD",
  "AGENDA",
  "CLIENTES",
  "PROFISSIONAIS",
  "SERVICOS",
  "PACOTES",
  "PRODUTOS",
  "COMISSOES",
  "ESTOQUE",
  "PRONTUARIOS",
  "ATENDENTE_IA",
  "CONFIGURACOES",
] as const satisfies readonly TenantModule[];

export type ModuleAccessMap = Record<TenantModule, boolean>;

export type TenantModuleDefinition = {
  key: TenantModule;
  label: string;
  description: string;
  href: string;
  group: "main" | "management" | "bot" | "config";
};

/**
 * Registro central dos módulos internos do ERP.
 * Serve como fonte única para UI, sidebar e guards de acesso.
 */
export const TENANT_MODULE_DEFINITIONS: readonly TenantModuleDefinition[] = [
  {
    key: "DASHBOARD",
    label: "Dashboard",
    description: "Visão geral operacional e indicadores do dia.",
    href: "/dashboard",
    group: "main",
  },
  {
    key: "AGENDA",
    label: "Agenda",
    description: "Agendamentos, horários e disponibilidade da equipe.",
    href: "/agenda",
    group: "main",
  },
  {
    key: "CLIENTES",
    label: "Clientes",
    description: "Cadastro, histórico e perfil dos clientes/pacientes.",
    href: "/clientes",
    group: "main",
  },
  {
    key: "PROFISSIONAIS",
    label: "Profissionais",
    description: "Gestão da equipe, cargos e acessos internos.",
    href: "/profissionais",
    group: "management",
  },
  {
    key: "SERVICOS",
    label: "Serviços",
    description: "Catálogo de serviços e vínculos operacionais.",
    href: "/servicos",
    group: "management",
  },
  {
    key: "PACOTES",
    label: "Pacotes",
    description: "Pacotes comerciais e sessões vinculadas.",
    href: "/pacotes",
    group: "management",
  },
  {
    key: "PRODUTOS",
    label: "Produtos",
    description: "Cadastro mestre de produtos físicos, insumos e parâmetros comerciais.",
    href: "/produtos",
    group: "management",
  },
  {
    key: "COMISSOES",
    label: "Financeiro",
    description: "Comissões, extrato por período e operação de caixa.",
    href: "/financeiro",
    group: "management",
  },
  {
    key: "ESTOQUE",
    label: "Estoque",
    description: "Operação de saldo, ajustes e controle de materiais vinculados aos produtos.",
    href: "/produtos/estoque",
    group: "management",
  },
  {
    key: "PRONTUARIOS",
    label: "Prontuários",
    description: "Notas clínicas, evolução e arquivos do cliente.",
    href: "/prontuarios",
    group: "config",
  },
  {
    key: "ATENDENTE_IA",
    label: "Atendente IA",
    description: "Configure o atendimento automático pelo WhatsApp.",
    href: "/atendente-ia",
    group: "bot",
  },
  {
    key: "CONFIGURACOES",
    label: "Configurações",
    description: "Aparência, recursos e parâmetros administrativos.",
    href: "/configuracoes",
    group: "config",
  },
] as const;

export const CRITICAL_ADMIN_MODULES: readonly TenantModule[] = [
  "DASHBOARD",
  "PROFISSIONAIS",
  "CONFIGURACOES",
] as const;

const DEFAULT_ROLE_MODULES: Record<Role, readonly TenantModule[]> = {
  ADMIN: TENANT_MODULE_VALUES,
  RECEPTIONIST: [
    "DASHBOARD",
    "AGENDA",
    "CLIENTES",
    "SERVICOS",
    "PACOTES",
    "ESTOQUE",
  ],
  PROFESSIONAL: ["DASHBOARD", "AGENDA", "CLIENTES", "PRONTUARIOS"],
};

export function getDefaultModuleAccess(role: Role): ModuleAccessMap {
  const allowed = new Set(DEFAULT_ROLE_MODULES[role]);

  return Object.fromEntries(
    TENANT_MODULE_VALUES.map((module) => [module, allowed.has(module)])
  ) as ModuleAccessMap;
}

export function resolveEffectiveModuleAccess(
  role: Role,
  overrides: readonly { module: TenantModule; isAllowed: boolean }[]
): ModuleAccessMap {
  const access = getDefaultModuleAccess(role);

  for (const override of overrides) {
    access[override.module] = override.isAllowed;
  }

  return access;
}

export function getModuleDefinition(module: TenantModule): TenantModuleDefinition {
  const definition = TENANT_MODULE_DEFINITIONS.find((item) => item.key === module);

  if (!definition) {
    throw new Error(`Módulo desconhecido: ${module}`);
  }

  return definition;
}

export function listAllowedModules(access: ModuleAccessMap): TenantModule[] {
  return TENANT_MODULE_VALUES.filter((module) => access[module]);
}
