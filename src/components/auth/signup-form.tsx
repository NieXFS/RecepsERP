"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { signupAndCreateCheckoutAction } from "@/actions/signup.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getReferralCookie, setReferralCookie } from "@/lib/referral-cookie";

type SignupFormProps = {
  plan: {
    slug: string;
    name: string;
    priceMonthly: number;
    currency: string;
    trialDays: number;
  };
  referralCode?: string;
  referralTenantName?: string | null;
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function getPasswordStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: "Fraca",
      className: "text-amber-600",
    };
  }

  if (score <= 3) {
    return {
      label: "Média",
      className: "text-sky-600",
    };
  }

  return {
    label: "Forte",
    className: "text-emerald-600",
  };
}

export function SignupForm({
  plan,
  referralCode,
  referralTenantName,
}: SignupFormProps) {
  const [clinicName, setClinicName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (referralCode) {
      setReferralCookie(referralCode);
    }
  }, [referralCode]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const loginHref = useMemo(() => {
    const params = new URLSearchParams({
      callbackUrl: `/cadastro?plan=${encodeURIComponent(plan.slug)}${
        referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ""
      }`,
    });

    return `/login?${params.toString()}`;
  }, [plan.slug, referralCode]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await signupAndCreateCheckoutAction({
        clinicName,
        ownerName,
        email,
        phone,
        password,
        planSlug: plan.slug,
        referralCode: referralCode ?? getReferralCookie() ?? undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.href = result.checkoutUrl;
    });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center px-6 py-12">
      <Card className="w-full max-w-2xl border-border/70 shadow-2xl shadow-primary/10">
        <CardContent className="space-y-8 p-8 md:p-10">
          <div className="space-y-6 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-none">Receps</p>
                <p className="text-xs text-muted-foreground">Self-service de assinatura</p>
              </div>
            </Link>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Criar sua conta
              </h1>
              <p className="text-sm leading-6 text-muted-foreground md:text-base">
                Plano: {plan.name} — {formatCurrency(plan.priceMonthly, plan.currency)}/mês
                {" "}com {plan.trialDays} dias grátis
              </p>
            </div>

            {referralCode && referralTenantName ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200">
                Você ganhou 15% de desconto indicado por{" "}
                <span className="font-semibold">{referralTenantName}</span>.
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="clinicName">Nome da clínica</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(event) => setClinicName(event.target.value)}
                  placeholder="Ex: Clínica Bella Estética"
                  minLength={3}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerName">Seu nome</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="Ex: Fernanda Souza"
                  minLength={2}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@clinica.com"
                  required
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password">Senha</Label>
                  <span className={`text-xs font-medium ${passwordStrength.className}`}>
                    Força: {passwordStrength.label}
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="No mínimo 8 caracteres"
                  minLength={8}
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? "Preparando pagamento..." : "Continuar para pagamento"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href={loginHref} className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
