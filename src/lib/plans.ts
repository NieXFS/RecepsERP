export const PLAN_SLUGS = {
  ATENDENTE_IA: "somente-atendente-ia",
  ERP: "somente-erp",
  COMBO: "erp-atendente-ia",
} as const;

export type PlanSlug = (typeof PLAN_SLUGS)[keyof typeof PLAN_SLUGS];

export const PLAN_METADATA: Record<
  PlanSlug,
  {
    name: string;
    priceMonthly: number;
    priceFormatted: string;
  }
> = {
  [PLAN_SLUGS.ATENDENTE_IA]: {
    name: "Atendente IA",
    priceMonthly: 149.99,
    priceFormatted: "R$ 149,99",
  },
  [PLAN_SLUGS.ERP]: {
    name: "ERP",
    priceMonthly: 219.99,
    priceFormatted: "R$ 219,99",
  },
  [PLAN_SLUGS.COMBO]: {
    name: "ERP + Atendente IA",
    priceMonthly: 299.99,
    priceFormatted: "R$ 299,99",
  },
};

const SLUG_ALIASES: Record<string, PlanSlug> = {
  "atendente-ia": PLAN_SLUGS.ATENDENTE_IA,
  "somente-atendente-ia": PLAN_SLUGS.ATENDENTE_IA,
  erp: PLAN_SLUGS.ERP,
  "somente-erp": PLAN_SLUGS.ERP,
  combo: PLAN_SLUGS.COMBO,
  "erp-atendente-ia": PLAN_SLUGS.COMBO,
};

const CANONICAL_TO_ACCEPTED_SLUGS: Record<PlanSlug, string[]> = {
  [PLAN_SLUGS.ATENDENTE_IA]: ["somente-atendente-ia", "atendente-ia"],
  [PLAN_SLUGS.ERP]: ["somente-erp", "erp"],
  [PLAN_SLUGS.COMBO]: ["erp-atendente-ia", "combo"],
};

export function isValidPlanSlug(slug: string | null | undefined): slug is PlanSlug {
  return (
    slug === PLAN_SLUGS.ATENDENTE_IA ||
    slug === PLAN_SLUGS.ERP ||
    slug === PLAN_SLUGS.COMBO
  );
}

export function normalizePlanSlug(raw: string | null | undefined): PlanSlug | null {
  if (!raw) {
    return null;
  }

  return SLUG_ALIASES[raw.trim().toLowerCase()] ?? null;
}

export function getPlanSlugCandidates(raw: string | null | undefined): string[] {
  const trimmed = raw?.trim().toLowerCase();
  const normalized = normalizePlanSlug(trimmed);
  const candidates = new Set<string>();

  if (trimmed) {
    candidates.add(trimmed);
  }

  if (normalized) {
    for (const candidate of CANONICAL_TO_ACCEPTED_SLUGS[normalized]) {
      candidates.add(candidate);
    }
  }

  return [...candidates];
}
