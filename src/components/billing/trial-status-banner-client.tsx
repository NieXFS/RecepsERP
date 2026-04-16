"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, Sparkles, X } from "lucide-react";
import { BillingPortalButton } from "@/components/billing/billing-portal-button";

type TrialStatusBannerClientProps = {
  daysRemaining: number;
  hasPaymentMethod: boolean;
  trialEndFormatted: string;
};

const DISMISS_COOKIE = "trial_banner_dismissed";
const DISMISS_MAX_AGE = 60 * 60 * 24;

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  return value ? decodeURIComponent(value) : null;
}

function dismissCookie() {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${DISMISS_COOKIE}=1; path=/; max-age=${DISMISS_MAX_AGE}; samesite=lax${secure}`;
}

export function TrialStatusBannerClient({
  daysRemaining,
  hasPaymentMethod,
  trialEndFormatted,
}: TrialStatusBannerClientProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(getCookie(DISMISS_COOKIE) === "1");
  }, []);

  if (dismissed) {
    return null;
  }

  const tone = hasPaymentMethod
    ? {
        wrapper: "border-emerald-500/20 bg-emerald-500/5",
        icon: "bg-emerald-500/10 text-emerald-600",
        eyebrow: "Trial ativo",
      }
    : daysRemaining <= 1
      ? {
          wrapper: "border-destructive/20 bg-destructive/5",
          icon: "bg-destructive/10 text-destructive",
          eyebrow: daysRemaining <= 0 ? "Trial acaba hoje" : "Último dia de atenção",
        }
      : {
          wrapper: "border-amber-500/20 bg-amber-500/5",
          icon: "bg-amber-500/10 text-amber-600",
          eyebrow: "Trial acabando",
        };

  const remainingLabel = hasPaymentMethod
    ? `Trial ativo, cartão cadastrado. Faltam ${daysRemaining} dia${daysRemaining === 1 ? "" : "s"} até a primeira cobrança em ${trialEndFormatted}.`
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
            {hasPaymentMethod ? (
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

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          {!hasPaymentMethod ? (
            <BillingPortalButton
              label="Adicionar cartão"
              returnUrl="/dashboard"
              className="w-full xl:w-auto"
              variant="outline"
            />
          ) : (
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-background/80 px-3 py-2 text-xs font-medium text-emerald-700">
              <CreditCard className="h-3.5 w-3.5" />
              Cartão cadastrado
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              dismissCookie();
              setDismissed(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
