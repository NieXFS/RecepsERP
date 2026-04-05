import type { TenantAccentTheme } from "@/generated/prisma/enums";

export const TENANT_ACCENT_THEME_VALUES = [
  "RECEPS_SIGNATURE",
  "ROSE_ELEGANCE",
  "LAVENDER_PREMIUM",
  "EXECUTIVE_BLUE",
  "TITANIUM_GRAPHITE",
] as const satisfies readonly TenantAccentTheme[];

export const DEFAULT_TENANT_ACCENT_THEME: TenantAccentTheme =
  "RECEPS_SIGNATURE";

export type TenantAccentThemeDefinition = {
  value: TenantAccentTheme;
  label: string;
  description: string;
  swatches: readonly [string, string, string, string];
};

/**
 * Catálogo central das paletas disponíveis para o ERP.
 * A persistência usa o enum salvo no Tenant; esta estrutura serve a UI.
 */
export const TENANT_ACCENT_THEMES: readonly TenantAccentThemeDefinition[] = [
  {
    value: "RECEPS_SIGNATURE",
    label: "Receps Padrão",
    description:
      "A assinatura original da plataforma, com roxo premium e contraste equilibrado.",
    swatches: ["#6223CF", "#8B5CF6", "#E9D8FD", "#1E1631"],
  },
  {
    value: "ROSE_ELEGANCE",
    label: "Rosé Elegance",
    description:
      "Rosé sofisticado, delicado e profissional para uma presença premium sem excessos.",
    swatches: ["#B84773", "#E27FA3", "#F5DEE7", "#2D1620"],
  },
  {
    value: "LAVENDER_PREMIUM",
    label: "Âmbar Premium",
    description:
      "Âmbar refinado com calor e energia na medida certa, mantendo leitura elegante no ERP.",
    swatches: ["#C58A12", "#E3B54C", "#F4E4B8", "#2B2110"],
  },
  {
    value: "EXECUTIVE_BLUE",
    label: "Azul Executivo",
    description:
      "Azul profundo e profissional para operações com linguagem mais séria e corporativa.",
    swatches: ["#1F63C6", "#6AA8FF", "#DCEBFF", "#101C2D"],
  },
  {
    value: "TITANIUM_GRAPHITE",
    label: "Grafite Titanium",
    description:
      "Grafite premium com acento frio e sóbrio, ideal para uma presença mais executiva.",
    swatches: ["#586D84", "#9AAEC5", "#E1E8EF", "#141C24"],
  },
] as const;

const TENANT_ACCENT_THEME_MAP = new Map(
  TENANT_ACCENT_THEMES.map((theme) => [theme.value, theme])
);

export function getTenantAccentThemeDefinition(
  theme: TenantAccentTheme
): TenantAccentThemeDefinition {
  return (
    TENANT_ACCENT_THEME_MAP.get(theme) ??
    TENANT_ACCENT_THEME_MAP.get(DEFAULT_TENANT_ACCENT_THEME)!
  );
}

export function isTenantAccentTheme(value: string): value is TenantAccentTheme {
  return TENANT_ACCENT_THEME_VALUES.includes(value as TenantAccentTheme);
}
