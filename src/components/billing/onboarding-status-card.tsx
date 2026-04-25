"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubscriptionStatusPoller } from "@/components/billing/subscription-status-poller";
import { Button } from "@/components/ui/button";

type OnboardingStatusCardProps = {
  mode: "waiting" | "success" | "failed";
  trialEndsAt?: string | null;
  message?: string | null;
};

export function OnboardingStatusCard({
  mode,
  trialEndsAt,
  message,
}: OnboardingStatusCardProps) {
  const router = useRouter();

  useEffect(() => {
    if (mode === "success") {
      const timeout = window.setTimeout(() => {
        router.push("/dashboard");
      }, 1800);

      return () => window.clearTimeout(timeout);
    }
  }, [mode, router]);

  if (mode === "success") {
    return (
      <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/5 p-8 shadow-xl shadow-emerald-500/10">
        <h1 className="text-2xl font-semibold">Assinatura ativa!</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {trialEndsAt
            ? `Seu trial vai até ${trialEndsAt}. Estamos te levando para o dashboard.`
            : "Seu acesso foi liberado. Estamos te levando para o dashboard."}
        </p>
      </div>
    );
  }

  if (mode === "failed") {
    return (
      <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/5 p-8 shadow-xl shadow-amber-500/10">
        <h1 className="text-2xl font-semibold">Não conseguimos confirmar seu pagamento</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message ?? "Tente novamente em instantes ou escolha outro plano para continuar."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button nativeButton={false} render={<Link href="/assinar" />}>
            Voltar para os planos
          </Button>
          <Button nativeButton={false} render={<Link href="/logout" />} variant="outline">
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background p-8 shadow-xl shadow-primary/10">
      <SubscriptionStatusPoller />
      <h1 className="text-2xl font-semibold">Finalizando sua assinatura</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {message ?? "Estamos confirmando o seu pagamento. Isso costuma levar só alguns segundos."}
      </p>
    </div>
  );
}
