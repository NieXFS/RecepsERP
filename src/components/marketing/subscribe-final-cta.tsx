import { ArrowUpRight, MessageCircle } from "lucide-react";

function getWhatsAppUrl() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER?.trim();
  if (!number) return null;

  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set(
    "text",
    "Oi! Quero ajuda pra escolher o plano do Receps."
  );
  return url.toString();
}

export function SubscribeFinalCta() {
  const whatsappUrl = getWhatsAppUrl();
  // Fallback: quando o número não estiver configurado no ambiente,
  // caímos em #contato — evita quebrar o build em previews sem envs.
  const href = whatsappUrl ?? "#contato";
  const isExternal = Boolean(whatsappUrl);

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/20 bg-primary/5 p-8 text-center sm:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-aurora-pan absolute -left-16 top-[-40%] h-[280px] w-[280px] rounded-full bg-primary/25 blur-3xl" />
        <div
          className="animate-aurora-pan absolute -right-16 bottom-[-40%] h-[280px] w-[280px] rounded-full bg-accent/30 blur-3xl"
          style={{ animationDelay: "5s", animationDuration: "24s" }}
        />
      </div>

      <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Ainda em dúvida sobre qual plano escolher?
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Fale com a gente pelo WhatsApp e a gente te ajuda a decidir em 2 minutos.
      </p>

      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="group mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40"
      >
        <MessageCircle aria-hidden="true" className="h-4 w-4" />
        <span>Conversar no WhatsApp</span>
        <ArrowUpRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </a>
    </section>
  );
}
