const QUESTIONS = [
  {
    question: "Preciso cadastrar cartão pra testar?",
    answer:
      "Não. Você escolhe o plano, cria sua conta e já entra direto no produto. O cartão só é solicitado se quiser continuar após o trial de 7 dias.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim, a qualquer momento. Se subir de plano, a cobrança é ajustada proporcionalmente. Se descer, a mudança vale na próxima fatura.",
  },
  {
    question: "O que acontece se eu cancelar?",
    answer:
      "Você mantém acesso até o fim do ciclo já pago e seus dados ficam disponíveis pra exportar por 30 dias.",
  },
  {
    question: "Minha clínica tem particularidades — tem suporte?",
    answer:
      "Sim. Todos os planos incluem suporte por WhatsApp em horário comercial. O plano combo tem prioridade.",
  },
] as const;

export function SubscribeFaq() {
  return (
    <section>
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
          <span
            aria-hidden="true"
            className="animate-glow-breathe inline-block h-1.5 w-1.5 rounded-full bg-primary"
          />
          Perguntas frequentes
        </div>
        <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Tudo que você precisa saber antes de começar.
        </h2>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {QUESTIONS.map((item) => (
          <div
            key={item.question}
            className="rounded-2xl border border-border/50 bg-background/60 p-6 backdrop-blur"
          >
            <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
