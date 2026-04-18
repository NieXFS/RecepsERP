"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Database,
  MessageCircleMore,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    time: "0s",
    title: "Cliente manda WhatsApp",
    description: "Oi, tem horário amanhã?",
    icon: MessageCircleMore,
  },
  {
    time: "2s",
    title: "Ana entende e consulta a agenda",
    description: "Deixa eu ver os horários disponíveis...",
    icon: BrainCircuit,
  },
  {
    time: "4s",
    title: "ERP retorna horarios livres em tempo real",
    description: "14h, 15h30 e 17h estão livres.",
    icon: Database,
  },
  {
    time: "6s",
    title: "Ana oferece e o cliente escolhe",
    description: "Pode ser 15h30? Perfeito.",
    icon: CheckCircle2,
  },
  {
    time: "8s",
    title: "Agendamento criado automaticamente",
    description: "Cliente entra na agenda e o profissional já fica sabendo.",
    icon: CalendarCheck2,
  },
  {
    time: "12s",
    title: "Histórico, comissão e confirmação registrados",
    description: "Tudo sincronizado sem você precisar parar a operação.",
    icon: Sparkles,
  },
];

export function IntegrationTimeline() {
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
      { threshold: 0.18 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative mt-14">
      <div className="absolute left-5 top-8 bottom-8 w-px rounded-full bg-[#E5E7EB] lg:hidden" />
      <div
        className={cn(
          "absolute left-5 top-8 bottom-8 w-px origin-top rounded-full bg-gradient-to-b from-violet-500 via-violet-300 to-emerald-400 lg:hidden",
          reduceMotion ? "scale-y-100" : hasStarted ? "scale-y-100 transition-transform duration-[1800ms]" : "scale-y-0"
        )}
      />

      <div className="absolute left-[8%] right-[8%] top-7 hidden h-px rounded-full bg-[#E5E7EB] lg:block" />
      <div
        className={cn(
          "absolute left-[8%] right-[8%] top-7 hidden h-px origin-left rounded-full bg-gradient-to-r from-violet-500 via-violet-300 to-emerald-400 lg:block",
          reduceMotion ? "scale-x-100" : hasStarted ? "scale-x-100 transition-transform duration-[1800ms]" : "scale-x-0"
        )}
      />

      <div className="grid gap-5 lg:grid-cols-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const delay = index * 180;

          return (
            <div
              key={step.title}
              className={cn(
                "relative pl-16 lg:pl-0 lg:pt-16",
                reduceMotion
                  ? "opacity-100"
                  : hasStarted
                    ? "translate-y-0 opacity-100 transition-all duration-700"
                    : "translate-y-4 opacity-0"
              )}
              style={!reduceMotion && hasStarted ? { transitionDelay: `${delay}ms` } : undefined}
            >
              <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-violet-200 bg-white text-violet-600 shadow-sm lg:left-1/2 lg:top-2 lg:-translate-x-1/2">
                <Icon className="h-5 w-5" />
              </div>

              <div className="rounded-[1.7rem] border border-[#E6E6E6] bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                  {step.time}
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-[-0.02em] text-[#0A0A0A]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#525252]">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex items-center justify-center gap-3 rounded-[1.8rem] border border-violet-100 bg-white px-6 py-4 text-center shadow-sm">
        <Calendar className="h-5 w-5 text-violet-600" />
        <p className="text-base font-semibold text-[#0A0A0A]">
          Enquanto isso, você estava atendendo um cliente pessoalmente cliente, almoçando ou dormindo.
        </p>
      </div>
    </div>
  );
}
