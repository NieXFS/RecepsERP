"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { updateBotConfigAction } from "@/actions/bot-config.actions";
import { Button } from "@/components/ui/button";
import type { BotSettingsRecord } from "@/services/bot-config.service";
import { AnaHero } from "./ana-hero";
import { AnaPersonalitySection } from "./ana-personality-section";
import { AnaMessagesSection } from "./ana-messages-section";
import { AnaHoursSection } from "./ana-hours-section";
import { AnaWhatsAppPreview } from "./ana-whatsapp-preview";
import { AnaStatusPanel } from "./ana-status-panel";
import { computeAnaReadiness } from "./ana-readiness";
import { cn } from "@/lib/utils";

type AnaFormState = {
  botName: string;
  greetingMessage: string;
  fallbackMessage: string;
  botIsAlwaysActive: boolean;
  botActiveStart: string;
  botActiveEnd: string;
  timezone: string;
};

function toFormState(settings: BotSettingsRecord): AnaFormState {
  return {
    botName: settings.botName,
    greetingMessage: settings.greetingMessage ?? "",
    fallbackMessage: settings.fallbackMessage ?? "",
    botIsAlwaysActive: settings.botIsAlwaysActive,
    botActiveStart: settings.botActiveStart,
    botActiveEnd: settings.botActiveEnd,
    timezone: settings.timezone,
  };
}

function shallowEqual(a: AnaFormState, b: AnaFormState) {
  return (
    a.botName === b.botName &&
    a.greetingMessage === b.greetingMessage &&
    a.fallbackMessage === b.fallbackMessage &&
    a.botIsAlwaysActive === b.botIsAlwaysActive &&
    a.botActiveStart === b.botActiveStart &&
    a.botActiveEnd === b.botActiveEnd &&
    a.timezone === b.timezone
  );
}

export function AnaStudio({ settings }: { settings: BotSettingsRecord }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [baseline, setBaseline] = useState<AnaFormState>(() => toFormState(settings));
  const [form, setForm] = useState<AnaFormState>(() => toFormState(settings));

  useEffect(() => {
    const next = toFormState(settings);
    setBaseline(next);
    setForm(next);
  }, [settings]);

  const whatsappConnected = Boolean(settings.phoneNumberId && settings.isActive);
  const dirty = !shallowEqual(form, baseline);

  const readiness = useMemo(
    () =>
      computeAnaReadiness({
        botName: form.botName,
        systemPrompt: settings.systemPrompt,
        greetingMessage: form.greetingMessage,
        fallbackMessage: form.fallbackMessage,
        botIsAlwaysActive: form.botIsAlwaysActive,
        botActiveStart: form.botActiveStart,
        botActiveEnd: form.botActiveEnd,
        whatsappConnected,
      }),
    [form, settings.systemPrompt, whatsappConnected]
  );

  const update = useCallback(<K extends keyof AnaFormState>(key: K, value: AnaFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  function handleReset() {
    setForm(baseline);
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateBotConfigAction(form);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Configurações da Ana salvas com sucesso.");
      setBaseline(form);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <AnaHero
        botName={form.botName}
        whatsappConnected={whatsappConnected}
        readiness={readiness}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,380px)]">
        <div className="flex flex-col gap-5">
          <AnaPersonalitySection
            botName={form.botName}
            systemPrompt={settings.systemPrompt}
            onBotNameChange={(value) => update("botName", value)}
            style={{ animation: "fade-in-up 0.4s cubic-bezier(0.2,0,0,1) both", animationDelay: "80ms" }}
          />

          <AnaMessagesSection
            greetingMessage={form.greetingMessage}
            fallbackMessage={form.fallbackMessage}
            onGreetingChange={(value) => update("greetingMessage", value)}
            onFallbackChange={(value) => update("fallbackMessage", value)}
            style={{ animation: "fade-in-up 0.4s cubic-bezier(0.2,0,0,1) both", animationDelay: "160ms" }}
          />

          <AnaHoursSection
            botIsAlwaysActive={form.botIsAlwaysActive}
            botActiveStart={form.botActiveStart}
            botActiveEnd={form.botActiveEnd}
            timezone={form.timezone}
            onAlwaysActiveChange={(value) => update("botIsAlwaysActive", value)}
            onStartChange={(value) => update("botActiveStart", value)}
            onEndChange={(value) => update("botActiveEnd", value)}
            onTimezoneChange={(value) => update("timezone", value)}
            style={{ animation: "fade-in-up 0.4s cubic-bezier(0.2,0,0,1) both", animationDelay: "240ms" }}
          />

          <div
            className={cn(
              "sticky bottom-4 z-20 flex flex-col gap-2 rounded-2xl border bg-background/85 p-3 backdrop-blur-md transition-all sm:flex-row sm:items-center sm:justify-between",
              dirty
                ? "border-primary/40 shadow-[0_12px_40px_-16px_color-mix(in_oklab,var(--primary)_50%,transparent)]"
                : "border-border/60"
            )}
          >
            <div className="flex items-center gap-2 px-1 text-sm">
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  dirty ? "animate-pulse bg-primary" : "bg-emerald-500"
                )}
              />
              <span className={cn(dirty ? "text-foreground" : "text-muted-foreground")}>
                {dirty
                  ? "Você tem alterações não salvas."
                  : "Tudo salvo. A Ana está atualizada."}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleReset}
                disabled={!dirty || isPending}
                className="gap-1.5"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Descartar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!dirty || isPending}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
          <AnaWhatsAppPreview
            botName={form.botName}
            greetingMessage={form.greetingMessage}
            fallbackMessage={form.fallbackMessage}
            whatsappConnected={whatsappConnected}
          />
          <AnaStatusPanel
            whatsappConnected={whatsappConnected}
            phoneNumberId={settings.phoneNumberId}
          />
        </aside>
      </div>
    </div>
  );
}
