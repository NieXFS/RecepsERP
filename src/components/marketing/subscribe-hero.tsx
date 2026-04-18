import { CreditCard, Lock, Sparkles } from "lucide-react";

const TWINKLES: Array<{ top: string; left: string; size: string; delay: string }> = [
  { top: "16%", left: "12%", size: "h-1 w-1", delay: "0s" },
  { top: "22%", left: "78%", size: "h-[3px] w-[3px]", delay: "1.2s" },
  { top: "58%", left: "8%", size: "h-[2px] w-[2px]", delay: "2.4s" },
  { top: "44%", left: "88%", size: "h-1 w-1", delay: "0.8s" },
  { top: "72%", left: "70%", size: "h-[3px] w-[3px]", delay: "1.9s" },
  { top: "84%", left: "24%", size: "h-[2px] w-[2px]", delay: "3.1s" },
];

const TRUST_CHIPS = [
  { icon: Sparkles, label: "7 dias grátis" },
  { icon: Lock, label: "Cancele quando quiser" },
  { icon: CreditCard, label: "Sem fidelidade" },
] as const;

/**
 * Hero imersivo da /assinar — aurora + twinkles + headline com gradient.
 * Mantém-se dentro do container max-w-6xl mas rompe do resto com painel arredondado.
 */
export function SubscribeHero() {
  return (
    <section className="animate-fade-in-down relative isolate overflow-hidden rounded-[2.5rem] border border-border/40 bg-background px-6 py-16 sm:px-10 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-aurora-pan absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-primary/25 blur-3xl" />
        <div
          className="animate-aurora-pan absolute -right-20 top-1/4 h-[380px] w-[380px] rounded-full bg-accent/40 blur-3xl"
          style={{ animationDelay: "4s", animationDuration: "22s" }}
        />
        <div
          className="animate-aurora-pan absolute bottom-[-30%] left-1/3 h-[360px] w-[360px] rounded-full bg-ring/20 blur-3xl"
          style={{ animationDelay: "7s", animationDuration: "26s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,oklch(0_0_0/0.18)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_45%,oklch(0_0_0/0.45)_100%)]" />
        {TWINKLES.map((t, i) => (
          <span
            key={i}
            className={`animate-twinkle absolute rounded-full bg-primary/50 ${t.size}`}
            style={{ top: t.top, left: t.left, animationDelay: t.delay }}
          />
        ))}
      </div>

      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
          <span
            aria-hidden="true"
            className="animate-glow-breathe inline-block h-1.5 w-1.5 rounded-full bg-primary"
          />
          Planos
        </div>

        <h1 className="animate-fade-in-up mt-6 font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Comece a{" "}
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            transformar
          </span>
          <br />
          sua clínica hoje.
        </h1>

        <p
          className="animate-fade-in-up mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "120ms" }}
        >
          Escolha o plano ideal, teste grátis por 7 dias e cancele quando quiser.
          Sem fidelidade, sem burocracia.
        </p>

        <div
          className="animate-fade-in-up mt-7 flex flex-wrap gap-3"
          style={{ animationDelay: "220ms" }}
        >
          {TRUST_CHIPS.map((chip) => {
            const Icon = chip.icon;
            return (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur"
              >
                <Icon aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                {chip.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
