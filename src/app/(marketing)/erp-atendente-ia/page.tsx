import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  Check,
  ChevronDown,
  Clock3,
  DollarSign,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { CountUpStat } from "@/components/marketing/count-up-stat";
import { AuroraBackground } from "@/components/marketing/aurora-background";
import { DayComparison } from "@/components/marketing/combo/day-comparison";
import { HeroDualMockup } from "@/components/marketing/combo/hero-dual-mockup";
import { IntegrationTimeline } from "@/components/marketing/combo/integration-timeline";
import { PricingCombo } from "@/components/marketing/combo/pricing-combo";
import { ForceLightTheme } from "@/components/marketing/force-light-theme";
import { ReferralCtaLink } from "@/components/marketing/referral-cta-link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PLAN_SLUGS } from "@/lib/plans";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "ERP + Atendente IA — O combo completo | Receps",
  description:
    "A Ana atende seu WhatsApp 24h e marca direto na agenda do Receps. Gestão completa + atendimento automático por R$ 299,99/mês. 7 dias grátis.",
  openGraph: {
    title: "ERP + Atendente IA — O combo completo | Receps",
    description:
      "WhatsApp 24h, agenda sincronizada, financeiro, histórico e comissões no mesmo fluxo. O plano combo da Receps faz tudo trabalhar junto.",
    images: ["/og-combo.svg"],
  },
};

const proofStats = [
  {
    icon: Sparkles,
    value: (
      <CountUpStat
        value={24}
        suffix="/7"
        className="text-6xl font-black tracking-[-0.06em] text-[#0A0A0A]"
      />
    ),
    label: "atendimento automático no WhatsApp, sem pausa, fim de semana e madrugada incluídos",
  },
  {
    icon: MessageCircleMore,
    value: (
      <CountUpStat
        value={5}
        prefix="< "
        suffix=" segundos"
        className="text-6xl font-black tracking-[-0.06em] text-[#0A0A0A]"
      />
    ),
    label: "tempo médio de resposta da Ana no WhatsApp",
  },
  {
    icon: Clock3,
    value: (
      <CountUpStat
        value={1}
        suffix=" clique"
        className="text-6xl font-black tracking-[-0.06em] text-[#0A0A0A]"
      />
    ),
    label: "pra fechar o caixa do dia no ERP",
  },
];

const whyComboCards = [
  {
    title: "Só ERP",
    description:
      "Você organiza a casa, mas ainda depende de alguém parar para responder, negociar horário e preencher agenda manualmente.",
    items: [
      "Cliente precisa ligar ou esperar retorno",
      "Marcação continua dependendo da equipe",
      "Horário vazio ainda vira dor de cabeça",
    ],
    featured: false,
  },
  {
    title: "Só Atendente IA",
    description:
      "A Ana atende e ajuda muito, mas sozinha não fecha a operação inteira nem conversa com o resto do negócio como deveria.",
    items: [
      "Atendimento melhora, mas o controle fica separado",
      "Financeiro e histórico seguem em outro lugar",
      "Você ainda fecha o dia na mão",
    ],
    featured: false,
  },
  {
    title: "ERP + Atendente IA",
    description:
      "Cliente conversa com a Ana, ela consulta a agenda do Receps em tempo real, marca direto, atualiza o histórico e já deixa a operação pronta para o caixa e para a comissão.",
    items: [
      "Cliente pergunta no WhatsApp e recebe resposta na hora",
      "A agenda do Receps devolve só o que está livre",
      "O horário escolhido entra no sistema automaticamente",
      "Histórico, profissional e caixa ficam atualizados no mesmo fluxo",
    ],
    featured: true,
  },
];

const comboFeatures = [
  {
    icon: MessageCircleMore,
    title: "Atendimento 24/7 sem perder ninguém",
    description: "A Ana responde toda mensagem em fim de semana, madrugada e feriado.",
  },
  {
    icon: CalendarCheck2,
    title: "Agenda que se preenche sozinha",
    description: "Cliente marca direto pelo WhatsApp sem precisar passar por você.",
  },
  {
    icon: DollarSign,
    title: "Financeiro no automático",
    description: "Todo agendamento vira receita rastreada, comissão calculada e caixa pronto.",
  },
  {
    icon: Users,
    title: "Cadastro de cliente completo",
    description: "Histórico, preferências, serviços anteriores e recorrência no mesmo lugar.",
  },
  {
    icon: BarChart3,
    title: "Relatórios que importam",
    description: "Veja quanto entrou, quanto saiu e o que realmente dá mais lucro.",
  },
  {
    icon: Sparkles,
    title: "Sincronização em tempo real",
    description: "Marcou no WhatsApp? Aparece na agenda na hora. Cancelou? Libera na hora.",
  },
];

const faqs = [
  {
    question: "Posso começar só com um dos produtos e adicionar o outro depois?",
    answer:
      "Pode, mas o combo entrega o melhor resultado porque o atendimento e a operação nascem conectados desde o primeiro dia. E ainda sai mais barato do que contratar os dois separados.",
  },
  {
    question: "Quanto tempo leva pra configurar?",
    answer:
      "A estrutura inicial do combo foi pensada para ser simples. Em geral, em poucos minutos você coloca o essencial no ar e vai refinando com o uso real.",
  },
  {
    question: "A Ana realmente marca direto na minha agenda?",
    answer:
      "Sim. O diferencial do combo é exatamente esse: a Ana consulta o que está livre no Receps e grava o agendamento no sistema sem você repetir o trabalho.",
  },
  {
    question: "E se ela errar um agendamento?",
    answer:
      "Você continua com o controle da configuração e pode ajustar regras, horários e respostas. O objetivo é deixar o fluxo principal bem amarrado antes de escalar o volume.",
  },
  {
    question: "Funciona pra qual tipo de negócio?",
    answer:
      "O combo atende clínicas de estética, consultórios odontológicos, centros estéticos, barbearias, salões de beleza e estúdios de unha, sobrancelha, depilação e massagem.",
  },
  {
    question: "Preciso ter WhatsApp Business API?",
    answer:
      "A ativação técnica depende do canal usado na sua operação, mas você não precisa dominar a parte técnica para colocar o combo para rodar. O foco é fazer funcionar, não complicar.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Pode. O plano é mensal, tem 7 dias grátis para testar e você cancela quando fizer sentido para a sua operação.",
  },
];

export default function ComboLandingPage() {
  return (
    <>
      <ForceLightTheme />

      <div className="bg-white text-[#0A0A0A]">
        <section className="relative overflow-hidden bg-[#0B0B1A] text-white">
          <AuroraBackground />

          <div className="relative mx-auto w-full grid max-w-7xl gap-14 px-6 py-[4.75rem] md:py-24 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-[7.75rem] xl:gap-16">
            <div className="min-w-0 max-w-2xl space-y-8">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.32)]">
                  <Sparkles className="h-4 w-4" />
                  Combo completo — o mais escolhido
                </div>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div className="space-y-5">
                  <h1 className="max-w-xl text-5xl font-black leading-tight tracking-[-0.045em] lg:text-6xl xl:text-7xl">
                    Sua operação inteira rodando sozinha. Do primeiro "oi" ao caixa fechado.
                  </h1>
                  <p className="max-w-2xl text-lg leading-relaxed text-white/74 sm:text-xl">
                    A Ana atende no WhatsApp 24h, marca o cliente direto na agenda e o Receps
                    cuida do resto — financeiro, comissão, histórico, tudo sincronizado em tempo
                    real. Você só chega, atende, e no fim do mês olha o lucro.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={160}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.COMBO}
                    dataCta="combo-hero"
                    magnetic
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_24px_60px_rgba(139,92,246,0.32)] animate-glow-breathe transition-all hover:bg-violet-600 sm:min-w-[22rem]"
                  >
                    Começar teste grátis de 7 dias
                    <ArrowRight className="h-4 w-4" />
                  </ReferralCtaLink>

                  <Link
                    href="#integracao"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/16 bg-white/6 px-8 py-4 text-base font-semibold text-white shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:min-w-[14rem]"
                  >
                    Ver como funciona
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={240}>
                <p className="text-sm font-medium text-white/68">
                  R$ 299,99/mês • 7 dias grátis • Cancele quando quiser • Setup em 10 minutos
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={200} className="min-w-0 w-full">
              <HeroDualMockup />
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-5 px-6 py-10 lg:grid-cols-3">
            {proofStats.map((item, index) => {
              const Icon = item.icon;

              return (
                <ScrollReveal key={item.label} delay={index * 90}>
                  <div className="rounded-[2rem] border border-[#ECECEC] bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[1rem] bg-violet-50 text-violet-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>{item.value}</div>
                    <p className="mt-3 text-base leading-7 text-[#525252]">{item.label}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Por que o combo?
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Um sozinho já é bom. Os dois juntos mudam o jogo.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#525252]">
                Veja o que muda quando a Ana e o Receps trabalham conectados.
              </p>
            </ScrollReveal>

            <div className="mt-14 grid gap-5 lg:grid-cols-[0.92fr_0.92fr_1.16fr] lg:items-stretch">
              {whyComboCards.map((card, index) => (
                <ScrollReveal key={card.title} delay={index * 90}>
                  <div
                    className={
                      card.featured
                        ? "h-full rounded-[2.2rem] border border-violet-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f3ff_100%)] p-8 shadow-[0_24px_60px_rgba(139,92,246,0.14)] transition-all hover:-translate-y-2 hover:shadow-[0_30px_70px_rgba(139,92,246,0.18)]"
                        : "h-full rounded-[2rem] border border-[#E8E8E8] bg-[#FAFAFA] p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    }
                  >
                    {card.featured ? (
                      <div className="mb-5 inline-flex rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        Combo
                      </div>
                    ) : null}

                    <h3 className="text-2xl font-black tracking-[-0.03em] text-[#0A0A0A]">
                      {card.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-[#525252]">
                      {card.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      {card.items.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-[1.15rem] border border-[#ECECEC] bg-white/80 px-4 py-3"
                        >
                          {card.featured ? (
                            <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                          ) : (
                            <X className="mt-0.5 h-4 w-4 text-[#A3A3A3]" />
                          )}
                          <p className="text-sm leading-6 text-[#3F3F46]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="integracao" className="bg-[#F5F5F7]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Como eles conversam
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Em 12 segundos, um cliente vira agendamento pago.
              </h2>
            </ScrollReveal>

            <IntegrationTimeline />
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">
                O que você ganha
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Tudo que você ganha no combo
              </h2>
            </ScrollReveal>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {comboFeatures.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <ScrollReveal key={feature.title} delay={index * 80}>
                    <div className="rounded-[2rem] border border-[#E8E8E8] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(139,92,246,0.12)]">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#ede9fe_0%,#ecfeff_100%)] text-violet-600 shadow-sm">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-[#525252]">
                        {feature.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Antes vs depois
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Seu dia antes vs depois do combo
              </h2>
            </ScrollReveal>

            <div className="mt-14">
              <DayComparison />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Pra quem é
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Feito pra quem cansou de fazer tudo sozinho
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              {/* TODO: quando tiver depoimentos reais (mínimo 3 de segmentos diferentes), trocar essa seção por carrossel de depoimentos verdadeiros */}
              <div className="mt-12 rounded-[2.4rem] border border-[#E8E8E8] bg-white px-8 py-10 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:px-12">
                <div className="mx-auto max-w-4xl text-center">
                  <p className="text-2xl font-bold leading-relaxed tracking-[-0.03em] text-[#0A0A0A] sm:text-3xl">
                    O Receps + Ana foi desenhado pra um tipo específico de dono de negócio:
                    aquele que ama o que faz, mas tá esgotado de responder mensagem no WhatsApp à
                    meia-noite, calcular comissão no domingo e perder cliente porque demorou pra
                    ver a notificação.
                  </p>
                  <p className="mt-6 text-xl leading-relaxed text-[#525252] sm:text-2xl">
                    Se isso é você, esse combo foi feito exatamente pro seu dia mudar.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal>
              <PricingCombo />
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                FAQ
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Perguntas que aparecem antes de escolher o plano mais completo.
              </h2>
            </ScrollReveal>

            <div className="mt-12 space-y-4">
              {faqs.map((item, index) => (
                <ScrollReveal key={item.question} delay={index * 60}>
                  <details className="group rounded-[1.5rem] border border-[#E6E6E6] bg-[#FCFCFC] px-6 py-5 shadow-sm transition-all open:bg-white open:shadow-lg">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-[#0A0A0A]">
                      <span>{item.question}</span>
                      <ChevronDown className="h-5 w-5 shrink-0 text-[#737373] transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pt-4 text-base leading-relaxed text-[#525252]">
                      {item.answer}
                    </p>
                  </details>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#0B0B1A] text-white">
          <AuroraBackground className="opacity-95" />

          <div className="relative mx-auto max-w-6xl px-6 py-24">
            <ScrollReveal>
              <div className="rounded-[2.5rem] border border-white/12 bg-white/7 px-8 py-12 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl md:px-12 md:py-16">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                  <ShieldCheck className="h-4 w-4" />
                  O plano carro-chefe da Receps
                </div>

                <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl md:text-6xl">
                  Seu negócio merece parar de depender de você pra rodar.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/74">
                  Comece hoje. Teste por 7 dias. Se não for o que você esperava, cancele com 1
                  clique e não paga nada.
                </p>

                <div className="mt-8 flex justify-center">
                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.COMBO}
                    dataCta="combo-final"
                    magnetic
                    className="inline-flex min-h-[3.75rem] items-center justify-center gap-2 rounded-2xl bg-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_24px_60px_rgba(139,92,246,0.32)] animate-glow-breathe transition-all hover:bg-violet-600 sm:min-w-[22rem]"
                  >
                    Começar teste grátis de 7 dias
                    <ArrowRight className="h-4 w-4" />
                  </ReferralCtaLink>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <MicroBadge>Sem cartão preso</MicroBadge>
                  <MicroBadge>Setup em 10 minutos</MicroBadge>
                  <MicroBadge>Suporte humano de verdade</MicroBadge>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </>
  );
}

function MicroBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white/85">
      <Check className="h-4 w-4 text-emerald-300" />
      {children}
    </div>
  );
}
