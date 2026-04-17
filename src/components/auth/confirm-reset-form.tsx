"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConfirmResetFormProps = {
  token: string;
};

export function ConfirmResetForm({ token }: ConfirmResetFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Mínimo de 8 caracteres.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, passwordConfirmation }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; email?: string; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        setError(data?.error ?? "Não foi possível redefinir sua senha.");
        setLoading(false);
        return;
      }

      setSuccessEmail(data.email ?? null);
    } catch {
      setError("Falha de conexão. Tente novamente em instantes.");
      setLoading(false);
    }
  }

  if (successEmail !== null) {
    return (
      <div className="animate-fade-in-up rounded-[2rem] border border-border/60 bg-background/80 p-8 text-center shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
        <div
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        >
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Senha atualizada!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Pronto. Agora é só entrar com a nova senha para continuar.
        </p>
        <button
          type="button"
          onClick={() => {
            const query = successEmail
              ? `?email=${encodeURIComponent(successEmail)}`
              : "";
            router.push(`/login${query}`);
          }}
          className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up rounded-[2rem] border border-border/60 bg-background/80 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
      <div className="mb-7 space-y-3">
        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span
            aria-hidden="true"
            className="animate-glow-breathe inline-block h-1.5 w-1.5 rounded-full bg-primary"
          />
          Nova senha
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Crie sua nova senha
        </h1>
        <p className="text-sm text-muted-foreground">
          Defina uma senha forte que você vai lembrar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Nova senha
          </label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-12 rounded-xl pl-10 pr-11 text-sm"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Mínimo 8 caracteres. Use letras, números e símbolos para mais segurança.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="passwordConfirmation"
            className="text-sm font-medium text-foreground"
          >
            Confirmar senha
          </label>
          <div className="relative">
            <Lock
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="passwordConfirmation"
              type={showConfirmation ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-12 rounded-xl pl-10 pr-11 text-sm"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((v) => !v)}
              aria-label={
                showConfirmation ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"
              }
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              {showConfirmation ? (
                <EyeOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Eye aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
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
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <span>Atualizar senha</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Lembrou da senha?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Voltar para login
        </Link>
      </p>
    </div>
  );
}
