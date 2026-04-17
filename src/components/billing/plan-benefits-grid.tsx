import { Check } from "lucide-react";
import { normalizePlanSlug, PLAN_SLUGS, type PlanSlug } from "@/lib/plans";

const BENEFITS_BY_SLUG: Record<PlanSlug, string[]> = {
  [PLAN_SLUGS.ATENDENTE_IA]: [
    "Ana IA atendendo 24/7 no WhatsApp",
    "Agendamentos automáticos pela Ana",
    "Personalização da personalidade da atendente",
    "Número WhatsApp configurado pela nossa equipe",
    "Suporte humano via WhatsApp",
  ],
  [PLAN_SLUGS.ERP]: [
    "Agenda completa com lembretes",
    "Gestão de clientes e prontuários",
    "Profissionais, comissões e escalas",
    "Serviços, pacotes e produtos",
    "Controle financeiro e relatórios",
  ],
  [PLAN_SLUGS.COMBO]: [
    "Tudo do ERP + tudo da Atendente IA",
    "Ana agenda direto no seu calendário",
    "Dashboards unificados de atendimento e operação",
    "Suporte prioritário",
    "Histórico único por cliente em todos os canais",
  ],
};

function normalizePlanFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          item &&
          typeof item === "object" &&
          "label" in item &&
          typeof (item as { label: unknown }).label === "string"
        ) {
          return (item as { label: string }).label;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value?.trim()));
  }
  return [];
}

export function PlanBenefitsGrid({
  plan,
}: {
  plan: {
    slug: string;
    name: string;
    features: unknown;
  };
}) {
  const fromDb = normalizePlanFeatures(plan.features);
  const normalizedSlug = normalizePlanSlug(plan.slug);
  const fallback = normalizedSlug ? BENEFITS_BY_SLUG[normalizedSlug] : [];
  const benefits = fromDb.length >= 3 ? fromDb : fallback;

  if (benefits.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-primary/10 bg-card/60 p-5 backdrop-blur-sm ring-1 ring-primary/5 md:p-6">
      <header className="mb-5">
        <h2 className="font-heading text-base font-semibold leading-snug">
          O que está incluso no seu plano
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{plan.name}</p>
      </header>

      <ul className="grid gap-3 md:grid-cols-2">
        {benefits.map((benefit) => (
          <li
            key={benefit}
            className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 text-sm leading-relaxed"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Check className="h-4 w-4" />
            </span>
            <span className="text-foreground/90">{benefit}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
