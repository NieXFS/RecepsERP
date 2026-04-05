import Link from "next/link";
import { ArrowRight, Bot, Headset, MessageSquareMore, Workflow } from "lucide-react";

const pillars = [
  {
    title: "Qualificação sem fila manual",
    description:
      "Atendentes IA organizam entrada de leads, respondem dúvidas frequentes e reduzem gargalo comercial.",
    icon: Bot,
  },
  {
    title: "Conversas com contexto",
    description:
      "Scripts, objeções e próximos passos ficam mais consistentes do que em atendimentos improvisados.",
    icon: MessageSquareMore,
  },
  {
    title: "Escala com supervisão",
    description:
      "A operação comercial cresce sem depender de aumentar equipe humana na mesma proporção.",
    icon: Headset,
  },
  {
    title: "Integração com o restante da marca",
    description:
      "O produto existe dentro da arquitetura Receps e conversa com a visão comercial do ERP no futuro.",
    icon: Workflow,
  },
];

/**
 * Landing comercial do produto Atendentes IA.
 * Apresenta o segundo produto da marca Receps sem acoplar ao app autenticado do ERP.
 */
export default function AtendentesIaPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.86_0.09_160/0.24),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-700 dark:text-emerald-300">
              <Bot className="h-4 w-4" />
              Produto Receps
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Atendentes IA para acelerar a conversa certa, no momento certo.
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Um produto comercial da Receps para atendimento, qualificação e resposta com mais
              consistência operacional antes mesmo do cliente entrar no ERP.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-emerald-600/20 transition-all hover:bg-emerald-600/90"
              >
                Falar com a Receps
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/erp"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Conhecer o ERP
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <div
                key={pillar.title}
                className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold">{pillar.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
