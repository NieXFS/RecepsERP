"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
  MailCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RequestResetFormProps = {
  initialEmail?: string;
};

export function RequestResetForm({ initialEmail = "" }: RequestResetFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "Não foi possível enviar o link agora.");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Falha de conexão. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-in-up rounded-[2rem] border border-border/60 bg-background/80 p-8 text-center shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <MailCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Link enviado!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Se existir uma conta com esse email, você vai receber um link em até 1 minuto.
          Verifique sua caixa de entrada e a pasta de spam.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Voltar para login
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up rounded-[2rem] border border-border/60 bg-background/80 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
      <Link
        href="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Voltar para login
      </Link>

      <div className="mb-7 space-y-3">
        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span
            aria-hidden="true"
            className="animate-glow-breathe inline-block h-1.5 w-1.5 rounded-full bg-primary"
          />
          Recuperação
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Esqueceu sua senha?
        </h1>
        <p className="text-sm text-muted-foreground">
          Vamos te enviar um link para criar uma nova.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
              className="h-12 rounded-xl pl-10 text-sm"
              autoComplete="email"
            />
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="animate-fade-in-up flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="group h-12 w-full rounded-xl text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          {loading ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <span>Enviar link de recuperação</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
