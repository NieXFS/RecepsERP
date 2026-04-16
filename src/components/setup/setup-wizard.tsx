"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { TenantBusinessSegment } from "@/generated/prisma/enums";
import { completeSetupAction, skipSetupAction } from "@/actions/setup.actions";
import { cn } from "@/lib/utils";

import { StepSegmentAndServices } from "./steps/step-1-segment-services";
import { StepProfessional } from "./steps/step-2-professional";
import { StepBusinessHours } from "./steps/step-3-business-hours";
import { StepFinish } from "./steps/step-4-finish";

export type SetupWizardInitialState = {
  tenantName: string;
  userName: string;
  segment: TenantBusinessSegment | null;
  hasServices: boolean;
  professional: {
    specialty: string;
    registrationNumber: string;
    commissionPercent: number;
  } | null;
  businessHours: {
    openingTime: string;
    closingTime: string;
    slotIntervalMinutes: number;
  };
  hasWhatsAppProduct: boolean;
  planSlug: string | null;
};

const STEP_LABELS = [
  "Serviços",
  "Profissional",
  "Horário",
  "Tudo pronto",
] as const;

type StepIndex = 0 | 1 | 2 | 3;

/**
 * Wizard de setup inicial. Mantém o estado de passo no client e
 * roteia cada submit pra sua server action correspondente.
 * A decisão de qual passo retomar vem do `initialState`.
 */
export function SetupWizard({ initialState }: { initialState: SetupWizardInitialState }) {
  const router = useRouter();
  const [isPendingSkip, startSkipTransition] = useTransition();
  const [isPendingComplete, startCompleteTransition] = useTransition();

  // Ponto de partida: primeiro passo cujo sinal ainda não está satisfeito.
  const initialStep = useMemo<StepIndex>(() => {
    if (!initialState.segment || !initialState.hasServices) return 0;
    if (!initialState.professional) return 1;
    return 2;
  }, [initialState]);

  const [currentStep, setCurrentStep] = useState<StepIndex>(initialStep);

  const totalSteps = STEP_LABELS.length;
  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  const goTo = (idx: StepIndex) => setCurrentStep(idx);
  const advance = () => setCurrentStep((prev) => Math.min(prev + 1, 3) as StepIndex);

  const handleSkip = () => {
    startSkipTransition(async () => {
      const result = await skipSetupAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Você pode terminar a configuração depois em Configurações.");
      router.push("/dashboard");
      router.refresh();
    });
  };

  const handleComplete = () => {
    startCompleteTransition(async () => {
      const result = await completeSetupAction();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Tudo pronto! Bem-vindo ao Receps 🎉");
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Olá, {initialState.userName.split(" ")[0]}! 👋
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Vamos preparar o {initialState.tenantName} pra receber clientes.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Leva uns 3 minutos. Você pode pular agora e configurar depois.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={isPendingSkip}
            className="shrink-0"
          >
            {isPendingSkip ? "Redirecionando..." : "Pular por enquanto"}
          </Button>
        </div>

        <div className="space-y-2">
          <Progress value={progressValue} className="h-2" />
          <ol
            className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-4"
            aria-label="Etapas do setup inicial"
          >
            {STEP_LABELS.map((label, idx) => {
              const state =
                idx < currentStep
                  ? "done"
                  : idx === currentStep
                    ? "current"
                    : "pending";
              return (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-2 transition-colors",
                    state === "done" && "text-foreground",
                    state === "current" && "font-semibold text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold",
                      state === "done" && "border-primary bg-primary text-primary-foreground",
                      state === "current" && "border-primary text-primary",
                      state === "pending" && "border-muted-foreground/30"
                    )}
                    aria-hidden
                  >
                    {state === "done" ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span>
                    {idx + 1}. {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </header>

      <section className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {currentStep === 0 && (
          <StepSegmentAndServices
            initialSegment={initialState.segment}
            onSaved={() => goTo(1)}
          />
        )}
        {currentStep === 1 && (
          <StepProfessional
            initialData={initialState.professional ?? undefined}
            defaultSpecialtyFromSegment={initialState.segment}
            onSaved={() => goTo(2)}
            onBack={() => goTo(0)}
          />
        )}
        {currentStep === 2 && (
          <StepBusinessHours
            initialData={initialState.businessHours}
            onSaved={() => goTo(3)}
            onBack={() => goTo(1)}
          />
        )}
        {currentStep === 3 && (
          <StepFinish
            hasWhatsAppProduct={initialState.hasWhatsAppProduct}
            onBack={() => goTo(2)}
            onComplete={handleComplete}
            isCompleting={isPendingComplete}
          />
        )}
      </section>

      <footer className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span>As informações são salvas a cada passo. Você pode voltar quando quiser.</span>
      </footer>
    </div>
  );
}
