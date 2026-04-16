"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { signupAction } from "@/actions/signup.actions";
import {
  SignupMobileFooter,
  type SignupPlan,
} from "@/components/auth/signup-payoff-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCnpj, isValidCnpj } from "@/lib/cnpj";
import { formatBrazilPhone, isValidBrazilPhone } from "@/lib/phone";
import { getReferralCookie, setReferralCookie } from "@/lib/referral-cookie";
import { trackEvent } from "@/lib/analytics/events";

type SignupFormProps = {
  plan: SignupPlan;
  referralCode?: string;
  referralTenantName?: string | null;
};

type AsyncFieldStatus =
  | { state: "idle"; message: string }
  | { state: "checking"; message: string }
  | { state: "available"; message: string }
  | { state: "taken"; message: string }
  | { state: "invalid"; message: string };

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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
      tone: "text-amber-600",
      barClassName: "bg-amber-500",
      widthClassName: "w-1/3",
    };
  }

  if (score <= 3) {
    return {
      label: "Média",
      tone: "text-sky-600",
      barClassName: "bg-sky-500",
      widthClassName: "w-2/3",
    };
  }

  return {
    label: "Forte",
    tone: "text-emerald-600",
    barClassName: "bg-emerald-500",
    widthClassName: "w-full",
  };
}

function getFieldHintClass(state: AsyncFieldStatus["state"]) {
  if (state === "available") return "text-emerald-600";
  if (state === "checking") return "text-sky-600";
  if (state === "taken" || state === "invalid") return "text-destructive";
  return "text-muted-foreground";
}

export function SignupForm({
  plan,
  referralCode,
  referralTenantName,
}: SignupFormProps) {
  const [businessName, setBusinessName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<AsyncFieldStatus>({
    state: "idle",
    message: "",
  });
  const [cnpjStatus, setCnpjStatus] = useState<AsyncFieldStatus>({
    state: "idle",
    message: "Precisamos do CNPJ pra emitir notas e ativar recursos fiscais. Fica entre nós.",
  });
  const [isPending, startTransition] = useTransition();
  const signupStartedTrackedRef = useRef(false);

  useEffect(() => {
    if (referralCode) {
      setReferralCookie(referralCode);
    }
  }, [referralCode]);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const emailValue = email.trim().toLowerCase();
  const cnpjValue = cnpj.trim();
  const businessNameValue = businessName.trim();
  const ownerNameValue = ownerName.trim();
  const phoneValue = phone.trim();
  const passwordValue = password;

  useEffect(() => {
    if (!emailValue) {
      setEmailStatus({
        state: "idle",
        message: "",
      });
      return;
    }

    if (!isValidEmail(emailValue)) {
      setEmailStatus({
        state: "invalid",
        message: "Informe um email válido.",
      });
      return;
    }

    setEmailStatus({
      state: "checking",
      message: "Verificando disponibilidade...",
    });

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/check-email?email=${encodeURIComponent(emailValue)}`
        );
        const data = (await response.json()) as { exists?: boolean; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível validar o email.");
        }

        setEmailStatus(
          data.exists
            ? {
                state: "taken",
                message: "Já existe uma conta com esse email.",
              }
            : {
                state: "available",
                message: "Email disponível para cadastro.",
              }
        );
      } catch (nextError) {
        setEmailStatus({
          state: "invalid",
          message:
            nextError instanceof Error
              ? nextError.message
              : "Não foi possível validar o email.",
        });
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [emailValue]);

  useEffect(() => {
    if (!cnpjValue) {
      setCnpjStatus({
        state: "idle",
        message: "Precisamos do CNPJ pra emitir notas e ativar recursos fiscais. Fica entre nós.",
      });
      return;
    }

    if (!isValidCnpj(cnpjValue)) {
      setCnpjStatus({
        state: "invalid",
        message: "Informe um CNPJ válido.",
      });
      return;
    }

    setCnpjStatus({
      state: "checking",
      message: "Verificando disponibilidade...",
    });

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/check-cnpj?cnpj=${encodeURIComponent(cnpjValue)}`
        );
        const data = (await response.json()) as { exists?: boolean; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível validar o CNPJ.");
        }

        setCnpjStatus(
          data.exists
            ? {
                state: "taken",
                message: "Esse CNPJ já tem conta no Receps.",
              }
            : {
                state: "available",
                message: "CNPJ válido e disponível.",
              }
        );
      } catch (nextError) {
        setCnpjStatus({
          state: "invalid",
          message:
            nextError instanceof Error
              ? nextError.message
              : "Não foi possível validar o CNPJ.",
        });
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [cnpjValue]);

  const businessNameError =
    businessNameValue && businessNameValue.length < 3
      ? "Informe o nome do negócio com pelo menos 3 caracteres."
      : "";
  const ownerNameError =
    ownerNameValue && ownerNameValue.length < 2
      ? "Informe seu nome completo ou pelo menos 2 caracteres."
      : "";
  const phoneError =
    phoneValue && !isValidBrazilPhone(phoneValue)
      ? "Informe um telefone brasileiro válido."
      : "";
  const passwordError =
    passwordValue && passwordValue.length < 8
      ? "A senha precisa ter no mínimo 8 caracteres."
      : "";

  const isFormInvalid =
    !businessNameValue ||
    !ownerNameValue ||
    !emailValue ||
    !phoneValue ||
    !passwordValue ||
    !cnpjValue ||
    Boolean(businessNameError) ||
    Boolean(ownerNameError) ||
    Boolean(phoneError) ||
    Boolean(passwordError) ||
    emailStatus.state === "taken" ||
    emailStatus.state === "invalid" ||
    emailStatus.state === "checking" ||
    cnpjStatus.state === "taken" ||
    cnpjStatus.state === "invalid" ||
    cnpjStatus.state === "checking";

  const referralBannerLabel = referralTenantName
    ? `Você ganhou 15% de desconto no primeiro mês no convite de ${referralTenantName}.`
    : referralCode
      ? `Você ganhou 15% de desconto no primeiro mês com o código ${referralCode}.`
      : null;

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

    if (!acceptLegal) {
      setError("Você precisa aceitar os termos.");
      return;
    }

    startTransition(async () => {
      const result = await signupAction({
        businessName,
        cnpj,
        ownerName,
        email,
        phone,
        password,
        planSlug: plan.slug,
        acceptLegal,
        referralCode: referralCode ?? getReferralCookie() ?? undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      trackEvent("signup_completed");
      window.location.href = result.redirectUrl;
    });
  }

  function trackSignupStartedOnce() {
    if (signupStartedTrackedRef.current) {
      return;
    }

    signupStartedTrackedRef.current = true;
    trackEvent("signup_started");
  }

  return (
    <Card className="w-full border-border/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)]">
      <CardContent className="space-y-8 p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <Link href="/" className="hidden items-center gap-3 lg:inline-flex">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-none">Receps</p>
            </div>
          </Link>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Criar sua conta</h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              <span className="font-semibold text-foreground">{plan.name}</span> —{" "}
              {formatCurrency(plan.priceMonthly, plan.currency)}/mês após {plan.trialDays} dias
              de trial grátis
            </p>
          </div>

          {referralBannerLabel ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-900">
              🎁 {referralBannerLabel}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-sm font-semibold">
              Nome do negócio
            </Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(event) => {
                trackSignupStartedOnce();
                setBusinessName(event.target.value);
              }}
              placeholder="Ex: Studio Bella"
              minLength={3}
              required
              disabled={isPending}
              className="h-12 rounded-xl border-border/80"
              aria-invalid={Boolean(businessNameError)}
            />
            {businessNameError ? (
              <FieldMessage message={businessNameError} toneClassName="text-destructive" />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="text-sm font-semibold">
              CNPJ
            </Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(event) => {
                trackSignupStartedOnce();
                setCnpj(formatCnpj(event.target.value));
              }}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
              required
              disabled={isPending}
              className="h-12 rounded-xl border-border/80"
              aria-invalid={cnpjStatus.state === "taken" || cnpjStatus.state === "invalid"}
            />
            <FieldMessage
              message={cnpjStatus.message}
              toneClassName={getFieldHintClass(cnpjStatus.state)}
              showSuccessIcon={cnpjStatus.state === "available"}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-sm font-semibold">
                Seu nome
              </Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(event) => {
                  trackSignupStartedOnce();
                  setOwnerName(event.target.value);
                }}
                placeholder="Ex: Fernanda Souza"
                minLength={2}
                required
                disabled={isPending}
                className="h-12 rounded-xl border-border/80"
                aria-invalid={Boolean(ownerNameError)}
              />
              {ownerNameError ? (
                <FieldMessage message={ownerNameError} toneClassName="text-destructive" />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  trackSignupStartedOnce();
                  setEmail(event.target.value);
                }}
                placeholder="voce@seunegocio.com.br"
                required
                disabled={isPending}
                className="h-12 rounded-xl border-border/80"
                aria-invalid={emailStatus.state === "taken" || emailStatus.state === "invalid"}
              />
              {emailStatus.state !== "idle" ? (
                <FieldMessage
                  message={emailStatus.message}
                  toneClassName={getFieldHintClass(emailStatus.state)}
                  showSuccessIcon={emailStatus.state === "available"}
                />
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold">
                Telefone / WhatsApp
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  trackSignupStartedOnce();
                  setPhone(formatBrazilPhone(event.target.value));
                }}
                placeholder="(11) 99999-9999"
                required
                disabled={isPending}
                className="h-12 rounded-xl border-border/80"
                aria-invalid={Boolean(phoneError)}
              />
              {phoneError ? (
                <FieldMessage message={phoneError} toneClassName="text-destructive" />
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Senha
                </Label>
                <span className={`text-xs font-medium ${passwordStrength.tone}`}>
                  {password ? `Força: ${passwordStrength.label}` : "Mínimo 8 caracteres"}
                </span>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  trackSignupStartedOnce();
                  setPassword(event.target.value);
                }}
                placeholder="No mínimo 8 caracteres"
                minLength={8}
                required
                disabled={isPending}
                className="h-12 rounded-xl border-border/80"
                aria-invalid={Boolean(passwordError)}
              />
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${password ? passwordStrength.barClassName : "bg-muted-foreground/30"} ${password ? passwordStrength.widthClassName : "w-1/4"}`}
                />
              </div>
              {passwordError ? (
                <FieldMessage message={passwordError} toneClassName="text-destructive" />
              ) : null}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <input
              type="checkbox"
              checked={acceptLegal}
              onChange={(event) => setAcceptLegal(event.target.checked)}
              disabled={isPending}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <span className="text-sm leading-6 text-muted-foreground">
              Li e aceito os{" "}
              <Link
                href="/termos"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full rounded-xl bg-violet-500 text-base font-semibold shadow-[0_18px_40px_rgba(139,92,246,0.24)] hover:bg-violet-600"
            disabled={isPending || isFormInvalid}
          >
            {isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Criando sua conta...
              </>
            ) : (
              <>
                Criar conta e começar trial grátis
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <SignupMobileFooter plan={plan} />

          <p className="hidden text-center text-sm text-muted-foreground lg:block">
            Sem cartão de crédito • {plan.trialDays} dias grátis • Cancele quando quiser
          </p>

          <p className="text-center text-xs leading-6 text-muted-foreground">
            Ao criar sua conta você concorda com os{" "}
            <Link href="/termos" className="font-medium text-foreground hover:underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="font-medium text-foreground hover:underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href={loginHref} className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldMessage({
  message,
  toneClassName = "text-muted-foreground",
  showSuccessIcon = false,
}: {
  message: string;
  toneClassName?: string;
  showSuccessIcon?: boolean;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className={`flex items-start gap-1.5 text-xs leading-5 ${toneClassName}`}>
      {showSuccessIcon ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : toneClassName === "text-destructive" ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : null}
      <span>{message}</span>
    </p>
  );
}
