import { differenceInCalendarDays } from "date-fns";
import { AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
  }).format(value);
}

export async function TrialStatusBanner({ tenantId }: { tenantId: string }) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscription: {
        select: {
          status: true,
          trialEnd: true,
          defaultPaymentMethod: true,
        },
      },
    },
  });

  const subscription = tenant?.subscription;

  if (!subscription || subscription.status !== "TRIALING" || !subscription.trialEnd) {
    return null;
  }

  const daysRemaining = Math.max(0, differenceInCalendarDays(subscription.trialEnd, new Date()));
  const hasPaymentMethod = Boolean(subscription.defaultPaymentMethod);

  const tone =
    hasPaymentMethod || daysRemaining > 3
      ? {
          wrapper: "border-emerald-500/20 bg-emerald-500/5",
          icon: "bg-emerald-500/10 text-emerald-600",
          eyebrow: "Trial ativo",
        }
      : daysRemaining > 0
        ? {
            wrapper: "border-amber-500/20 bg-amber-500/5",
            icon: "bg-amber-500/10 text-amber-600",
            eyebrow: "Trial acabando",
          }
        : {
            wrapper: "border-destructive/20 bg-destructive/5",
            icon: "bg-destructive/10 text-destructive",
            eyebrow: "Trial acaba hoje",
          };

  const remainingLabel = hasPaymentMethod
    ? `Seu trial vai até ${formatDate(subscription.trialEnd)} e sua forma de pagamento já está salva.`
    : daysRemaining <= 0
      ? "Seu trial acaba hoje. Adicione uma forma de pagamento agora para continuar sem interrupção."
      : daysRemaining === 1
        ? "Falta 1 dia para o fim do seu trial. Adicione uma forma de pagamento para continuar."
        : `Faltam ${daysRemaining} dias para o fim do seu trial. Adicione uma forma de pagamento para continuar.`;

  return (
    <div className={`mb-6 rounded-[1.5rem] border px-5 py-4 shadow-sm ${tone.wrapper}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
            {hasPaymentMethod || daysRemaining > 3 ? (
              <Sparkles className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{tone.eyebrow}</p>
            <p className="text-sm leading-6 text-muted-foreground">{remainingLabel}</p>
          </div>
        </div>

        {!hasPaymentMethod ? (
          <BillingPortalButton
            label="Adicionar forma de pagamento"
            returnUrl="/dashboard"
            className="w-full xl:w-auto"
            variant="outline"
          />
        ) : (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-background/80 px-3 py-2 text-xs font-medium text-emerald-700">
            <CreditCard className="h-3.5 w-3.5" />
            Forma de pagamento salva
          </div>
        )}
      </div>
    </div>
  );
}
