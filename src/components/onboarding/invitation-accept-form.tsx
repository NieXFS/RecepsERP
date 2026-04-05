"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acceptTenantInvitationAction } from "@/actions/onboarding.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type InvitationAcceptFormProps = {
  token: string;
  email: string;
};

/**
 * Formulário público de ativação do tenant por convite.
 * O usuário define a senha e conclui a criação operacional do ambiente.
 */
export function InvitationAcceptForm({
  token,
  email,
}: InvitationAcceptFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    startTransition(async () => {
      const result = await acceptTenantInvitationAction({ token, password });

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success("Conta ativada com sucesso. Faça login para continuar.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email do convite
        </label>
        <Input id="email" value={email} disabled />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Defina sua senha
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar senha
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a senha"
          required
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Ativando..." : "Ativar conta"}
      </Button>
    </form>
  );
}
