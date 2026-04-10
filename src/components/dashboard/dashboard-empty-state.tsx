"use client";

import Link from "next/link";
import { Calendar, Scissors, UserCog } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Scissors,
    title: "Cadastre seus serviços",
    description: "Adicione os serviços que seu estabelecimento oferece, com valores e duração.",
    href: "/servicos",
    cta: "Ir para Serviços",
  },
  {
    icon: UserCog,
    title: "Adicione profissionais",
    description: "Cadastre os profissionais da equipe e vincule aos serviços.",
    href: "/profissionais",
    cta: "Ir para Profissionais",
  },
  {
    icon: Calendar,
    title: "Crie seu primeiro agendamento",
    description: "Agende um atendimento para começar a acompanhar seu faturamento.",
    href: "/agenda",
    cta: "Ir para Agenda",
  },
];

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold tracking-tight">Bem-vindo ao Receps!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu dashboard aparecerá aqui assim que você começar a registrar
          atendimentos. Siga os passos abaixo para configurar seu espaço.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <Card key={step.href} className="relative overflow-visible">
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                <Link
                  href={step.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-2 w-full"
                  )}
                >
                  {step.cta}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
