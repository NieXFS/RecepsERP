"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, Lock } from "lucide-react";
import type { TenantModule } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ModuleUpsellContent = {
  title: string;
  description: string;
  benefits: string[];
  requiredPlan: "ERP" | "Atendente IA";
};

const MODULE_UPSELL_CONTENT: Partial<Record<TenantModule, ModuleUpsellContent>> = {
  AGENDA: {
    title: "Desbloqueie a Agenda",
    description: "Organize todos os atendimentos do seu negócio num lugar só.",
    benefits: [
      "Visualize o dia inteiro numa tela",
      "Sem conflito de horário, sem overbooking",
      "Arraste pra remarcar em segundos",
    ],
    requiredPlan: "ERP",
  },
  CLIENTES: {
    title: "Desbloqueie o Cadastro de Clientes",
    description: "Tenha o histórico completo de cada cliente na palma da mão.",
    benefits: [
      "Histórico de serviços e atendimentos",
      "Dados de contato organizados",
      "Saiba o que cada cliente gosta e prefere",
    ],
    requiredPlan: "ERP",
  },
  PROFISSIONAIS: {
    title: "Desbloqueie a Gestão de Equipe",
    description: "Gerencie sua equipe e comissões sem planilha.",
    benefits: [
      "Cadastro de profissionais com agenda individual",
      "Comissões calculadas automaticamente",
      "Controle de disponibilidade e folgas",
    ],
    requiredPlan: "ERP",
  },
  SERVICOS: {
    title: "Desbloqueie os Serviços",
    description: "Cadastre todos os serviços do seu negócio com preço e duração.",
    benefits: [
      "Catálogo completo com preço e tempo",
      "Vincule serviços a profissionais específicos",
      "Relatórios por serviço mais vendido",
    ],
    requiredPlan: "ERP",
  },
  PACOTES: {
    title: "Desbloqueie os Pacotes",
    description: "Crie combos de serviços com desconto pra fidelizar clientes.",
    benefits: [
      "Pacotes com preço especial",
      "Controle de sessões usadas e restantes",
      "Aumenta o ticket médio",
    ],
    requiredPlan: "ERP",
  },
  PRODUTOS: {
    title: "Desbloqueie o Estoque",
    description: "Controle o estoque de produtos do seu negócio.",
    benefits: [
      "Entrada e saída de produtos",
      "Alerta quando tá acabando",
      "Saída automática vinculada ao serviço",
    ],
    requiredPlan: "ERP",
  },
  COMISSOES: {
    title: "Desbloqueie o Financeiro",
    description:
      "Saiba exatamente quanto entra e quanto sai sem surpresa no fim do mês.",
    benefits: [
      "Fechamento de caixa em 1 clique",
      "Fluxo de caixa diário e mensal",
      "Relatórios que mostram onde o dinheiro vai",
    ],
    requiredPlan: "ERP",
  },
  PRONTUARIOS: {
    title: "Desbloqueie os Prontuários",
    description: "Registre o histórico clínico dos seus clientes com segurança.",
    benefits: [
      "Prontuários individuais por cliente",
      "Fotos de antes e depois",
      "Histórico completo de procedimentos",
    ],
    requiredPlan: "ERP",
  },
  ATENDENTE_IA: {
    title: "Desbloqueie a Atendente IA",
    description:
      "A Ana cuida do seu WhatsApp 24h, agenda clientes automaticamente e nunca perde uma mensagem.",
    benefits: [
      "Responde no WhatsApp em segundos, 24/7",
      "Marca consulta direto na sua agenda",
      "Aprende o tom do seu negócio",
    ],
    requiredPlan: "Atendente IA",
  },
};

export function getModuleUpsellTooltip(module: TenantModule): string | null {
  const content = MODULE_UPSELL_CONTENT[module];
  return content ? `Disponível no plano ${content.requiredPlan}` : null;
}

export function ModuleUpsellDialog({
  module,
  icon: Icon,
  open,
  onOpenChange,
}: {
  module: TenantModule;
  icon: LucideIcon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const content = MODULE_UPSELL_CONTENT[module];

  if (!content) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              {content.requiredPlan}
            </div>
          </div>

          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {content.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {content.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {content.benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <p className="text-sm text-foreground/90">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="sm:flex-col sm:items-stretch sm:justify-stretch">
          <Button
            render={<Link href="/configuracoes/assinatura" />}
            className="w-full"
            size="lg"
          >
            Ver planos
          </Button>
          <Button variant="outline" className="w-full" size="lg" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
