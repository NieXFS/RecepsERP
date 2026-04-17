import type { TenantModule } from "@/generated/prisma/enums";
import { normalizePlanSlug } from "@/lib/plans";

/**
 * Módulos sempre visíveis independente do plano.
 */
const ALWAYS_VISIBLE: readonly TenantModule[] = ["DASHBOARD", "CONFIGURACOES"];

/**
 * Módulos exclusivos do produto "Atendente IA".
 */
const BOT_MODULES: readonly TenantModule[] = ["ATENDENTE_IA"];

/**
 * Módulos exclusivos do produto "ERP".
 */
const ERP_MODULES: readonly TenantModule[] = [
  "AGENDA",
  "CLIENTES",
  "PROFISSIONAIS",
  "SERVICOS",
  "PACOTES",
  "PRODUTOS",
  "COMISSOES",
  "ESTOQUE",
  "PRONTUARIOS",
];

/**
 * Retorna os módulos habilitados para um determinado slug de plano.
 * Se `planSlug` for null (billing bypass, super admin, etc.), libera tudo.
 */
export function getModulesForPlanSlug(planSlug: string | null): TenantModule[] {
  const normalizedPlanSlug = normalizePlanSlug(planSlug);

  switch (normalizedPlanSlug) {
    case "somente-atendente-ia":
      return [...ALWAYS_VISIBLE, ...BOT_MODULES];
    case "somente-erp":
      return [...ALWAYS_VISIBLE, ...ERP_MODULES];
    case "erp-atendente-ia":
      return [...ALWAYS_VISIBLE, ...BOT_MODULES, ...ERP_MODULES];
    default:
      // Sem plano definido (billing bypass, super admin): libera tudo.
      return [...ALWAYS_VISIBLE, ...BOT_MODULES, ...ERP_MODULES];
  }
}

export type PlanProductModule = "bot" | "erp";

/**
 * Verifica se um plano inclui um determinado produto.
 */
export function hasPlanProduct(
  planSlug: string | null,
  product: PlanProductModule
): boolean {
  const normalizedPlanSlug = normalizePlanSlug(planSlug);

  if (!planSlug) {
    return true; // billing bypass
  }

  if (product === "bot") {
    return (
      normalizedPlanSlug === "somente-atendente-ia" ||
      normalizedPlanSlug === "erp-atendente-ia"
    );
  }

  if (product === "erp") {
    return (
      normalizedPlanSlug === "somente-erp" ||
      normalizedPlanSlug === "erp-atendente-ia"
    );
  }

  return false;
}
