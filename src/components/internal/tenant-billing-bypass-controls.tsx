"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setTenantBillingBypassAction } from "@/actions/global-admin.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TenantBillingBypassControlsProps = {
  tenantId: string;
  subscriptionStatus: string | null;
  billingBypassEnabled: boolean;
  billingBypassReason: string | null;
  billingBypassUpdatedAt: Date | null;
};

function formatDateTime(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function getEffectiveStatusLabel(props: {
  subscriptionStatus: string | null;
  billingBypassEnabled: boolean;
}) {
  if (props.billingBypassEnabled && !["TRIALING", "ACTIVE"].includes(props.subscriptionStatus ?? "")) {
    return {
      label: "Liberado manualmente",
      className: "bg-amber-500 text-white hover:bg-amber-500",
    };
  }

  if (props.subscriptionStatus === "TRIALING") {
    return {
      label: "Trial",
      className: "bg-emerald-600 text-white hover:bg-emerald-600",
    };
  }

  if (props.subscriptionStatus === "ACTIVE") {
    return {
      label: "Assinatura ativa",
      className: "bg-emerald-600 text-white hover:bg-emerald-600",
    };
  }

  return {
    label: "Bloqueado",
    className: "bg-destructive/10 text-destructive hover:bg-destructive/10",
  };
}

export function TenantBillingBypassControls({
  tenantId,
  subscriptionStatus,
  billingBypassEnabled,
  billingBypassReason,
  billingBypassUpdatedAt,
}: TenantBillingBypassControlsProps) {
  const router = useRouter();
  const [reason, setReason] = useState(billingBypassReason ?? "");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const statusBadge = getEffectiveStatusLabel({
    subscriptionStatus,
    billingBypassEnabled,
  });

  function handleSubmit(enabled: boolean) {
    setError("");

    startTransition(async () => {
      const result = await setTenantBillingBypassAction({
        tenantId,
        enabled,
        reason,
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success(
        enabled
          ? "Liberação manual de billing atualizada."
          : "Liberação manual removida."
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium">Status efetivo do acesso</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
            <Badge variant="outline">
              Status Stripe: {subscriptionStatus ?? "SEM ASSINATURA"}
            </Badge>
            <Badge variant={billingBypassEnabled ? "secondary" : "outline"}>
              {billingBypassEnabled
                ? "Bypass manual habilitado"
                : "Bypass manual desabilitado"}
            </Badge>
          </div>
        </div>

        {billingBypassEnabled ? (
          <p className="text-xs text-muted-foreground">
            Última alteração em {formatDateTime(billingBypassUpdatedAt)}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={`billing-bypass-reason-${tenantId}`} className="text-sm font-medium">
          Observação interna
        </label>
        <Textarea
          id={`billing-bypass-reason-${tenantId}`}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ex.: Teste de fogo / clínica da família"
          disabled={isPending}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Essa observação aparece apenas no painel interno da Receps.
        </p>
      </div>

      {billingBypassEnabled ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          Este tenant está liberado manualmente para usar o ERP mesmo sem assinatura válida.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isPending}
        >
          {isPending
            ? "Salvando..."
            : billingBypassEnabled
              ? "Salvar liberação manual"
              : "Habilitar acesso sem assinatura"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit(false)}
          disabled={isPending || !billingBypassEnabled}
        >
          Remover liberação manual
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
