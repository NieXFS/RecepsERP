import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  LockKeyhole,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import { isValidPlanSlug, PLAN_SLUGS, type PlanSlug } from "@/lib/plans";

export type SignupPlan = {
  slug: PlanSlug | string;
  name: string;
  priceMonthly: number;
  currency: string;
  trialDays: number;
};

type PlanPayoffEntry = {
  badge: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  previewTitle: string;
  previewItems: Array<{
    icon: LucideIcon;
    label: string;
    value: string;
  }>;
};

export const PLAN_PAYOFF_CONTENT = {
  "somente-atendente-ia": {
    badge: "Atendente IA • R$ 149,99/mês",
    headline: "Daqui a 10 minutos, a Ana já tá respondendo seus clientes.",
    subheadline:
      "Sua atendente de WhatsApp que nunca dorme, nunca esquece e agenda sozinha. Enquanto você atende um cliente, ela cuida dos outros.",
    benefits: [
      "Atende no WhatsApp 24 horas por dia",
      "Marca consulta direto na sua agenda",
      "Responde com o tom do seu negócio",
      "Nunca tira folga, nunca esquece recado",
      "Pronta pra atender em 10 minutos",
    ],
    previewTitle: "O que entra no ar primeiro",
    previewItems: [
      { icon: Bot, label: "Ana", value: "Atendimento 24h no WhatsApp" },
      { icon: CalendarCheck2, label: "Agenda", value: "Horários prontos para marcar" },
    ],
  },
  "somente-erp": {
    badge: "ERP • R$ 219,99/mês",
    headline: "Daqui a 10 minutos, sua operação inteira tá numa tela só.",
    subheadline:
      "Agenda, cadastro de cliente, financeiro, comissões e estoque — tudo conectado, sem planilha, sem caderninho, sem dor de cabeça.",
    benefits: [
      "Agenda inteligente, sem conflito de horário",
      "Cadastro de cliente com histórico completo",
      "Financeiro do dia fechado em 1 clique",
      "Comissão de cada profissional calculada sozinha",
      "Relatórios que mostram onde seu negócio ganha dinheiro",
    ],
    previewTitle: "O que você vê no primeiro acesso",
    previewItems: [
      { icon: LayoutDashboard, label: "ERP", value: "Operação inteira numa tela só" },
      { icon: WalletCards, label: "Financeiro", value: "Caixa e fluxo já organizados" },
    ],
  },
  "erp-atendente-ia": {
    badge: "🔥 Combo completo • R$ 299,99/mês",
    headline: "Daqui a 10 minutos, seu negócio roda sozinho.",
    subheadline:
      "A Ana atende no WhatsApp e marca direto na agenda do Receps. Financeiro, comissões e histórico ficam prontos automaticamente. Você só atende.",
    benefits: [
      "WhatsApp atendido 24h pela Ana",
      "Agenda sincronizada em tempo real",
      "Financeiro + comissões no automático",
      "Histórico completo de cada cliente",
      "ERP + IA falando entre si, sem gambiarra",
    ],
    previewTitle: "O combo completo libera agora",
    previewItems: [
      { icon: Bot, label: "Ana", value: "Atende e agenda sozinha" },
      { icon: WalletCards, label: "Receps", value: "Financeiro e histórico sincronizados" },
    ],
  },
} as const satisfies Record<string, PlanPayoffEntry>;

const DEFAULT_PAYOFF_CONTENT: PlanPayoffEntry = {
  badge: "Receps",
  headline: "Sua operação começa organizada desde o primeiro acesso.",
  subheadline:
    "Escolha um plano válido para ver os benefícios específicos do que você está contratando.",
  benefits: [
    "Cadastro rápido e seguro",
    "Trial grátis para começar sem travar a decisão",
    "Plano certo para cada etapa do seu negócio",
  ],
  previewTitle: "O que você libera ao entrar",
  previewItems: [
    { icon: Building2, label: "Receps", value: "Estrutura pronta para começar" },
    { icon: ShieldCheck, label: "Conta", value: "Acesso seguro desde o primeiro dia" },
  ],
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

export function resolvePlanPayoffContent(plan: SignupPlan) {
  if (!isValidPlanSlug(plan.slug)) {
    return DEFAULT_PAYOFF_CONTENT;
  }

  return PLAN_PAYOFF_CONTENT[plan.slug];
}

function SignupPlanBadge({
  plan,
  compact = false,
}: {
  plan: SignupPlan;
  compact?: boolean;
}) {
  const content = resolvePlanPayoffContent(plan);
  const sizeClassName = compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const iconClassName = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  if (!isValidPlanSlug(plan.slug)) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 ${sizeClassName} font-medium text-white/82 backdrop-blur`}
      >
        <Building2 className={iconClassName} />
        <span>{content.badge}</span>
      </div>
    );
  }

  if (plan.slug === PLAN_SLUGS.ATENDENTE_IA) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-500/10 ${sizeClassName} font-medium text-emerald-200 backdrop-blur`}
      >
        <MessageCircleMore className={iconClassName} />
        <span>{content.badge}</span>
      </div>
    );
  }

  if (plan.slug === PLAN_SLUGS.ERP) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-violet-300/35 bg-violet-500/10 ${sizeClassName} font-medium text-violet-100 backdrop-blur`}
      >
        <LayoutDashboard className={iconClassName} />
        <span>{content.badge}</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full bg-violet-500 ${sizeClassName} font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.25)]`}
    >
      <Sparkles className={iconClassName} />
      <span>{content.badge}</span>
    </div>
  );
}

export function SignupMobileHeader({ plan }: { plan: SignupPlan }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-border/70 bg-white px-4 py-3 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-none">Receps</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {formatCurrency(plan.priceMonthly, plan.currency)}/mês
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <SignupPlanBadge plan={plan} compact />
      </div>
    </div>
  );
}

export function SignupMobileFooter({ plan }: { plan: SignupPlan }) {
  const content = resolvePlanPayoffContent(plan);

  return (
    <div className="space-y-3 lg:hidden">
      <div className="grid gap-2">
        {content.benefits.slice(0, 3).map((benefit) => (
          <div key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Sem cartão • {plan.trialDays} dias grátis • Cancele quando quiser
      </p>
    </div>
  );
}

export function SignupPayoffPanel({ plan }: { plan: SignupPlan }) {
  const content = resolvePlanPayoffContent(plan);

  return (
    <section className="relative hidden overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] lg:flex lg:min-h-[44rem] lg:px-8 lg:py-10">
      <AuroraBackground />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-white shadow-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold leading-none">Receps</p>
        </div>

        <div className="mt-10 space-y-6">
          <SignupPlanBadge plan={plan} />

          <div className="space-y-4">
            <h1 className="max-w-md text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-[2.75rem] 2xl:max-w-lg">
              {content.headline}
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/72 sm:text-lg">
              {content.subheadline}
            </p>
            <p className="text-sm font-medium text-white/68">
              {plan.trialDays} dias grátis • Sem cartão de crédito • Cancele quando quiser
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-3">
          {content.benefits.map((benefit) => (
            <div
              key={benefit}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-white/84 backdrop-blur transition-colors hover:bg-white/5"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-lg backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
            {content.previewTitle}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {content.previewItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                    <Icon className="h-4 w-4 text-violet-300" />
                    {item.label}
                  </div>
                  <p className="mt-3 text-base font-semibold text-white">{item.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-3 pt-8 text-xs text-white/64">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            Conexão segura
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2">
            <LockKeyhole className="h-3.5 w-3.5 text-violet-300" />
            Dados protegidos
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-2">
            <CreditCard className="h-3.5 w-3.5 text-emerald-300" />
            Trial sem cartão
          </div>
        </div>
      </div>
    </section>
  );
}
