import { CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BillingPortalButton } from "./billing-portal-button";
import { cn } from "@/lib/utils";

export function BillingManagementCard({
  currentPeriodEnd,
  cancelAtPeriodEnd,
  defaultPaymentMethod,
}: {
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  defaultPaymentMethod: { label: string; expiresAt: string | null } | null;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-primary/10 bg-card/60 p-5 backdrop-blur-sm ring-1 ring-primary/5 md:p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {cancelAtPeriodEnd ? "Termina em" : "Próxima cobrança"}
        </p>
        <p className="mt-2 font-heading text-2xl font-bold tabular-nums md:text-3xl">
          {format(currentPeriodEnd, "d 'de' MMM", { locale: ptBR })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {format(currentPeriodEnd, "EEEE, yyyy", { locale: ptBR })}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Forma de pagamento
        </p>
        {defaultPaymentMethod ? (
          <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
            >
              <CreditCard className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium leading-tight">
                {defaultPaymentMethod.label}
              </p>
              {defaultPaymentMethod.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expira em {defaultPaymentMethod.expiresAt}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/70 bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              Nenhum cartão cadastrado
            </p>
            <BillingPortalButton
              returnUrl="/configuracoes/assinatura"
              variant="ghost"
              label="Adicionar"
              className={cn("h-auto p-0 text-primary underline-offset-4 hover:bg-transparent hover:underline")}
            />
          </div>
        )}
      </div>

      <div className="mt-auto space-y-2 border-t border-border/50 pt-4">
        <BillingPortalButton
          returnUrl="/configuracoes/assinatura"
          variant="outline"
          label="Gerenciar no Stripe"
          className="w-full"
        />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Atualize o cartão, baixe faturas ou cancele direto no portal seguro do Stripe.
        </p>
      </div>
    </section>
  );
}
