const STATS = [
  { value: "1M+", label: "Mensagens trocadas no WhatsApp" },
  { value: "98%", label: "Retenção após o trial de 7 dias" },
  { value: "24/7", label: "Atendimento automatizado em operação" },
  { value: "5 min", label: "Para começar a operar depois do login" },
] as const;

/**
 * Barra de métricas social-proof — substitui logos enquanto não existem reais.
 */
export function SubscribeTrustBar() {
  return (
    <section className="border-t border-border/60 pt-10">
      <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Confiado por clínicas em todo o Brasil
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-4 py-6 text-center backdrop-blur"
          >
            <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
