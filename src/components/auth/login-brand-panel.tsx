import { CalendarCheck2, MessageCircle, TrendingUp } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: CalendarCheck2,
    title: "Agenda 24h sem esforço",
    description: "Confirmações automáticas, lembretes e reagendamento no WhatsApp.",
  },
  {
    icon: MessageCircle,
    title: "Atendente IA no WhatsApp",
    description: "A Ana responde dúvidas e encaixa horários em segundos.",
  },
  {
    icon: TrendingUp,
    title: "Financeiro que fecha sozinho",
    description: "Receitas, comissões e repasses consolidados em tempo real.",
  },
];

const TWINKLES: Array<{ top: string; left: string; size: string; delay: string }> = [
  { top: "14%", left: "18%", size: "h-1 w-1", delay: "0s" },
  { top: "22%", left: "72%", size: "h-[3px] w-[3px]", delay: "1.1s" },
  { top: "48%", left: "12%", size: "h-[2px] w-[2px]", delay: "2.3s" },
  { top: "38%", left: "82%", size: "h-1 w-1", delay: "0.6s" },
  { top: "68%", left: "68%", size: "h-[3px] w-[3px]", delay: "1.8s" },
  { top: "82%", left: "28%", size: "h-[2px] w-[2px]", delay: "2.9s" },
];

/**
 * Painel imersivo de marca renderizado à esquerda no layout de login em lg+.
 * Sem estado — apenas composição visual.
 */
export function LoginBrandPanel() {
  return (
    <aside className="relative isolate hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, black 0%, black 55%, transparent 92%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 55%, transparent 92%)",
        }}
      >
        <div
          className="animate-aurora-pan absolute -left-40 top-[-18%] h-[640px] w-[640px] rounded-full bg-primary/25 blur-[140px]"
        />
        <div
          className="animate-aurora-pan absolute -left-16 bottom-[-20%] h-[520px] w-[520px] rounded-full bg-accent/30 blur-[150px]"
          style={{ animationDelay: "3s", animationDuration: "22s" }}
        />
        <div
          className="animate-aurora-pan absolute left-[20%] top-[38%] h-[360px] w-[360px] rounded-full bg-ring/18 blur-[140px]"
          style={{ animationDelay: "6s", animationDuration: "26s" }}
        />
        {TWINKLES.map((t, i) => (
          <span
            key={i}
            className={`animate-twinkle absolute rounded-full bg-primary/50 ${t.size}`}
            style={{ top: t.top, left: t.left, animationDelay: t.delay }}
          />
        ))}
      </div>

      <div className="animate-fade-in-down flex items-center">
        <BrandLogo className="!w-auto !justify-start" />
      </div>

      <div className="relative flex max-w-lg flex-col gap-10">
        <div className="space-y-4">
          <h2 className="animate-fade-in-up font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-foreground xl:text-5xl">
            A recepção inteligente
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              da sua clínica.
            </span>
          </h2>
          <p
            className="animate-fade-in-up max-w-md text-base leading-relaxed text-muted-foreground"
            style={{ animationDelay: "120ms" }}
          >
            Agenda, WhatsApp e financeiro em uma plataforma só — pronta para trabalhar enquanto você cuida dos seus pacientes.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="animate-fade-in-up flex items-start gap-3 rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-md"
                style={{ animationDelay: `${220 + index * 90}ms` }}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {feature.title}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p
        className="animate-fade-in-up relative text-xs text-muted-foreground"
        style={{ animationDelay: "520ms" }}
      >
        Usado por clínicas de estética e saúde em todo o Brasil.
      </p>
    </aside>
  );
}
