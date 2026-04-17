import Link from "next/link";
import { Lock } from "lucide-react";
import type { PlanProductModule } from "@/lib/plan-modules";

const UPSELL_COPY: Record<
  PlanProductModule,
  { title: string; description: string }
> = {
  erp: {
    title: "Esse módulo faz parte do plano ERP",
    description:
      "Agenda, clientes, financeiro e mais. Faça upgrade para desbloquear — ou combine os dois no combo com desconto.",
  },
  bot: {
    title: "Esse módulo faz parte do plano Atendente IA",
    description:
      "A Atendente IA cuida do seu WhatsApp 24h, agenda clientes automaticamente e nunca perde uma mensagem. Faça upgrade para desbloquear — ou combine os dois no combo com desconto.",
  },
};

/**
 * Tela de upsell renderizada quando o tenant acessa um módulo
 * que não está incluído no plano contratado.
 */
export function ModuleUpsell({ product }: { product: PlanProductModule }) {
  const copy = UPSELL_COPY[product];

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-5 text-center animate-fade-in-down">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground/60" />
      </div>

      <div className="flex flex-col gap-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">{copy.title}</h2>
        <p className="text-muted-foreground">{copy.description}</p>
      </div>

      <Link
        href="/configuracoes/assinatura"
        className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Ver planos disponíveis
      </Link>
    </div>
  );
}
