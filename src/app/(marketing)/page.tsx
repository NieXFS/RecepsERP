import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Building2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const products = [
  {
    title: "Atendentes IA",
    href: "/atendentes-ia",
    icon: Bot,
    description:
      "Agentes que qualificam, respondem e aceleram o comercial sem depender de playbooks engessados.",
    accent: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  {
    title: "ERP",
    href: "/erp",
    icon: CalendarDays,
    description:
      "Operação completa para saúde e beleza com agenda, clientes, prontuário, estoque e financeiro.",
    accent: "from-primary/20 via-primary/5 to-transparent",
  },
];

const differentiators = [
  {
    title: "Arquitetura de marca única",
    description:
      "Receps concentra aquisição, implantação e evolução dos produtos sem fragmentar experiência ou posicionamento.",
    icon: Building2,
  },
  {
    title: "Entrada controlada no ERP",
    description:
      "O ERP agora opera em self-service: escolha o plano, crie a conta e siga direto para o pagamento.",
    icon: ShieldCheck,
  },
  {
    title: "Foco operacional real",
    description:
      "Cada fluxo foi pensado para quem atende agenda cheia, equipe enxuta e pressão por margem no dia a dia.",
    icon: Sparkles,
  },
];

/**
 * Página institucional da marca Receps.
 * Funciona como hub comercial e reposiciona o ERP como um dos produtos da plataforma.
 */
export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.82_0.1_285/0.25),transparent_28%),radial-gradient(circle_at_bottom_right,oklch(0.86_0.08_160/0.18),transparent_24%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <ShieldCheck className="h-4 w-4" />
              Plataforma Receps
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Receps organiza a relação entre aquisição, atendimento e operação.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Uma marca, dois produtos e uma arquitetura mais madura para crescer:
                Atendentes IA na frente comercial e ERP Receps na operação do negócio.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/erp"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Conhecer o ERP
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/atendentes-ia"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Ver Atendentes IA
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-border/70 bg-background/80 p-5 shadow-2xl shadow-primary/10 backdrop-blur">
            {products.map((product) => {
              const Icon = product.icon;

              return (
                <Link
                  key={product.title}
                  href={product.href}
                  className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${product.accent}`} />
                  <div className="relative space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/90 text-primary ring-1 ring-border">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-lg font-semibold">{product.title}</p>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {product.description}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      Acessar produto
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-18">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
              Diferenciais
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              O reposicionamento do produto já nasce pronto para a próxima etapa.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {differentiators.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-border/70 bg-background p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-18">
        <div className="rounded-[2rem] border border-border/70 bg-card px-8 py-10 shadow-xl shadow-primary/8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Próximo passo
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Se o ERP fizer sentido para sua operação, você já pode começar hoje.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Escolha o plano ideal, crie sua conta e entre no fluxo de assinatura sem depender
                de aprovação manual.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/assinar"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Ver planos
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
