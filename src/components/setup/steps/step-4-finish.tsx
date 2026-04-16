"use client";

import Link from "next/link";
import { Calendar, MessageCircle, Users, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Último passo do wizard. Não tem formulário — só celebra a conclusão,
 * mostra os próximos passos óbvios (dependem do plano) e dispara
 * `completeSetupAction` quando o usuário confirma.
 */
export function StepFinish({
  hasWhatsAppProduct,
  onBack,
  onComplete,
  isCompleting,
}: {
  hasWhatsAppProduct: boolean;
  onBack: () => void;
  onComplete: () => void;
  isCompleting: boolean;
}) {
  const nextSteps = [
    {
      icon: Calendar,
      title: "Crie seu primeiro agendamento",
      description: "Vá na Agenda e marque um horário de teste pra ver tudo funcionando.",
      href: "/agenda",
    },
    {
      icon: Users,
      title: "Cadastre um cliente",
      description: "Adicione pelo menos 1 cliente pra testar o fluxo completo.",
      href: "/clientes",
    },
    hasWhatsAppProduct
      ? {
          icon: MessageCircle,
          title: "Configure a Ana (WhatsApp)",
          description: "Conecte seu número e teste uma conversa com sua atendente de IA.",
          href: "/configuracoes/bot",
        }
      : {
          icon: Sparkles,
          title: "Personalize a aparência",
          description: "Escolha o tema e as cores que combinam com sua marca.",
          href: "/configuracoes/aparencia",
        },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 sm:mx-0">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold">Configuração básica pronta!</h2>
        <p className="text-sm text-muted-foreground">
          Você tem o essencial pra começar a usar o Receps. Aqui vão os próximos passos recomendados — nenhum deles é obrigatório agora.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {nextSteps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className="group flex flex-col gap-2 rounded-lg border bg-background p-4 transition-all hover:border-primary/60 hover:shadow-sm"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isCompleting}>
          Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onComplete}
          disabled={isCompleting}
        >
          {isCompleting ? "Finalizando..." : "Ir pro dashboard"}
        </Button>
      </div>
    </div>
  );
}
