const TWINKLES: Array<{ top: string; left: string; size: string; delay: string }> = [
  { top: "28%", left: "16%", size: "h-[3px] w-[3px]", delay: "0.6s" },
  { top: "42%", left: "74%", size: "h-1 w-1", delay: "1.8s" },
  { top: "66%", left: "34%", size: "h-[2px] w-[2px]", delay: "2.9s" },
];

/**
 * Hero compacto da /assinar — aurora como halo ambiente atrás do texto,
 * sem wrapper com fundo ou borda. Os blobs extrapolam o <section> de propósito
 * pra nunca formar um retângulo visível.
 */
export function SubscribeHero() {
  return (
    <section className="animate-fade-in-down relative isolate px-6 py-10 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-aurora-pan absolute -left-10 -top-24 h-[500px] w-[700px] rounded-full bg-gradient-to-br from-primary/15 via-accent/10 to-transparent blur-[120px]" />
        <div
          className="animate-aurora-pan absolute -right-24 top-1/4 h-[460px] w-[620px] rounded-full bg-gradient-to-tl from-accent/15 via-primary/10 to-transparent blur-[120px]"
          style={{ animationDelay: "4s", animationDuration: "22s" }}
        />
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

        <h1 className="animate-fade-in-up mt-4 font-heading text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Pronto para{" "}
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            transformar
          </span>{" "}
          sua clínica?
        </h1>

        <p
          className="animate-fade-in-up mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base"
          style={{ animationDelay: "120ms" }}
        >
          Teste grátis por 7 dias. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
}
