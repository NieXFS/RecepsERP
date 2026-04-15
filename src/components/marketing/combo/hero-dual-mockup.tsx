"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { CountUpStat } from "@/components/marketing/count-up-stat";
import { cn } from "@/lib/utils";

const baseAppointments = [
  {
    time: "09:00",
    customer: "Mariana",
    service: "Limpeza de pele",
    accent: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    time: "11:00",
    customer: "Paulo",
    service: "Corte + barba",
    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    time: "13:30",
    customer: "Julia",
    service: "Design de sobrancelha",
    accent: "bg-sky-50 text-sky-700 border-sky-100",
  },
];

function useSequenceTrigger() {
  const ref = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = media.matches;
    setReduceMotion(prefersReducedMotion);

    if (prefersReducedMotion) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return {
    ref,
    hasStarted,
    reduceMotion,
    showAll: hasStarted || reduceMotion,
  };
}

export function HeroDualMockup() {
  const { ref, hasStarted, reduceMotion, showAll } = useSequenceTrigger();

  function stagedClass(delay: number, animation = "animate-fade-in-up") {
    if (reduceMotion) {
      return "";
    }

    return hasStarted ? animation : "opacity-0";
  }

  function stagedStyle(delay: number) {
    if (!hasStarted || reduceMotion) {
      return undefined;
    }

    return { animationDelay: `${delay}ms` };
  }

  return (
    <div ref={ref} className="relative mx-auto w-full min-w-0 max-w-[56rem] xl:max-w-none">
      <div className="absolute -left-2 top-3 hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 shadow-lg backdrop-blur xl:block">
        WhatsApp + ERP
      </div>
      <div className="absolute -right-2 top-3 hidden rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-lg backdrop-blur xl:block">
        Tudo sincronizado
      </div>

      <div className="grid gap-5 xl:grid-cols-2 xl:gap-6 xl:items-center relative">
        <div className="min-w-0 rounded-[2rem] border border-white/12 bg-white/7 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center justify-between rounded-[1.2rem] bg-white/8 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/18 text-emerald-200">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-white">Ana • Receps IA</p>
                  <p className="text-sm text-white/60">Atendendo no seu WhatsApp</p>
                </div>
              </div>
              <div className="rounded-full bg-emerald-400 px-2.5 py-1 text-xs font-semibold text-[#0B0B1A]">
                online
              </div>
            </div>

            <div className="space-y-3 rounded-[1.45rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)] p-4">
              <MessageBubble
                align="left"
                className={stagedClass(0)}
                style={stagedStyle(0)}
                tone="light"
              >
                Oi, tem horário amanhã à tarde?
              </MessageBubble>

              <MessageBubble
                align="right"
                className={stagedClass(220)}
                style={stagedStyle(220)}
                tone="success"
              >
                Tenho 15h30 e 17h. Qual fica melhor para você?
              </MessageBubble>

              <MessageBubble
                align="left"
                className={stagedClass(440)}
                style={stagedStyle(440)}
                tone="light"
              >
                15h30, perfeito.
              </MessageBubble>

              <MessageBubble
                align="right"
                className={stagedClass(660)}
                style={stagedStyle(660)}
                tone="success"
              >
                Fechado. Já reservei, deixei confirmado e envio o lembrete no horário certo.
              </MessageBubble>
            </div>

            <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-1">
              <MiniMetric label="Resposta" value="< 3 segundos" />
              <MiniMetric label="Status" value="Cliente confirmado" />
            </div>
          </div>
        </div>

        <div className="flex justify-center xl:hidden">
          <div className="relative h-16 w-1 rounded-full bg-white/12">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-violet-400/70 to-emerald-400/70" />
            <span
              className={cn(
                "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.45)]",
                showAll && !reduceMotion ? "animate-glow-breathe" : ""
              )}
            />
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 justify-center xl:flex z-10 pointer-events-none">
          <div className="relative h-1 w-12 rounded-full bg-white/12">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-400/70 to-emerald-400/70" />
            <span
              className={cn(
                "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.45)]",
                showAll && !reduceMotion ? "animate-glow-breathe" : ""
              )}
            />
          </div>
        </div>

        <div className="relative min-w-0 rounded-[2rem] border border-white/12 bg-white/7 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl">
          <div
            className={cn(
              "absolute right-5 top-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/12 px-3 py-2 text-xs font-semibold text-emerald-100 shadow-lg backdrop-blur",
              reduceMotion ? "" : showAll ? "animate-toast-pop" : "opacity-0"
            )}
            style={stagedStyle(1280)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Agendamento sincronizado
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-white p-4 pt-16 shadow-inner">
            <div className="mb-4 flex items-center justify-between rounded-[1.2rem] bg-[#F5F5F7] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500/14 text-violet-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-[#0A0A0A]">ERP Receps</p>
                  <p className="text-sm text-[#525252]">Bella &amp; Co</p>
                </div>
              </div>
              <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                agenda ao vivo
              </div>
            </div>

            <div className="grid gap-4 flex-col">
              <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#f5f3ff_0%,#ffffff_22%,#ffffff_100%)] p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0A0A0A]">Agenda de hoje</p>
                    <p className="text-xs text-[#737373]">4 atendimentos confirmados</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
                    sem conflito
                  </div>
                </div>

                <div className="space-y-3">
                  {baseAppointments.map((appointment) => (
                    <div
                      key={`${appointment.time}-${appointment.customer}`}
                      className={`flex items-center gap-3 rounded-[1.2rem] border px-3 py-3 shadow-sm ${appointment.accent}`}
                    >
                      <div className="rounded-[0.9rem] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0A0A0A] shadow-sm">
                        {appointment.time}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{appointment.customer}</p>
                        <p className="truncate text-xs text-[#525252]">{appointment.service}</p>
                      </div>
                    </div>
                  ))}

                    <div
                      className={cn(
                        "relative flex items-center gap-3 rounded-[1.2rem] border border-violet-200 bg-violet-50/90 px-3 py-3 shadow-[0_20px_40px_rgba(139,92,246,0.10)] ring-1 ring-violet-200/70",
                        reduceMotion
                          ? ""
                          : showAll
                            ? "translate-x-0 opacity-100 transition-all duration-700"
                            : "translate-x-4 opacity-0"
                      )}
                      style={!reduceMotion && showAll ? { transitionDelay: "1040ms" } : undefined}
                    >
                      <div className="rounded-[0.9rem] bg-white px-2.5 py-1.5 text-xs font-bold text-[#0A0A0A] shadow-sm">
                        15:30
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-violet-900">Camila</p>
                        <p className="truncate text-xs text-violet-700">Atendimento confirmado</p>
                      </div>
                      <div className="ml-auto rounded-full bg-violet-500/12 px-2 py-1 text-[11px] font-semibold text-violet-700">
                        novo
                      </div>
                      <span
                        className={cn(
                          "pointer-events-none absolute inset-0 rounded-[1.2rem]",
                          showAll && !reduceMotion ? "animate-highlight-pulse" : ""
                        )}
                      />
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A]">
                    <WalletCards className="h-4 w-4 text-violet-600" />
                    Faturamento previsto
                  </div>
                  <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0A0A0A]">
                    <CountUpStat value={2940} prefix="R$ " decimals={2} />
                  </p>
                  <p className="mt-2 text-sm text-[#525252]">Agenda nova já entra no caixa do dia</p>
                </div>

                <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)] p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A]">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Profissional avisado
                  </div>
                  <p className="mt-3 text-lg font-bold tracking-[-0.03em] text-[#0A0A0A]">
                    Comissão atualizada automaticamente
                  </p>
                  <p className="mt-2 text-sm text-[#525252]">
                    Nada de recalcular no fim do dia.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 grid-cols-1 md:grid-cols-3 xl:grid-cols-1">
              <MiniMetric label="Hoje" value="6 marcados só no fim de semana" icon={<CalendarDays className="h-3.5 w-3.5 text-violet-600" />} />
              <MiniMetric label="Tempo" value="1 operação, zero retrabalho" icon={<Clock3 className="h-3.5 w-3.5 text-violet-600" />} />
              <MiniMetric label="Fluxo" value="WhatsApp + agenda + caixa" icon={<Sparkles className="h-3.5 w-3.5 text-violet-600" />} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  align,
  children,
  className,
  style,
  tone,
}: {
  align: "left" | "right";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tone: "light" | "success";
}) {
  return (
    <div className={align === "right" ? "flex justify-end" : "flex justify-start"}>
      <div
        className={cn(
          "max-w-[84%] rounded-[1.3rem] px-4 py-3 text-sm leading-6 shadow-sm",
          tone === "success"
            ? "rounded-br-md bg-[#dcfce7] text-[#14532d]"
            : "rounded-bl-md bg-white text-[#1f2937]",
          className
        )}
        style={style}
      >
        {children}
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[1.25rem] border border-[#EAEAEA] bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#737373] min-w-0">
        <div className="shrink-0">{icon}</div>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-2 text-lg font-bold text-[#0A0A0A] break-words">{value}</p>
    </div>
  );
}
