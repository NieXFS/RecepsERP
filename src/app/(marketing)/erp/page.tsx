import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  DollarSign,
  Heart,
  Palette,
  Scissors,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
  Warehouse,
  Wand2,
  X,
} from "lucide-react";
import { CountUpStat } from "@/components/marketing/count-up-stat";
import { ErpDashboardMockup } from "@/components/marketing/erp-dashboard-mockup";
import { ForceLightTheme } from "@/components/marketing/force-light-theme";
import { ReferralCtaLink } from "@/components/marketing/referral-cta-link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PLAN_SLUGS } from "@/lib/plans";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "ERP para Clínicas, Barbearias, Odonto e Salões | Receps",
  description:
    "Organize agenda, cadastro, financeiro, estoque e comissões em um ERP feito para clínicas de estética, consultórios odontológicos, barbearias, salões, centros estéticos e estúdios. Teste grátis por 7 dias.",
  openGraph: {
    title: "ERP para Clínicas, Barbearias, Odonto e Salões | Receps",
    description:
      "O ERP Receps reúne agenda, cadastro, caixa, comissões e relatórios em um lugar que o seu negócio entende.",
    images: ["/logo_texto.svg"],
  },
};

const painPoints = [
  {
    icon: Calendar,
    title: "Agenda no caderno e na memória",
    description: "Cliente liga para marcar e ninguém sabe com segurança qual horário está livre.",
  },
  {
    icon: DollarSign,
    title: "Comissão vira uma noite inteira de conta",
    description: "No fim do mês, fechar repasse consome tempo que deveria ficar com a operação.",
  },
  {
    icon: BarChart3,
    title: "Faturamento espalhado em várias planilhas",
    description: "Para saber quanto entrou na semana, você abre três telas e ainda fica em dúvida.",
  },
];

const features = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description:
      "Veja o dia inteiro numa tela, arraste horários, bloqueie folgas e evite conflito de agenda.",
  },
  {
    icon: Users,
    title: "Cadastro de clientes com histórico",
    description:
      "Quando o cliente volta, você sabe o que fez, quando veio, com quem passou e quanto pagou.",
  },
  {
    icon: DollarSign,
    title: "Financeiro sem dor de cabeça",
    description:
      "Entradas, saídas, fluxo de caixa e fechamento diário para tirar o Excel da rotina.",
  },
  {
    icon: Sparkles,
    title: "Comissões calculadas sozinhas",
    description:
      "Cada profissional segue sua regra e o sistema calcula para você só conferir e pagar.",
  },
  {
    icon: Warehouse,
    title: "Controle de estoque",
    description:
      "Produtos saem automaticamente conforme o serviço e você recebe alerta quando está acabando.",
  },
  {
    icon: ClipboardList,
    title: "Relatórios que fazem sentido",
    description:
      "Veja o que entrou, o que saiu, qual serviço vende mais e quem está performando melhor.",
  },
];

const steps = [
  {
    icon: Scissors,
    title: "Você cadastra serviços, profissionais e horários",
    description: "A operação nasce organizada, com regras claras para agenda, equipe e atendimento.",
  },
  {
    icon: Calendar,
    title: "A operação roda no sistema todo dia",
    description: "Agenda, clientes, caixa, estoque e comissões passam a andar no mesmo lugar.",
  },
  {
    icon: BarChart3,
    title: "No fim do mês, você decide com dados reais",
    description: "Sai a dúvida de planilha e entra a visão do que dá resultado no negócio.",
  },
];

const comparisonRows = [
  ["Marcar atendimento", "Ligação + caderno", "1 clique"],
  ["Fechar caixa do dia", "40 minutos", "10 segundos"],
  ["Calcular comissão", "Noite inteira", "Automático"],
  ["Faturamento da semana", "Abrir 3 planilhas", "Uma tela"],
  ["Histórico do cliente", "Na memória", "Sempre disponível"],
  ["Erro humano", "Comum", "Raro"],
];

const segments = [
  { icon: Sparkles, title: "Clínicas de estética" },
  { icon: Smile, title: "Consultórios odontológicos" },
  { icon: Scissors, title: "Barbearias" },
  { icon: Wand2, title: "Salões de beleza" },
  { icon: Heart, title: "Centros estéticos" },
  { icon: Palette, title: "Estúdios", description: "unha, sobrancelha, depilação, massagem" },
];

const faqs = [
  {
    question: "Preciso de treinamento para começar a usar?",
    answer:
      "A proposta do Receps é ser simples para quem vive a rotina do negócio. Você entra, cadastra o básico e já consegue operar sem depender de conhecimento técnico.",
  },
  {
    question: "Funciona no celular ou só no computador?",
    answer:
      "Você consegue acompanhar pelo celular, mas a experiência mais confortável para operação longa continua sendo no computador. Os dois cenários fazem parte do uso real.",
  },
  {
    question: "Meus dados ficam seguros?",
    answer:
      "Sim. O sistema foi pensado para separar acessos por empresa e limitar permissões da equipe conforme a função de cada pessoa.",
  },
  {
    question: "Consigo importar minha base de clientes atual?",
    answer:
      "Depende de como a sua base está hoje. O caminho mais comum é trazer o essencial para começar rápido e organizar o restante com calma.",
  },
  {
    question: "Se eu já uso outro sistema, dá para migrar?",
    answer:
      "Dá para planejar a migração. O ideal é avaliar o que você usa hoje, o que realmente precisa trazer e qual é a forma mais segura de virar a operação.",
  },
  {
    question: "Funciona para qualquer tipo de negócio de atendimento?",
    answer:
      "Sim. O Receps atende clínicas de estética, consultórios odontológicos, barbearias, salões de beleza, centros estéticos e estúdios de unha, sobrancelha, depilação e massagem. Se o seu negócio trabalha com agenda, cliente e profissional, funciona.",
  },
];

export default function ErpLandingPage() {
  return (
    <>
      <ForceLightTheme />

      <div className="bg-white text-[#0A0A0A]">
        <section className="relative overflow-x-clip bg-[linear-gradient(180deg,#f6f0ff_0%,#ffffff_22%,#ffffff_72%,#f8fffc_100%)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,#c4b5fd_0%,rgba(196,181,253,0.30)_18%,rgba(255,255,255,0)_72%)]" />
          <div className="pointer-events-none absolute left-1/2 top-16 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-violet-200/20 blur-[110px]" />
          <div className="pointer-events-none absolute left-1/2 top-52 h-[24rem] w-[26rem] -translate-x-[15%] rounded-full bg-emerald-200/20 blur-[120px]" />

          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-[5rem] md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(32rem,36rem)] lg:items-center lg:gap-24 lg:py-[8rem]">
            <div className="max-w-[42rem] space-y-8">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur">
                  <BarChart3 className="h-4 w-4" />
                  Produto Receps
                </div>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div className="space-y-5">
                  <h1 className="max-w-[9.5ch] text-5xl font-black leading-[0.9] tracking-[-0.05em] sm:text-6xl lg:text-[6.2rem]">
                    O ERP que faz seu negócio rodar enquanto você cuida dos clientes.
                  </h1>
                  <p className="max-w-2xl text-lg leading-relaxed text-[#525252] sm:text-xl">
                    Agenda, cadastro, financeiro, comissões e estoque num lugar só. Feito para
                    clínicas de estética, consultórios odontológicos, barbearias, salões e
                    centros estéticos que querem crescer sem virar refém de planilha.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={140}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.ERP}
                    dataCta="erp-hero"
                    magnetic
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.28)] transition-all hover:bg-violet-600 sm:min-w-72"
                  >
                    Assinar por R$ 219,99/mês
                    <ArrowRight className="h-4 w-4" />
                  </ReferralCtaLink>

                  <Link
                    href="#como-funciona"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#E5E5E5] bg-white px-7 py-4 text-base font-semibold text-[#0A0A0A] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:min-w-56"
                  >
                    Ver como funciona
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={220}>
                <p className="text-sm font-medium text-[#525252]">
                  7 dias grátis • Cancele quando quiser • Sem fidelidade
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal className="lg:justify-self-end lg:pl-2" delay={180}>
              <ErpDashboardMockup />
            </ScrollReveal>
          </div>
        </section>

        <section className="border-y border-[#ECECEC] bg-[#FAFAFA]">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-2 xl:grid-cols-4">
            <ScrollReveal>
              <StatCard
                value={<CountUpStat value={4} className="text-4xl font-black tracking-[-0.04em]" />}
                label="minutos para marcar um atendimento"
              />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <StatCard
                value={<CountUpStat value={0} prefix="R$ " className="text-4xl font-black tracking-[-0.04em]" />}
                label="de mensalidade em planilha Excel jogada fora"
              />
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <StatCard
                value={<CountUpStat value={100} suffix="%" className="text-4xl font-black tracking-[-0.04em]" />}
                label="das comissões calculadas sozinhas"
              />
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <StatCard
                value={<CountUpStat value={1} className="text-4xl font-black tracking-[-0.04em]" />}
                label="clique para fechar o caixa do dia"
              />
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                O problema
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Seu negócio ainda roda no caderninho, no Excel e na memória da recepcionista?
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#525252]">
                Quanto mais a operação cresce, mais caro fica depender de improviso para tocar o
                dia.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {painPoints.map((item, index) => {
                const Icon = item.icon;

                return (
                  <ScrollReveal key={item.title} delay={index * 90}>
                    <div className="rounded-[2rem] border border-[#E6E6E6] bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-violet-50 text-violet-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold tracking-[-0.02em]">{item.title}</h3>
                      <p className="mt-3 text-base leading-relaxed text-[#525252]">
                        {item.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">
                A solução
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Tudo o que seu negócio precisa, num lugar que você entende.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#525252]">
                O ERP Receps junta rotina, controle e decisão em uma tela que faz sentido para
                quem vive a operação.
              </p>
            </ScrollReveal>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <ScrollReveal key={feature.title} delay={index * 80}>
                    <div className="rounded-[2rem] border border-[#E8E8E8] bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(135deg,#ede9fe_0%,#ecfeff_100%)] text-violet-600">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl font-bold tracking-[-0.03em]">{feature.title}</h3>
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

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 pb-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Segmentos
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Feito pra quem atende pessoa
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[#525252]">
                O Receps foi desenhado para negócios de atendimento que precisam de agenda,
                cadastro e financeiro organizados, independente do que você faz.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {segments.map((segment, index) => {
                const Icon = segment.icon;

                return (
                  <ScrollReveal key={segment.title} delay={index * 70}>
                    <div className="rounded-[1.75rem] border border-[#E8E8E8] bg-[#FCFCFC] p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,#ede9fe_0%,#ecfeff_100%)] text-violet-600">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-xl font-bold tracking-[-0.02em]">{segment.title}</h3>
                      {segment.description ? (
                        <p className="mt-2 text-sm leading-6 text-[#525252]">{segment.description}</p>
                      ) : null}
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#FAFAFA]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Como funciona
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Em três etapas, a operação sai do improviso e entra no controle.
              </h2>
            </ScrollReveal>

            <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="contents">
                    <ScrollReveal delay={index * 100}>
                      <div className="rounded-[2rem] border border-[#E6E6E6] bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                        <div className="mb-4 inline-flex rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700">
                          Passo {index + 1}
                        </div>
                        <div className="mb-5 flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-[1.25rem] bg-emerald-50 text-emerald-600">
                          <Icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold tracking-[-0.02em]">{step.title}</h3>
                        <p className="mt-3 text-base leading-relaxed text-[#525252]">
                          {step.description}
                        </p>
                      </div>
                    </ScrollReveal>

                    {index < steps.length - 1 ? (
                      <ScrollReveal
                        delay={index * 100 + 60}
                        className="flex justify-center py-2 lg:py-0"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E5E5E5] bg-white text-violet-500 shadow-sm">
                          <ArrowRight className="hidden h-5 w-5 lg:block" />
                          <ArrowDown className="h-5 w-5 lg:hidden" />
                        </div>
                      </ScrollReveal>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <ScrollReveal>
                <div className="space-y-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                    Comparativo
                  </p>
                  <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                    Sem ERP, o negócio apaga incêndio. Com ERP, ele enxerga o dia.
                  </h2>
                  <p className="text-lg leading-relaxed text-[#525252]">
                    A diferença não está só em organizar melhor. Está em recuperar tempo, reduzir
                    erro e tomar decisão com base no que realmente aconteceu.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="overflow-hidden rounded-[2rem] border border-[#E6E6E6] bg-white shadow-sm">
                  <div className="grid grid-cols-[1.05fr_0.95fr_0.95fr] border-b border-[#ECECEC] bg-[#FAFAFA]">
                    <div className="px-5 py-4 text-sm font-semibold text-[#737373]">Cenário</div>
                    <div className="px-5 py-4 text-sm font-semibold text-[#737373]">Sem ERP</div>
                    <div className="px-5 py-4 text-sm font-semibold text-violet-700">Com ERP Receps</div>
                  </div>

                  {comparisonRows.map(([label, withoutErp, withErp]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[1.05fr_0.95fr_0.95fr] border-b border-[#F0F0F0] last:border-b-0"
                    >
                      <div className="px-5 py-4 text-sm font-medium text-[#0A0A0A]">{label}</div>
                      <div className="flex items-center gap-2 px-5 py-4 text-sm text-[#737373]">
                        <X className="h-4 w-4 text-[#A3A3A3]" />
                        {withoutErp}
                      </div>
                      <div className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-emerald-700">
                        <Check className="h-4 w-4" />
                        {withErp}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section className="bg-[#F5F5F7]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal>
              <div className="rounded-[2.2rem] border border-[#E7E7E7] bg-white p-8 shadow-sm md:p-10">
                {/* TODO: substituir por depoimento real */}
                <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6_0%,#22c55e_100%)] text-2xl font-bold text-white shadow-lg">
                    C
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">
                      “Antes eu passava o domingo calculando comissão. Hoje abro o Receps, confiro
                      e pago. Ganhei meu domingo de volta.”
                    </p>
                    <p className="mt-4 text-base text-[#525252]">[Nome], proprietária</p>
                  </div>
                </div>
              </div>
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
                Perguntas que aparecem antes do negócio organizar a casa.
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

        <section className="bg-[#FAFAFA]">
          <div className="mx-auto max-w-5xl px-6 py-12">
            <ScrollReveal>
              <div className="rounded-[2rem] border border-[#E6E6E6] bg-white px-8 py-8 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">
                      Upsell suave
                    </p>
                    <h2 className="text-3xl font-black tracking-[-0.03em]">
                      Quer que a agenda se preencha sozinha?
                    </h2>
                    <p className="text-base leading-relaxed text-[#525252]">
                      O ERP Receps funciona sozinho, mas combina perfeito com a Ana, nossa
                      atendente IA que responde o WhatsApp 24h e marca na sua agenda
                      automaticamente.
                    </p>
                  </div>

                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.COMBO}
                    dataCta="erp-upsell-combo"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[#E5E5E5] bg-white px-6 py-4 text-base font-semibold text-[#0A0A0A] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Conhecer o combo ERP + Atendente IA
                  </ReferralCtaLink>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,#faf5ff_0%,#ffffff_32%,#f5f3ff_100%)]">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <ScrollReveal>
              <div className="rounded-[2.5rem] border border-violet-100 bg-white/80 px-8 py-12 text-center shadow-[0_24px_70px_rgba(139,92,246,0.10)] backdrop-blur md:px-12 md:py-16">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Operação organizada
                </div>

                <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl md:text-6xl">
                  Pare de perder horas em planilha. Comece a tomar decisão com dados.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#525252]">
                  Teste grátis por 7 dias. Cancele quando quiser. Sem fidelidade, sem burocracia.
                </p>

                <div className="mt-8 flex justify-center">
                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.ERP}
                    dataCta="erp-final"
                    magnetic
                    className="inline-flex min-h-[3.75rem] items-center justify-center gap-2 rounded-2xl bg-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.28)] transition-all hover:bg-violet-600 sm:min-w-[21.5rem]"
                  >
                    Assinar ERP — R$ 219,99/mês
                    <Sparkles className="h-4 w-4" />
                  </ReferralCtaLink>
                </div>

                <p className="mt-4 text-sm font-medium text-[#525252]">
                  R$ 7,33 por dia. Menos que um almoço executivo.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </>
  );
}

function StatCard({
  value,
  label,
}: {
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#E6E6E6] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="text-[#0A0A0A]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-[#525252]">{label}</p>
    </div>
  );
}
