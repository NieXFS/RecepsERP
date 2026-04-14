"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type OnboardingStatusCardProps = {
  mode: "waiting" | "success";
  trialEndsAt?: string | null;
};

export function OnboardingStatusCard({
  mode,
  trialEndsAt,
}: OnboardingStatusCardProps) {
  const router = useRouter();

  useEffect(() => {
    if (mode === "success") {
      const timeout = window.setTimeout(() => {
        router.push("/dashboard");
      }, 1800);

      return () => window.clearTimeout(timeout);
    }

    const interval = window.setInterval(() => {
      router.refresh();
    }, 2000);

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 10000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
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

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background p-8 shadow-xl shadow-primary/10">
      <h1 className="text-2xl font-semibold">Finalizando sua assinatura</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Estamos aguardando a sincronização do Stripe com o ERP. Isso costuma levar só alguns
        segundos.
      </p>
    </div>
  );
}
