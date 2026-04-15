import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MessageCircleMore,
  MoonStar,
  Rabbit,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { CountUpStat } from "@/components/marketing/count-up-stat";
import { ForceLightTheme } from "@/components/marketing/force-light-theme";
import { ReferralCtaLink } from "@/components/marketing/referral-cta-link";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PLAN_SLUGS } from "@/lib/plans";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Atendente IA para WhatsApp de Clínicas, Barbearias e Salões | Receps",
  description:
    "Atenda no WhatsApp 24h por dia, responda em segundos e marque horários com uma IA feita para clínicas de estética, consultórios odontológicos, barbearias, salões e estúdios. Teste grátis por 7 dias.",
  openGraph: {
    title: "Atendente IA para WhatsApp de Clínicas, Barbearias e Salões | Receps",
    description:
      "Sua atendente de WhatsApp que responde rápido, agenda sozinha e atende no ritmo de clínicas, consultórios, barbearias, salões e estúdios.",
    images: ["/logo_texto.svg"],
  },
};

const painPoints = [
  {
    icon: MoonStar,
    title: "Mensagens chegam de madrugada",
    description: "Quando você vê de manhã, a cliente já pediu orçamento em outro lugar.",
  },
  {
    icon: Clock3,
    title: "A recepcionista faz três coisas ao mesmo tempo",
    description: "Telefone, presencial e WhatsApp disputam a mesma atenção o dia inteiro.",
  },
  {
    icon: MessageCircleMore,
    title: "Preço demora para sair",
    description: "A cliente pergunta, espera horas e fecha com quem respondeu primeiro.",
  },
];

const features = [
  {
    icon: Rabbit,
    title: "Responde em segundos",
    description:
      "Sua atendente IA entende a mensagem e responde com o tom do seu atendimento, 24h por dia.",
  },
  {
    icon: CalendarCheck2,
    title: "Marca na agenda sozinha",
    description:
      "Integra com o ERP Receps e confirma agendamentos sem precisar passar para ninguém.",
  },
  {
    icon: BrainCircuit,
    title: "Aprende sobre seu negócio",
    description:
      "Você configura serviços, horários e personalidade uma vez. Ela não esquece e não improvisa.",
  },
  {
    icon: MoonStar,
    title: "Nunca tira folga",
    description:
      "Domingo, feriado ou madrugada: chegou mensagem, a Ana responde com a mesma atenção.",
  },
];

const steps = [
  {
    icon: MessageCircleMore,
    title: "Cliente manda mensagem no WhatsApp",
    description: "A conversa começa no número do seu negócio, sem mudar o hábito do cliente.",
  },
  {
    icon: Bot,
    title: "Ana entende e consulta sua agenda",
    description: "Ela cruza intenção, serviço, horário disponível e segue o atendimento.",
  },
  {
    icon: CheckCircle2,
    title: "Agendamento confirmado automaticamente",
    description: "O cliente recebe a confirmação e sua equipe só acompanha o que entrou.",
  },
];

const comparisonRows = [
  ["Tempo de resposta", "2h", "3 segundos"],
  ["Horário de atendimento", "9h-18h", "24/7"],
  ["Clientes perdidos por demora", "Vários", "Zero"],
  ["Custo mensal", "R$ 2.800", "R$ 149,99"],
  ["Tira férias", "Sim", "Nunca"],
];

const faqs = [
  {
    question: "A Ana responde em português natural ou parece robô?",
    answer:
      "Ela foi pensada para falar de forma natural, objetiva e no tom do seu atendimento. A ideia é responder com clareza e rapidez, sem aquele jeito travado que afasta cliente.",
  },
  {
    question: "Como ela sabe o que responder sobre o meu negócio?",
    answer:
      "Você configura serviços, horários, regras e informações principais. A Ana usa esse contexto para responder com consistência e sem inventar moda.",
  },
  {
    question: "E se ela errar uma informação?",
    answer:
      "Você pode revisar a configuração, ajustar respostas e definir limites do que ela pode ou não responder. O foco é deixar o básico muito bem amarrado antes de escalar.",
  },
  {
    question: "Funciona no meu número atual de WhatsApp?",
    answer:
      "A proposta é operar no canal do seu negócio, sem obrigar o cliente a aprender outro fluxo. A etapa técnica de conexão acontece na ativação.",
  },
  {
    question: "Funciona pra qualquer tipo de negócio de atendimento?",
    answer:
      "Sim. A Ana atende clínicas de estética, consultórios odontológicos, barbearias, salões de beleza, centros estéticos e estúdios de serviços, como unha, sobrancelha, depilação e massagem. Em todos esses casos o fluxo é o mesmo: cliente manda mensagem, Ana entende, consulta a agenda e marca.",
  },
  {
    question: "Preciso de conhecimento técnico para configurar?",
    answer:
      "Não. A configuração foi pensada para quem toca operação real, não para quem programa. Você ajusta o essencial e a Ana começa a trabalhar em cima disso.",
  },
  {
    question: "Posso desativar quando quiser?",
    answer:
      "Pode. O plano é mensal, com 7 dias grátis, e você pode cancelar quando quiser se não fizer sentido para a sua rotina.",
  },
];

export default function AtendentesIaPage() {
  return (
    <>
      <ForceLightTheme />

      <div className="bg-white text-[#0A0A0A]">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f0ff_0%,#ffffff_26%,#ffffff_100%)]">
          <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,#c4b5fd_0%,rgba(196,181,253,0.28)_22%,rgba(255,255,255,0)_70%)]" />
          <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-[4.5rem] md:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-[7.5rem]">
            <div className="space-y-8">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm backdrop-blur">
                  <Bot className="h-4 w-4" />
                  Produto Receps
                </div>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <div className="space-y-5">
                  <h1 className="max-w-4xl text-5xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                    Sua atendente de WhatsApp que nunca dorme, nunca esquece e agenda sozinha.
                  </h1>
                  <p className="max-w-2xl text-lg leading-relaxed text-[#525252] sm:text-xl">
                    Enquanto você atende uma cliente, a Ana responde as outras 20 que chegaram.
                    Marca horário, tira dúvida, confirma atendimento e mantém sua agenda viva 24h
                    por dia, no tom do seu negócio, seja clínica, barbearia, salão ou consultório.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={140}>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.ATENDENTE_IA}
                    dataCta="atendente-ia-hero"
                    magnetic
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.28)] transition-all hover:bg-violet-600 sm:min-w-72"
                  >
                    Assinar por R$ 149,99/mês
                    <ArrowRight className="h-4 w-4" />
                  </ReferralCtaLink>

                  <Link
                    href="#demonstracao"
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

            <ScrollReveal className="lg:justify-self-end" delay={180}>
              <div className="relative mx-auto w-full max-w-[34rem]">
                <div className="absolute -left-6 top-12 hidden rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-700 shadow-lg lg:block">
                  Atendente online agora
                </div>
                <div className="absolute -right-3 top-6 rounded-full border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 shadow-lg">
                  Responde em segundos
                </div>

                <div className="rounded-[2rem] border border-white/80 bg-white/85 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
                  <div className="rounded-[1.6rem] border border-[#EFEFEF] bg-[#fdfdfd] p-4 shadow-inner">
                    <div className="mb-4 flex items-center justify-between rounded-[1.3rem] bg-[#f5f5f7] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#0A0A0A]">Ana • Receps IA</p>
                          <p className="text-sm text-[#525252]">Atendendo 24h no seu WhatsApp</p>
                        </div>
                      </div>
                      <div className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white">
                        online
                      </div>
                    </div>

                    <div className="space-y-3 rounded-[1.5rem] bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_18%,#f4fff9_100%)] p-4">
                      <div className="flex justify-start">
                        <div
                          className="max-w-[82%] rounded-[1.3rem] rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-[#1f2937] shadow-sm animate-fade-in-up"
                        >
                          Oi, queria marcar um horário amanhã.
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div
                          className="max-w-[82%] rounded-[1.3rem] rounded-br-md bg-[#dcfce7] px-4 py-3 text-sm leading-6 text-[#14532d] shadow-sm animate-fade-in-up"
                          style={{ animationDelay: "180ms" }}
                        >
                          Tem sim. Amanhã consigo às 10h, 14h ou 16h. Qual fica melhor para você?
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <div
                          className="max-w-[82%] rounded-[1.3rem] rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-[#1f2937] shadow-sm animate-fade-in-up"
                          style={{ animationDelay: "360ms" }}
                        >
                          14h. Quanto tempo dura?
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div
                          className="max-w-[82%] rounded-[1.3rem] rounded-br-md bg-[#dcfce7] px-4 py-3 text-sm leading-6 text-[#14532d] shadow-sm animate-fade-in-up"
                          style={{ animationDelay: "540ms" }}
                        >
                          Cerca de 50 minutos. Já deixei seu horário reservado para amanhã às 14h.
                          Posso confirmar?
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div
                          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-2 text-[#525252] shadow-sm animate-fade-in-up"
                          style={{ animationDelay: "720ms" }}
                        >
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" style={{ animationDelay: "140ms" }} />
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" style={{ animationDelay: "280ms" }} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.25rem] border border-[#EAEAEA] bg-white p-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#737373]">
                          Resposta
                        </p>
                        <p className="mt-2 text-lg font-bold text-[#0A0A0A]">&lt; 3 segundos</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-[#EAEAEA] bg-white p-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#737373]">
                          Status
                        </p>
                        <p className="mt-2 text-lg font-bold text-[#0A0A0A]">Agenda atualizada</p>
                      </div>
                      <div className="rounded-[1.25rem] border border-[#EAEAEA] bg-white p-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#737373]">
                          Resultado
                        </p>
                        <p className="mt-2 text-lg font-bold text-[#0A0A0A]">Horário marcado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-y border-[#ECECEC] bg-[#FAFAFA]">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-2 xl:grid-cols-4">
            <ScrollReveal>
              <StatCard
                value={<CountUpStat value={2500} suffix="+" className="text-4xl font-black tracking-[-0.04em]" />}
                label="mensagens respondidas por dia"
              />
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <StatCard
                value={<CountUpStat value={87} suffix="%" className="text-4xl font-black tracking-[-0.04em]" />}
                label="dos agendamentos feitos fora do horário comercial"
              />
            </ScrollReveal>
            <ScrollReveal delay={160}>
              <StatCard
                value={<CountUpStat value={3} prefix="< " className="text-4xl font-black tracking-[-0.04em]" />}
                label="segundos de tempo médio de resposta"
              />
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <StatCard
                value={<CountUpStat value={24} suffix="/7" className="text-4xl font-black tracking-[-0.04em]" />}
                label="sem pausa para almoço, sem intervalo, sem dormir"
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
                Você já perdeu uma cliente porque demorou para responder?
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#525252]">
                Na prática, quem responde primeiro quase sempre sai na frente. E a cliente não
                costuma avisar quando desistiu.
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

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">
                A solução
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                A Ana responde antes da cliente pensar em desistir.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[#525252]">
                Ela entra onde hoje existe fila, espera e perda de atenção. O resultado é mais
                conversa acontecendo e mais horário preenchido.
              </p>
            </ScrollReveal>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <ScrollReveal key={feature.title} delay={index * 90}>
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

        <section id="demonstracao" className="bg-[#FAFAFA]">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <ScrollReveal className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-600">
                Como funciona
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Em três passos, a conversa vira agendamento.
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
                    Sem a Ana, a conversa esfria. Com a Ana, ela anda.
                  </h2>
                  <p className="text-lg leading-relaxed text-[#525252]">
                    Não é sobre trocar gente por robô. É sobre não deixar oportunidade parada
                    esperando alguém sobrar.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={100}>
                <div className="overflow-hidden rounded-[2rem] border border-[#E6E6E6] bg-white shadow-sm">
                  <div className="grid grid-cols-[1.05fr_0.95fr_0.95fr] border-b border-[#ECECEC] bg-[#FAFAFA]">
                    <div className="px-5 py-4 text-sm font-semibold text-[#737373]">Cenário</div>
                    <div className="px-5 py-4 text-sm font-semibold text-[#737373]">Sem a Ana</div>
                    <div className="px-5 py-4 text-sm font-semibold text-violet-700">Com a Ana</div>
                  </div>

                  {comparisonRows.map(([label, withoutAna, withAna]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[1.05fr_0.95fr_0.95fr] border-b border-[#F0F0F0] last:border-b-0"
                    >
                      <div className="px-5 py-4 text-sm font-medium text-[#0A0A0A]">{label}</div>
                      <div className="flex items-center gap-2 px-5 py-4 text-sm text-[#737373]">
                        <X className="h-4 w-4 text-[#A3A3A3]" />
                        {withoutAna}
                      </div>
                      <div className="flex items-center gap-2 px-5 py-4 text-sm font-semibold text-emerald-700">
                        <Check className="h-4 w-4" />
                        {withAna}
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
                {/* TODO: rotacionar depoimentos de segmentos diferentes (clinica, barbearia, odonto, salao) */}
                <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6_0%,#22c55e_100%)] text-2xl font-bold text-white shadow-lg">
                    D
                  </div>
                  <div>
                    <p className="text-2xl font-bold tracking-[-0.03em] text-[#0A0A0A]">
                      “A Ana atendeu 340 clientes no primeiro mês. Minha recepcionista agora foca
                      só nos atendimentos presenciais.”
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
                Perguntas que aparecem antes de colocar a Ana para atender.
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

        <section
          id="cta-final"
          className="bg-[linear-gradient(180deg,#faf5ff_0%,#ffffff_32%,#f5f3ff_100%)]"
        >
          <div className="mx-auto max-w-6xl px-6 py-24">
            <ScrollReveal>
              <div className="rounded-[2.5rem] border border-violet-100 bg-white/80 px-8 py-12 text-center shadow-[0_24px_70px_rgba(139,92,246,0.10)] backdrop-blur md:px-12 md:py-16">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Ativação rápida
                </div>

                <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl md:text-6xl">
                  Seu próximo cliente pode estar sendo atendido enquanto você lê isso.
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#525252]">
                  Teste grátis por 7 dias. Cancele quando quiser. Sem fidelidade, sem burocracia.
                </p>

                <div className="mt-8 flex justify-center">
                  <ReferralCtaLink
                    planSlug={PLAN_SLUGS.ATENDENTE_IA}
                    dataCta="atendente-ia-final"
                    magnetic
                    className="inline-flex min-h-[3.75rem] items-center justify-center gap-2 rounded-2xl bg-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(139,92,246,0.28)] transition-all hover:bg-violet-600 sm:min-w-[21.5rem]"
                  >
                    Assinar Atendente IA — R$ 149,99/mês
                    <Sparkles className="h-4 w-4" />
                  </ReferralCtaLink>
                </div>

                <p className="mt-4 text-sm font-medium text-[#525252]">
                  R$ 4,99 por dia. Mais barato que um café.
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
