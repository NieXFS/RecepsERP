"use client";

import { Sparkles } from "lucide-react";
import { AnaAvatar } from "./ana-avatar";
import { AnaReadinessScore } from "./ana-readiness-score";
import { Badge } from "@/components/ui/badge";
import type { AnaReadinessResult } from "./ana-readiness";

export function AnaHero({
  botName,
  whatsappConnected,
  readiness,
}: {
  botName: string;
  whatsappConnected: boolean;
  readiness: AnaReadinessResult;
}) {
  const displayName = botName.trim() || "Ana";

  return (
    <section
      aria-label="Apresentação da atendente Ana"
      className="animate-fade-in-down relative isolate overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8 lg:p-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 hidden xl:block"
      >
        <span className="animate-aurora-pan absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-primary/25 blur-3xl" />
        <span className="absolute -bottom-32 left-1/3 h-[260px] w-[260px] rounded-full bg-primary/15 blur-3xl" />
        <span className="animate-twinkle absolute left-[18%] top-[22%] h-1 w-1 rounded-full bg-primary/70" />
        <span
          className="animate-twinkle absolute right-[32%] top-[68%] h-1 w-1 rounded-full bg-primary/60"
          style={{ animationDelay: "1.2s" }}
        />
        <span
          className="animate-twinkle absolute left-[48%] top-[14%] h-[3px] w-[3px] rounded-full bg-primary/80"
          style={{ animationDelay: "2.4s" }}
        />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,1fr)] lg:items-center">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-6">
          <AnaAvatar isActive={whatsappConnected} size="lg" />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/10 text-primary"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Atendente virtual
              </Badge>
              {whatsappConnected ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300">
                  <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Online
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300">
                  Aguardando ativação
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              Olá, eu sou a{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {displayName}.
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Sua atendente virtual pro WhatsApp. Configure abaixo como quero me
              apresentar, o que responder e em que horários posso atender seus clientes.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/15 bg-card/70 p-5 backdrop-blur-sm">
          <AnaReadinessScore readiness={readiness} />
        </div>
      </div>
    </section>
  );
}
