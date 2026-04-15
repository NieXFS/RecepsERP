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
    <div ref={ref} className="relative mx-auto w-full min-w-0">
      {/* ── Mobile: stacked layout ── */}
      <div className="flex flex-col items-center gap-6 lg:hidden">
        {/* WhatsApp card */}
        <WhatsAppCard
          stagedClass={stagedClass}
          stagedStyle={stagedStyle}
          className="w-full max-w-[360px]"
        />

        {/* Connector */}
        <div className="flex justify-center">
          <div className="relative h-12 w-1 rounded-full bg-white/12">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-violet-400/70 to-emerald-400/70" />
            <span
              className={cn(
                "absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.45)]",
                showAll && !reduceMotion ? "animate-glow-breathe" : ""
              )}
            />
          </div>
        </div>

        {/* ERP card */}
        <ERPCard
          showAll={showAll}
          reduceMotion={reduceMotion}
          stagedStyle={stagedStyle}
          stagedClass={stagedClass}
          className="w-full max-w-[400px]"
        />
      </div>

      {/* ── Desktop: card-stack cascade ── */}
      <div className="relative hidden lg:block" style={{ height: "480px" }}>
        {/* ERP card — BEHIND, rotated, peeking from behind the WhatsApp card */}
        <div
          className={cn(
            "absolute z-0 w-[320px] xl:w-[340px] origin-center transition-all duration-700",
            reduceMotion
              ? "rotate-3"
              : showAll
                ? "rotate-3 opacity-100"
                : "rotate-6 translate-x-6 opacity-0"
          )}
          style={{
            right: "-20px",
            top: "10px",
            ...((!reduceMotion && showAll) ? { transitionDelay: "400ms" } : {}),
          }}
        >
          <ERPCard
            showAll={showAll}
            reduceMotion={reduceMotion}
            stagedStyle={stagedStyle}
            stagedClass={stagedClass}
            className="w-full shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
            compact
          />
        </div>

        {/* WhatsApp card — FRONT, fully readable, no rotation */}
        <div
          className={cn(
            "relative z-10 w-[320px] xl:w-[340px] origin-top-left transition-all duration-700",
            reduceMotion
              ? ""
              : showAll
                ? "translate-x-0 translate-y-0 opacity-100"
                : "-translate-x-4 translate-y-4 opacity-0"
          )}
        >
          <WhatsAppCard
            stagedClass={stagedClass}
            stagedStyle={stagedStyle}
            className="w-full shadow-[0_40px_100px_rgba(0,0,0,0.45)]"
            compact
          />
        </div>

        {/* Floating labels */}
        <div className="absolute -left-2 -top-2 z-20 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 shadow-lg backdrop-blur">
          WhatsApp + ERP
        </div>
        <div className="absolute right-0 -top-2 z-20 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 shadow-lg backdrop-blur">
          Tudo sincronizado
        </div>
      </div>
    </div>
  );
}

/* ━━━ WhatsApp Card ━━━ */
function WhatsAppCard({
  stagedClass,
  stagedStyle,
  className,
  compact,
}: {
  stagedClass: (delay: number, animation?: string) => string;
  stagedStyle: (delay: number) => CSSProperties | undefined;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border border-white/12 bg-white/7 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      <div className={cn("rounded-[1.2rem] border border-white/10 bg-white/[0.04]", compact ? "p-3" : "p-4")}>
        {/* Header */}
        <div className={cn("mb-3 flex items-center justify-between rounded-[1rem] bg-white/8", compact ? "px-3 py-2" : "px-4 py-3")}>
          <div className="flex items-center gap-2.5">
            <div className={cn("flex items-center justify-center rounded-full bg-emerald-400/18 text-emerald-200", compact ? "h-9 w-9" : "h-11 w-11")}>
              <Bot className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </div>
            <div>
              <p className={cn("font-semibold text-white", compact ? "text-sm" : "text-base")}>Ana • Receps IA</p>
              <p className={cn("text-white/60", compact ? "text-xs" : "text-sm")}>Atendendo no seu WhatsApp</p>
            </div>
          </div>
          <div className="rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-semibold text-[#0B0B1A]">
            online
          </div>
        </div>

        {/* Messages */}
        <div className={cn("space-y-2.5 rounded-[1.2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.02)_100%)]", compact ? "p-3" : "p-4")}>
          <MessageBubble
            align="left"
            className={stagedClass(0)}
            style={stagedStyle(0)}
            tone="light"
            compact={compact}
          >
            Oi, tem horário amanhã à tarde?
          </MessageBubble>

          <MessageBubble
            align="right"
            className={stagedClass(220)}
            style={stagedStyle(220)}
            tone="success"
            compact={compact}
          >
            Tenho 15h30 e 17h. Qual fica melhor para você?
          </MessageBubble>

          <MessageBubble
            align="left"
            className={stagedClass(440)}
            style={stagedStyle(440)}
            tone="light"
            compact={compact}
          >
            15h30, perfeito.
          </MessageBubble>

          <MessageBubble
            align="right"
            className={stagedClass(660)}
            style={stagedStyle(660)}
            tone="success"
            compact={compact}
          >
            Fechado. Já reservei, deixei confirmado e envio o lembrete no horário certo.
          </MessageBubble>
        </div>

        {/* Metrics */}
        <div className={cn("mt-3 grid gap-2", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
          <MiniMetric label="Resposta" value="< 3 segundos" compact={compact} />
          <MiniMetric label="Status" value="Confirmado" compact={compact} />
        </div>
      </div>
    </div>
  );
}

/* ━━━ ERP Card ━━━ */
function ERPCard({
  showAll,
  reduceMotion,
  stagedStyle,
  stagedClass,
  className,
  compact,
}: {
  showAll: boolean;
  reduceMotion: boolean;
  stagedStyle: (delay: number) => CSSProperties | undefined;
  stagedClass: (delay: number, animation?: string) => string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-[1.6rem] border border-white/12 bg-white/7 shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl",
        compact ? "p-3" : "p-4",
        className
      )}
    >
      {/* Sync badge */}
      <div
        className={cn(
          "absolute right-4 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/12 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-100 shadow-lg backdrop-blur",
          reduceMotion ? "" : showAll ? "animate-toast-pop" : "opacity-0"
        )}
        style={stagedStyle(1280)}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sincronizado
      </div>

      <div className={cn("rounded-[1.2rem] border border-white/10 bg-white shadow-inner", compact ? "p-3 pt-12" : "p-4 pt-14")}>
        {/* ERP Header */}
        <div className={cn("mb-3 flex items-center justify-between rounded-[1rem] bg-[#F5F5F7]", compact ? "px-3 py-2" : "px-4 py-3")}>
          <div className="flex items-center gap-2.5">
            <div className={cn("flex items-center justify-center rounded-full bg-violet-500/14 text-violet-700", compact ? "h-9 w-9" : "h-11 w-11")}>
              <BarChart3 className={compact ? "h-4 w-4" : "h-5 w-5"} />
            </div>
            <div className="min-w-0">
              <p className={cn("font-semibold text-[#0A0A0A] truncate", compact ? "text-sm" : "text-base")}>ERP Receps</p>
              <p className={cn("text-[#525252] truncate", compact ? "text-xs" : "text-sm")}>Bella &amp; Co</p>
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
            agenda ao vivo
          </div>
        </div>

        {/* Agenda */}
        <div className={cn("rounded-[1.2rem] bg-[linear-gradient(180deg,#f5f3ff_0%,#ffffff_22%,#ffffff_100%)] shadow-sm", compact ? "p-3" : "p-4")}>
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className={cn("font-semibold text-[#0A0A0A]", compact ? "text-xs" : "text-sm")}>Agenda de hoje</p>
              <p className={cn("text-[#737373]", compact ? "text-[10px]" : "text-xs")}>4 confirmados</p>
            </div>
            <div className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-violet-700 shadow-sm">
              sem conflito
            </div>
          </div>

          <div className={cn("space-y-2", compact ? "space-y-1.5" : "")}>
            {baseAppointments.map((appointment) => (
              <div
                key={`${appointment.time}-${appointment.customer}`}
                className={cn(
                  "flex items-center gap-2.5 rounded-[1rem] border shadow-sm",
                  compact ? "px-2 py-2" : "px-3 py-3",
                  appointment.accent
                )}
              >
                <div className={cn("rounded-[0.7rem] bg-white font-bold text-[#0A0A0A] shadow-sm", compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs")}>
                  {appointment.time}
                </div>
                <div className="min-w-0">
                  <p className={cn("truncate font-semibold", compact ? "text-xs" : "text-sm")}>{appointment.customer}</p>
                  <p className={cn("truncate text-[#525252]", compact ? "text-[10px]" : "text-xs")}>{appointment.service}</p>
                </div>
              </div>
            ))}

            {/* New appointment – Camila */}
            <div
              className={cn(
                "relative flex items-center gap-2.5 rounded-[1rem] border border-violet-200 bg-violet-50/90 shadow-[0_20px_40px_rgba(139,92,246,0.10)] ring-1 ring-violet-200/70",
                compact ? "px-2 py-2" : "px-3 py-3",
                reduceMotion
                  ? ""
                  : showAll
                    ? "translate-x-0 opacity-100 transition-all duration-700"
                    : "translate-x-4 opacity-0"
              )}
              style={!reduceMotion && showAll ? { transitionDelay: "1040ms" } : undefined}
            >
              <div className={cn("rounded-[0.7rem] bg-white font-bold text-[#0A0A0A] shadow-sm", compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-xs")}>
                15:30
              </div>
              <div className="min-w-0">
                <p className={cn("truncate font-semibold text-violet-900", compact ? "text-xs" : "text-sm")}>Camila</p>
                <p className={cn("truncate text-violet-700", compact ? "text-[10px]" : "text-xs")}>Atendimento confirmado</p>
              </div>
              <div className="ml-auto shrink-0 rounded-full bg-violet-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                novo
              </div>
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-[1rem]",
                  showAll && !reduceMotion ? "animate-highlight-pulse" : ""
                )}
              />
            </div>
          </div>
        </div>

        {/* Revenue + Professional – only shown on mobile (non-compact) */}
        {!compact && (
          <div className="mt-3 space-y-3">
            <div className="rounded-[1.2rem] bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_100%)] p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0A0A0A]">
                <WalletCards className="h-4 w-4 text-violet-600" />
                Faturamento previsto
              </div>
              <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#0A0A0A]">
                <CountUpStat value={2940} prefix="R$ " decimals={2} />
              </p>
              <p className="mt-2 text-sm text-[#525252]">Agenda nova já entra no caixa do dia</p>
            </div>

            <div className="rounded-[1.2rem] bg-[linear-gradient(180deg,#f0fdf4_0%,#ffffff_100%)] p-4 shadow-sm">
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
        )}

        {/* Bottom stats – only on mobile */}
        {!compact && (
          <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-3">
            <MiniMetric label="Hoje" value="6 marcados só no fim de semana" icon={<CalendarDays className="h-3.5 w-3.5 text-violet-600" />} />
            <MiniMetric label="Tempo" value="1 operação, zero retrabalho" icon={<Clock3 className="h-3.5 w-3.5 text-violet-600" />} />
            <MiniMetric label="Fluxo" value="WhatsApp + agenda + caixa" icon={<Sparkles className="h-3.5 w-3.5 text-violet-600" />} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ━━━ Message Bubble ━━━ */
function MessageBubble({
  align,
  children,
  className,
  style,
  tone,
  compact,
}: {
  align: "left" | "right";
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tone: "light" | "success";
  compact?: boolean;
}) {
  return (
    <div className={align === "right" ? "flex justify-end" : "flex justify-start"}>
      <div
        className={cn(
          "max-w-[84%] rounded-[1.1rem] shadow-sm leading-relaxed",
          compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
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

/* ━━━ Mini Metric ━━━ */
function MiniMetric({
  label,
  value,
  icon,
  compact,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0 rounded-[1rem] border border-[#EAEAEA] bg-white shadow-sm", compact ? "p-2" : "p-3")}>
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-[#737373] min-w-0">
        {icon && <div className="shrink-0">{icon}</div>}
        <span className="truncate">{label}</span>
      </div>
      <p className={cn("mt-1 font-bold text-[#0A0A0A] break-words", compact ? "text-sm" : "text-lg")}>{value}</p>
    </div>
  );
}
