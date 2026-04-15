"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="rounded-[1.5rem] border border-border/70 bg-background p-8 shadow-xl shadow-primary/10">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Entrar no app Receps ERP</h1>
        <p className="text-sm text-muted-foreground">
          Use o email e a senha da sua clínica para continuar no Receps.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Ainda não tem conta?{" "}
          <Link href="/assinar" className="font-medium text-primary hover:underline">
            Ver planos e criar conta
          </Link>
        </p>
        <p>
          Recebeu um link de ativação? Ele será aberto em{" "}
          <span className="font-medium text-foreground">/convite/[token]</span>.
        </p>
      </div>
    </div>
  );
}
