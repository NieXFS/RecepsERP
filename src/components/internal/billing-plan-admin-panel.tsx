"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  saveBillingPlanAction,
  toggleBillingPlanActiveAction,
  toggleBillingPlanFeaturedAction,
} from "@/actions/billing-admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  currency: string;
  trialDays: number;
  maxUsers: number | null;
  maxAppointmentsMonth: number | null;
  features: unknown;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

type BillingPlanAdminPanelProps = {
  plans: AdminPlan[];
};

type PlanFormState = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: string;
  currency: string;
  trialDays: string;
  maxUsers: string;
  maxAppointmentsMonth: string;
  featuresText: string;
  stripeProductId: string;
  stripePriceId: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: string;
};

function buildPlanFormState(plan?: AdminPlan): PlanFormState {
  return {
    id: plan?.id,
    slug: plan?.slug ?? "",
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    priceMonthly: plan ? String(plan.priceMonthly) : "",
    currency: plan?.currency ?? "brl",
    trialDays: plan ? String(plan.trialDays) : "7",
    maxUsers: plan?.maxUsers ? String(plan.maxUsers) : "",
    maxAppointmentsMonth: plan?.maxAppointmentsMonth
      ? String(plan.maxAppointmentsMonth)
      : "",
    featuresText: JSON.stringify(plan?.features ?? [], null, 2),
    stripeProductId: plan?.stripeProductId ?? "",
    stripePriceId: plan?.stripePriceId ?? "",
    isActive: plan?.isActive ?? true,
    isFeatured: plan?.isFeatured ?? false,
    sortOrder: plan ? String(plan.sortOrder) : "0",
  };
}

export function BillingPlanAdminPanel({ plans }: BillingPlanAdminPanelProps) {
  return (
    <div className="space-y-6">
      <PlanEditor title="Novo plano" description="Crie um plano placeholder ou conecte IDs reais da Stripe depois." />

      {plans.map((plan) => (
        <PlanEditor
          key={plan.id}
          plan={plan}
          title={plan.name}
          description="Edite preço, IDs da Stripe, destaque e ordenação."
        />
      ))}
    </div>
  );
}

function PlanEditor({
  plan,
  title,
  description,
}: {
  plan?: AdminPlan;
  title: string;
  description: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState(() => buildPlanFormState(plan));
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function setField<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await saveBillingPlanAction({
        id: form.id,
        slug: form.slug,
        name: form.name,
        description: form.description,
        priceMonthly: Number(form.priceMonthly || "0"),
        currency: form.currency,
        trialDays: Number(form.trialDays || "7"),
        maxUsers: form.maxUsers ? Number(form.maxUsers) : undefined,
        maxAppointmentsMonth: form.maxAppointmentsMonth
          ? Number(form.maxAppointmentsMonth)
          : undefined,
        featuresText: form.featuresText,
        stripeProductId: form.stripeProductId,
        stripePriceId: form.stripePriceId,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        sortOrder: Number(form.sortOrder || "0"),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(form.id ? "Plano atualizado." : "Plano criado.");
      router.refresh();
    });
  }

  function handleToggleActive() {
    if (!plan?.id) {
      return;
    }

    startTransition(async () => {
      const result = await toggleBillingPlanActiveAction(plan.id);

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(plan.isActive ? "Plano desativado." : "Plano ativado.");
      router.refresh();
    });
  }

  function handleToggleFeatured() {
    if (!plan?.id) {
      return;
    }

    startTransition(async () => {
      const result = await toggleBillingPlanFeaturedAction(plan.id);

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(plan.isFeatured ? "Plano removido do destaque." : "Plano marcado como destaque.");
      router.refresh();
    });
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Slug">
              <Input
                value={form.slug}
                onChange={(event) => setField("slug", event.target.value)}
                placeholder="erp-plus-ia"
                required
              />
            </Field>

            <Field label="Nome">
              <Input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="ERP + Atendente IA"
                required
              />
            </Field>

            <Field label="Preço mensal">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.priceMonthly}
                onChange={(event) => setField("priceMonthly", event.target.value)}
                required
              />
            </Field>

            <Field label="Moeda">
              <Input
                value={form.currency}
                onChange={(event) => setField("currency", event.target.value)}
                placeholder="brl"
                required
              />
            </Field>

            <Field label="Trial (dias)">
              <Input
                type="number"
                min="0"
                value={form.trialDays}
                onChange={(event) => setField("trialDays", event.target.value)}
                required
              />
            </Field>

            <Field label="Máx. usuários">
              <Input
                type="number"
                min="1"
                value={form.maxUsers}
                onChange={(event) => setField("maxUsers", event.target.value)}
                placeholder="Opcional"
              />
            </Field>

            <Field label="Máx. agendamentos/mês">
              <Input
                type="number"
                min="1"
                value={form.maxAppointmentsMonth}
                onChange={(event) => setField("maxAppointmentsMonth", event.target.value)}
                placeholder="Opcional"
              />
            </Field>

            <Field label="Ordenação">
              <Input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(event) => setField("sortOrder", event.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Stripe Product ID">
              <Input
                value={form.stripeProductId}
                onChange={(event) => setField("stripeProductId", event.target.value)}
                placeholder="prod_..."
              />
            </Field>

            <Field label="Stripe Price ID">
              <Input
                value={form.stripePriceId}
                onChange={(event) => setField("stripePriceId", event.target.value)}
                placeholder="price_..."
              />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={2}
              placeholder="Resumo curto do plano"
            />
          </Field>

          <Field label="Features (JSON)">
            <Textarea
              value={form.featuresText}
              onChange={(event) => setField("featuresText", event.target.value)}
              rows={6}
              placeholder='["Agenda", "CRM", "Financeiro"]'
              required
            />
          </Field>

          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setField("isActive", event.target.checked)}
              />
              Ativo
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setField("isFeatured", event.target.checked)}
              />
              Destaque
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Criar plano"}
            </Button>

            {plan?.id ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleToggleActive}
                >
                  {plan.isActive ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleToggleFeatured}
                >
                  {plan.isFeatured ? "Remover destaque" : "Marcar destaque"}
                </Button>
              </>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
