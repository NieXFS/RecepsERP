"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { getReferralCookie, setReferralCookie } from "@/lib/referral-cookie";
import { Button } from "@/components/ui/button";

type SignupAutostartProps = {
  planId: string;
  planSlug: string;
  planName: string;
  referralCode?: string;
};

export function SignupAutostart({
  planId,
  planSlug,
  planName,
  referralCode,
}: SignupAutostartProps) {
  const startedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    if (referralCode) {
      setReferralCookie(referralCode);
    }

    const resolvedReferralCode = referralCode ?? getReferralCookie() ?? undefined;

    async function startTrial() {
      try {
        const response = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId,
            referralCode: resolvedReferralCode,
          }),
        });

        const data = (await response.json()) as { url?: string; error?: string };

        if (!response.ok || !data.url) {
          throw new Error(data.error || "Não foi possível iniciar seu trial agora.");
        }

        window.location.href = data.url;
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Não foi possível iniciar seu trial agora."
        );
      }
    }

    void startTrial();
  }, [planId, referralCode]);

  return (
    <div className="rounded-[2rem] border border-border/70 bg-background p-8 shadow-2xl shadow-primary/10">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight">
          Preparando seu acesso ao plano {planName}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Como você já está logado, vamos pular o formulário e começar seu trial direto no
          plano selecionado.
        </p>

        {error ? (
          <div className="mt-6 w-full max-w-xl rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {error ? (
            <>
              <Button render={<Link href={`/cadastro?plan=${planSlug}`} />} size="lg">
                Tentar novamente
              </Button>
              <Button render={<Link href="/configuracoes/assinatura" />} size="lg" variant="outline">
                Ir para assinatura
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
