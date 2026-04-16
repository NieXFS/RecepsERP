import type { Metadata } from "next";
import { HelpSearch } from "@/components/help/help-search";
import { helpArticles } from "@/lib/help/articles";

export const metadata: Metadata = {
  title: "Ajuda | Receps",
  description:
    "Tire dúvidas sobre signup, trial, agenda, financeiro, cobrança e Atendente IA no centro de ajuda do Receps.",
};

export default function HelpPage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_20%,#ffffff_100%)]">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
            Central de ajuda
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Tire suas dúvidas sobre o Receps
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Guias rápidos para o seu primeiro acesso, agenda, financeiro, cobrança e
            ativação do atendimento pelo WhatsApp.
          </p>
        </div>

        <div className="mt-12">
          <HelpSearch articles={helpArticles} />
        </div>
      </section>
    </div>
  );
}
