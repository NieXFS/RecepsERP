import { ArrowRight, Check, Sparkles } from "lucide-react";
import { ReferralCtaLink } from "@/components/marketing/referral-cta-link";
import { PLAN_SLUGS } from "@/lib/plans";

const included = [
  "WhatsApp 24h com a Ana",
  "Agenda sincronizada em tempo real",
  "Financeiro e fechamento de caixa",
  "Comissões calculadas automaticamente",
  "Cadastro completo de clientes",
  "Histórico de atendimentos e retornos",
  "Controle de estoque",
  "Suporte prioritário",
];

export function PricingCombo() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
          Preço
        </p>
        <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          Menos que uma recepcionista. Faz mais do que três.
        </h2>
      </div>

      <div className="mt-12 rounded-[2.4rem] border-2 border-violet-300 bg-white p-8 shadow-[0_24px_80px_rgba(139,92,246,0.16)] md:p-10">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white">
              Plano Combo
            </div>

            <div className="space-y-3">
              <h3 className="text-3xl font-black tracking-[-0.03em] text-[#0A0A0A]">
                ERP + Atendente IA
              </h3>
              <p className="text-base leading-relaxed text-[#525252]">
                O plano mais completo para quem quer atendimento, agenda, financeiro e operação
                funcionando juntos desde o primeiro dia.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="flex items-end gap-1">
                <span className="pb-2 text-lg font-semibold text-[#525252]">R$</span>
                <span className="text-6xl font-black tracking-[-0.06em] text-[#0A0A0A]">
                  299
                </span>
                <span className="pb-2 text-2xl font-bold text-[#0A0A0A]">,99</span>
                <span className="pb-2 text-base text-[#525252]">/mês</span>
              </div>
              <div className="pb-2 text-lg text-[#737373] line-through">R$ 369,98</div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Economia de R$ 69,99/mês
            </div>

            <ReferralCtaLink
              planSlug={PLAN_SLUGS.COMBO}
              dataCta="combo-pricing"
              magnetic
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_24px_60px_rgba(139,92,246,0.28)] animate-glow-breathe transition-all hover:bg-violet-600 sm:min-w-[22rem]"
            >
              Começar teste grátis de 7 dias
              <ArrowRight className="h-4 w-4" />
            </ReferralCtaLink>

            <p className="text-sm font-medium text-[#525252]">
              Sem cartão preso • 7 dias grátis • Cancele quando quiser
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {included.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[1.35rem] border border-[#E8E8E8] bg-[#FCFCFC] px-4 py-4 shadow-sm"
              >
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-4 w-4" />
                </div>
                <p className="text-sm font-medium leading-6 text-[#0A0A0A]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
