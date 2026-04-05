import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  DollarSign,
  FileText,
  Shield,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Visão multi-profissional com detecção automática de conflitos de sala, equipamento e horário.",
  },
  {
    icon: FileText,
    title: "Prontuário Eletrônico",
    description:
      "Histórico clínico, evolução e timeline operacional conectados ao atendimento.",
  },
  {
    icon: Warehouse,
    title: "Estoque Automatizado",
    description:
      "Baixa de insumos por ficha técnica e alerta de estoque crítico sem planilha paralela.",
  },
  {
    icon: DollarSign,
    title: "Financeiro com Comissão",
    description:
      "Checkout, split por profissional e acerto financeiro em fluxo transacional único.",
  },
  {
    icon: Shield,
    title: "Multitenant Seguro",
    description:
      "Cada operação roda isolada por tenant, preservando dados, permissões e consistência.",
  },
  {
    icon: Users,
    title: "Equipe e RBAC",
    description:
      "Admin, recepção e profissionais recebem acessos coerentes com a realidade da clínica.",
  },
];

/**
 * Landing comercial dedicada ao ERP dentro da marca Receps.
 * Mantém a proposta de valor do produto, mas substitui auto-cadastro por onboarding controlado.
 */
export default function ErpLandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.82_0.1_285/0.22),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-4 w-4" />
              ERP Receps para saúde e beleza
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              O sistema operacional da sua clínica, salão ou barbearia.
            </h1>

            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Agenda, clientes, prontuário, estoque e financeiro conectados em um fluxo único.
              O acesso agora acontece de forma controlada para garantir implantação mais segura.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/solicitar-acesso"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Solicitar acesso
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/20">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tudo o que a operação precisa, sem o caos das ferramentas soltas
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              O ERP continua com a mesma base funcional do PASSO 11, agora reposicionado dentro da
              arquitetura correta de produto.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-[1.5rem] border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[2rem] border border-border/70 bg-card px-8 py-10 shadow-xl shadow-primary/10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Onboarding controlado
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Sem signup público, com implantação mais consistente.
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                O fluxo agora é simples: sua empresa solicita acesso, nosso time aprova, gera o
                convite e a ativação final acontece por link seguro. Isso preserva qualidade de
                implantação e evita tenants criados sem contexto comercial.
              </p>
            </div>

            <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-background p-6">
              <p className="text-sm font-medium">Como funciona</p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li>1. Você envia a solicitação comercial do ERP.</li>
                <li>2. O time Receps valida o contexto e aprova a implantação.</li>
                <li>3. Um convite seguro ativa o tenant e a conta principal.</li>
              </ol>
              <Link
                href="/solicitar-acesso"
                className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-primary hover:underline"
              >
                Quero implantar o ERP
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
