"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  initialEmail?: string;
  callbackUrl?: string;
};

/**
 * Formulário client-side de autenticação do ERP.
 * Recebe os parâmetros já resolvidos no servidor para evitar bailout no App Router.
 */
export function LoginForm({
  initialEmail = "",
  callbackUrl = "/dashboard",
}: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou senha inválidos.");
      setLoading(false);
      return;
    }

    router.push(result?.url ?? callbackUrl);
  }

  return (
    <div className="animate-fade-in-up rounded-[2rem] border border-border/60 bg-background/80 p-8 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10">
      <div className="mb-7 space-y-3">
        <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span
            aria-hidden="true"
            className="animate-glow-breathe inline-block h-1.5 w-1.5 rounded-full bg-primary"
          />
          Acesso
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-muted-foreground">
          Entre com o email da sua clínica para continuar.
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Senha
            </label>
            <Link
              href={
                email
                  ? `/recuperar-senha?email=${encodeURIComponent(email)}`
                  : "/recuperar-senha"
              }
              className="text-xs font-medium text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
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
              className="h-12 rounded-xl pl-10 pr-11 text-sm"
              autoComplete="current-password"
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
          className={cn(
            "group relative h-12 w-full rounded-xl text-base font-medium shadow-lg shadow-primary/20 transition-all",
            "hover:shadow-primary/30"
          )}
        >
          {loading ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span>Entrando...</span>
            </>
          ) : (
            <>
              <span>Entrar</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </Button>
      </form>

      <div className="relative my-7">
        <div aria-hidden="true" className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            ou
          </span>
        </div>
      </div>

      <Link
        href="/assinar"
        className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
      >
        <Sparkles
          aria-hidden="true"
          className="h-4 w-4 text-primary transition-transform group-hover:scale-110"
        />
        <span>Ver planos e criar conta</span>
      </Link>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        Recebeu um link de ativação? Ele será aberto em{" "}
        <span className="font-medium text-foreground">/convite/[token]</span>.
      </p>
    </div>
  );
}
