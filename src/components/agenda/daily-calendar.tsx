"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppointmentCard } from "./appointment-card";
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
import { AgendaOperationsPanel } from "./agenda-operations-panel";
import { NewAppointmentDialog } from "./new-appointment-dialog";
import { getAppointmentStatusLabel } from "@/lib/appointments/status";
import {
  generateTimeSlots,
  CALENDAR_CONFIG,
  type CalendarScheduleConfig,
  type CalendarProfessional,
  type CalendarAppointment,
  type CalendarFinancialAccount,
  type CalendarService,
  type CalendarCustomer,
  type CalendarResource,
  type OperationalAppointment,
} from "./types";
import {
  addDaysToCivilDate,
  civilDateToLocalDate,
  formatCivilDateLabel,
  formatCivilDateToQuery,
  getTodayCivilDate,
  parseCivilDateFromQuery,
} from "@/lib/civil-date";
import { getTenantScheduleBounds } from "@/lib/tenant-schedule";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { cn } from "@/lib/utils";

type DailyCalendarProps = {
  date: string;
  scheduleConfig: CalendarScheduleConfig;
  professionals: CalendarProfessional[];
  appointments: CalendarAppointment[];
  operationalAppointments: OperationalAppointment[];
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
  services: CalendarService[];
  customers: CalendarCustomer[];
  rooms: CalendarResource[];
  equipment: CalendarResource[];
};

/**
 * Grid diário multi-profissional da agenda.
 *
 * Estrutura visual:
 * ┌──────────┬──────────────┬──────────────┬──────────────┐
 * │ Horário  │ Dra. Julia   │ Dr. Pedro    │ Ana          │
 * ├──────────┼──────────────┼──────────────┼──────────────┤
 * │ 08:00    │              │  [Card]      │              │
 * │ 08:30    │  [Card]      │  [Card]      │              │
 * │ 09:00    │  [Card]      │              │  [Card]      │
 * │ ...      │              │              │              │
 * └──────────┴──────────────┴──────────────┴──────────────┘
 *
 * - Clique em slot vazio → abre modal de novo agendamento
 * - Cards posicionados com position:absolute baseado no horário
 * - useRouter para navegação entre datas
 */
export function DailyCalendar({
  date,
  scheduleConfig,
  professionals,
  appointments,
  operationalAppointments,
  hasOpenCashRegister,
  openCashRegisterAccountId,
  financialAccounts,
  services,
  customers,
  rooms,
  equipment,
}: DailyCalendarProps) {
  const router = useRouter();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const currentCivilDate = useMemo(() => parseCivilDateFromQuery(date), [date]);
  const currentDate = useMemo(
    () => civilDateToLocalDate(currentCivilDate),
    [currentCivilDate]
  );
  const timeSlots = useMemo(
    () => generateTimeSlots(scheduleConfig),
    [scheduleConfig]
  );
  const scheduleBounds = useMemo(
    () => getTenantScheduleBounds(scheduleConfig),
    [scheduleConfig]
  );

  // Estado do modal de novo agendamento
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<CalendarAppointment | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<CalendarProfessional | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);

  // Agrupa agendamentos por profissional para renderização rápida
  const appointmentsByProfessional = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const prof of professionals) {
      map.set(prof.id, []);
    }
    for (const apt of appointments) {
      const list = map.get(apt.professionalId);
      if (list) list.push(apt);
    }
    return map;
  }, [professionals, appointments]);

  // "HH:MM – HH:MM" da faixa de operação do tenant.
  const operatingBandLabel = useMemo(() => {
    const fmt = (m: number) =>
      `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    return `${fmt(scheduleBounds.startMinutes)} – ${fmt(scheduleBounds.endMinutes)}`;
  }, [scheduleBounds]);

  // Taxa de ocupação do dia: minutos agendados / minutos disponíveis totais.
  // `appointments` já vem filtrado (sem CANCELLED/NO_SHOW) via o page.tsx.
  const occupationPercent = useMemo(() => {
    if (professionals.length === 0) return 0;
    const totalAvailable =
      (scheduleBounds.endMinutes - scheduleBounds.startMinutes) *
      professionals.length;
    if (totalAvailable <= 0) return 0;
    const totalOccupied = appointments.reduce((sum, apt) => {
      const duration =
        (new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) /
        60000;
      return sum + Math.max(0, duration);
    }, 0);
    return Math.round((totalOccupied / totalAvailable) * 100);
  }, [appointments, professionals.length, scheduleBounds]);

  // Altura total do grid baseada na quantidade de slots
  const totalGridHeight = timeSlots.length * CALENDAR_CONFIG.SLOT_HEIGHT_PX;

  // Formatação da data atual
  const dateFormatted = useMemo(
    () => formatCivilDateLabel(currentCivilDate),
    [currentCivilDate]
  );

  /** Navega para o dia anterior/próximo */
  const navigateDay = useCallback(
    (offset: number) => {
      const nextDate = addDaysToCivilDate(currentCivilDate, offset);
      router.push(`/agenda?date=${formatCivilDateToQuery(nextDate)}`);
    },
    [currentCivilDate, router]
  );

  /** Navega para hoje */
  const goToToday = useCallback(() => {
    router.push(`/agenda?date=${formatCivilDateToQuery(getTodayCivilDate())}`);
  }, [router]);

  /**
   * Clique em um slot vazio — abre o modal com profissional e horário pré-selecionados.
   * O startTime é calculado com base no slot clicado (hora:minuto) + a data da agenda.
   */
  function handleSlotClick(professional: CalendarProfessional, hour: number, minute: number) {
    const clickTime = new Date(currentDate);
    clickTime.setHours(hour, minute, 0, 0);

    setSelectedProfessional(professional);
    setSelectedStartTime(clickTime);
    setDialogOpen(true);
  }

  /** Callback quando o dialog fecha — faz refresh dos dados via router */
  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      // Refresh da página para re-buscar agendamentos do servidor
      router.refresh();
    }
  }

  // Indicador de "agora" — linha horizontal vermelha mostrando o horário atual
  const now = new Date();
  const isToday = currentDate.toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const gridStartMinutes = scheduleBounds.startMinutes;
  const gridEndMinutes = scheduleBounds.endMinutes;
  const showNowLine = isToday && nowMinutes >= gridStartMinutes && nowMinutes <= gridEndMinutes;
  const nowLineTop =
    ((nowMinutes - gridStartMinutes) / scheduleConfig.slotIntervalMinutes) *
    CALENDAR_CONFIG.SLOT_HEIGHT_PX;
  const nowFormatted = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const swipeHandlers = useSwipeNavigation((direction) => {
    navigateDay(direction === "left" ? 1 : -1);
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.target instanceof HTMLElement)) {
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLButtonElement ||
        e.target.isContentEditable ||
        e.target.closest("[role='dialog']")
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        navigateDay(-1);
      }

      if (e.key === "ArrowRight") {
        navigateDay(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateDay]);

  useEffect(() => {
    if (!showNowLine || !gridRef.current) {
      return;
    }

    const scrollTarget = Math.max(0, nowLineTop - 150);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    gridRef.current.scrollTo({
      top: scrollTarget,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [nowLineTop, showNowLine]);

  function handleNewAppointmentClick() {
    const firstProfessional = professionals[0] ?? null;

    if (!firstProfessional) {
      return;
    }

    const initialTime = new Date(currentDate);
    const latestStartMinutes = Math.max(
      scheduleBounds.startMinutes,
      scheduleBounds.endMinutes - scheduleConfig.slotIntervalMinutes
    );

    if (isToday) {
      const clampedMinutes = Math.min(
        Math.max(now.getHours() * 60 + now.getMinutes(), scheduleBounds.startMinutes),
        latestStartMinutes
      );
      const roundedMinutes =
        clampedMinutes -
        (clampedMinutes % scheduleConfig.slotIntervalMinutes);

      initialTime.setHours(
        Math.floor(roundedMinutes / 60),
        roundedMinutes % 60,
        0,
        0
      );
    } else {
      initialTime.setHours(
        Math.floor(scheduleBounds.startMinutes / 60),
        scheduleBounds.startMinutes % 60,
        0,
        0
      );
    }

    setSelectedProfessional(firstProfessional);
    setSelectedStartTime(initialTime);
    setDialogOpen(true);
  }

  function formatAppointmentTimeLabel(startTimeValue: string, endTimeValue: string) {
    const startDate = new Date(startTimeValue);
    const endDate = new Date(endTimeValue);

    return `${startDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })} – ${endDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return (
    <>
      {/* ---- CABEÇALHO ---- */}
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="animate-fade-in-down">
          <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.035em] text-foreground">
            Agenda
          </h1>
          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[14.5px] text-muted-foreground">
            <span className="capitalize">{dateFormatted}</span>
            <span
              aria-hidden="true"
              className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40"
            />
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-block h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Ana online
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigateDay(-1)}
            aria-label="Dia anterior"
            className="grid h-9 w-9 place-items-center rounded-[11px] bg-card text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <ChevronLeft className="h-[15px] w-[15px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="rounded-[11px] bg-card px-[18px] py-[9px] text-[13px] font-semibold text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => navigateDay(1)}
            aria-label="Próximo dia"
            className="grid h-9 w-9 place-items-center rounded-[11px] bg-card text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-150 hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <ChevronRight className="h-[15px] w-[15px]" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleNewAppointmentClick}
            disabled={professionals.length === 0}
            className="ml-1 inline-flex items-center gap-1.5 rounded-[11px] bg-primary px-[18px] py-[9px] text-[13px] font-semibold text-primary-foreground shadow-lg shadow-primary/35 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/45 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Plus className="h-[15px] w-[15px]" aria-hidden="true" />
            Novo agendamento
          </button>
        </div>
      </header>

      {/* ---- GRID DA AGENDA ---- */}
      {professionals.length === 0 ? (
        <div className="animate-fade-in flex h-64 items-center justify-center text-muted-foreground">
          Nenhum profissional cadastrado. Cadastre profissionais para usar a agenda.
        </div>
      ) : (
        <>
          <table className="sr-only">
            <caption>Agendamentos de {dateFormatted}</caption>
            <thead>
              <tr>
                <th>Horário</th>
                <th>Profissional</th>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    {formatAppointmentTimeLabel(
                      appointment.startTime,
                      appointment.endTime
                    )}
                  </td>
                  <td>{appointment.professionalName}</td>
                  <td>{appointment.customerName}</td>
                  <td>
                    {appointment.services.map((service) => service.name).join(", ")}
                  </td>
                  <td>{getAppointmentStatusLabel(appointment.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            className={cn(
              "relative flex flex-1 flex-col h-[62vh] min-h-[520px] overflow-hidden rounded-[22px] bg-card",
              "shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]"
            )}
          >
            {/* ---- HEADER INTERNO DO TIMELINE CARD ---- */}
            <div className="flex items-start justify-between gap-4 border-b border-border/50 px-6 pt-5 pb-4">
              <div className="min-w-0">
                <h3 className="flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.025em] text-foreground">
                  <span
                    aria-hidden="true"
                    className="relative inline-flex h-2 w-2"
                  >
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-60" />
                    <span className="relative inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Linha do tempo do dia
                </h3>
                <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                  Faixa:{" "}
                  <b className="font-bold tabular-nums text-foreground">
                    {operatingBandLabel}
                  </b>
                  <span className="mx-[7px] opacity-40">·</span>
                  Profissionais ativos:{" "}
                  <b className="font-bold tabular-nums text-foreground">
                    {professionals.length}
                  </b>
                  <span className="mx-[7px] opacity-40">·</span>
                  Ocupação:{" "}
                  <b className="font-bold tabular-nums text-foreground">
                    {occupationPercent}%
                  </b>
                  <span className="mx-[7px] opacity-40">·</span>
                  Total:{" "}
                  <b className="font-bold tabular-nums text-foreground">
                    {appointments.length}
                  </b>{" "}
                  {appointments.length === 1 ? "agendamento" : "agendamentos"}
                </p>
              </div>
              <TimelineViewToggle />
            </div>

            <div
              ref={gridRef}
              role="grid"
              aria-label={`Agenda de ${dateFormatted}`}
              className="relative flex-1 overflow-x-auto overflow-y-auto pb-4"
              {...swipeHandlers}
            >
              <div className="min-w-full w-max snap-x snap-mandatory md:snap-none">
                {/* Cabeçalho de colunas: Profissionais */}
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `62px repeat(${professionals.length}, minmax(220px, 1fr))`,
                  }}
                >
                  {/* Célula vazia no canto (coluna de horários) */}
                  <div className="sticky top-0 left-0 z-30 w-[62px] min-w-[62px] bg-card/95 px-2 pb-3 pt-4 text-[9.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur">
                    Horário
                  </div>

                  {/* Uma coluna por profissional */}
                  {professionals.map((prof) => {
                    const count = appointmentsByProfessional.get(prof.id)?.length ?? 0;
                    const initial = prof.name.trim().charAt(0).toUpperCase() || "?";
                    return (
                      <div
                        key={prof.id}
                        role="columnheader"
                        className="sticky top-0 z-20 min-w-[220px] bg-card/95 px-3 pb-3 pt-4 backdrop-blur"
                      >
                        <div className="relative flex items-center gap-3 overflow-hidden rounded-[14px] bg-violet-500/[0.08] px-3 py-2.5 dark:bg-violet-500/15">
                          <span
                            aria-hidden="true"
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
                          />
                          <span
                            aria-hidden="true"
                            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-[13px] font-bold text-white shadow-sm shadow-primary/25"
                          >
                            {initial}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-bold tracking-[-0.01em] text-foreground">
                              {prof.name}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {prof.specialty ?? "Profissional"} · {count}{" "}
                              {count === 1 ? "agendamento" : "agendamentos"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Corpo do grid: Slots de horário × Profissionais.
                    pt-3 dá folga no topo pra o primeiro rótulo (que usa -mt-2)
                    não ficar cortado sob o header sticky.
                    relative é necessário pra ancorar a linha "AGORA" única. */}
                <div
                  className="relative grid pt-3"
                  style={{
                    gridTemplateColumns: `62px repeat(${professionals.length}, minmax(220px, 1fr))`,
                  }}
                >
                  {/* Coluna de horários (eixo Y) */}
                  <div
                    className="sticky left-0 relative z-20 w-[62px] min-w-[62px] bg-card"
                    style={{ height: `${totalGridHeight}px` }}
                  >
                    {timeSlots.map((slot, i) => {
                      // Só renderiza label nos sub-slots quando o tenant usa intervalo
                      // de 60min; pra 15/30/45 mostra apenas nas horas cheias.
                      // slot.minute === 0 sempre cobre os dois casos.
                      const showLabel = slot.minute === 0;
                      return (
                        <div
                          key={slot.label}
                          className="absolute flex w-full items-start justify-end pr-2 text-[10.5px] font-semibold text-muted-foreground tabular-nums"
                          style={{
                            top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                            height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                          }}
                        >
                          {showLabel && (
                            <>
                              <span className="-mt-2">{slot.label}</span>
                              {/* Tick mark na borda direita, apenas nas horas cheias */}
                              <span
                                aria-hidden="true"
                                className="absolute right-0 top-0 h-px w-1.5 bg-border/60"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  {showNowLine && (
                    <>
                      {/* Eyebrow "AGORA" empilhado logo ACIMA da linha, dentro da hour column (sticky).
                          A hour column tem 62px — não cabe eyebrow + badge lado a lado, então
                          ficam empilhados (eyebrow acima da linha, badge abaixo). */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1 z-40 rounded-sm bg-violet-500/10 px-1 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-violet-600 dark:bg-violet-400/15 dark:text-violet-300"
                        style={{ top: `${nowLineTop - 14}px` }}
                      >
                        Agora
                      </div>
                      {/* Badge da hora corrente, empilhado logo abaixo da linha. */}
                      <div
                        className="pointer-events-none absolute right-1 z-40 rounded-md bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md shadow-violet-500/35 tabular-nums dark:bg-violet-400 dark:text-violet-950 dark:shadow-violet-400/40"
                        style={{ top: `${nowLineTop + 4}px` }}
                      >
                        {nowFormatted}
                      </div>
                    </>
                  )}
                </div>

                {/* Uma coluna por profissional com slots clicáveis */}
                {professionals.map((prof) => {
                  const profAppointments =
                    appointmentsByProfessional.get(prof.id) ?? [];

                  return (
                    <div
                      key={prof.id}
                      className={cn(
                        "relative min-w-[220px] snap-start",
                        // Stripe pattern sutil marcando cada slot (sub-hora).
                        // Hora cheia é reforçada pelo divisor separado abaixo.
                        "bg-[image:repeating-linear-gradient(to_bottom,transparent_0px_47px,rgba(15,23,42,0.035)_47px_48px)]",
                        "dark:bg-[image:repeating-linear-gradient(to_bottom,transparent_0px_47px,rgba(255,255,255,0.04)_47px_48px)]"
                      )}
                      style={{ height: `${totalGridHeight}px` }}
                    >
                      {/* Divisores horizontais — apenas nas horas cheias. Pointer-events:none
                          pra não roubar clique dos slots clicáveis acima. */}
                      {timeSlots.map((slot, i) => {
                        if (slot.minute !== 0) return null;
                        return (
                          <div
                            key={`hr-${slot.hour}`}
                            aria-hidden="true"
                            className="pointer-events-none absolute left-0 right-0 h-px bg-border/50 dark:bg-border/30"
                            style={{ top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px` }}
                          />
                        );
                      })}

                      {/* Slots clicáveis — sem borda em rest, dashed violet no hover/focus */}
                      {timeSlots.map((slot, i) => (
                        <div
                          key={slot.label}
                          className={cn(
                            "group absolute left-1.5 right-1.5 cursor-pointer rounded-[12px]",
                            "border-[1.5px] border-transparent",
                            "transition-[background-color,border-color,border-style] duration-150",
                            "hover:border-dashed hover:border-violet-500/30 hover:bg-violet-500/[0.05]",
                            "focus-visible:border-dashed focus-visible:border-violet-500/30 focus-visible:bg-violet-500/[0.05] focus-visible:outline-none",
                            "active:bg-violet-500/[0.1]",
                            "dark:hover:border-violet-400/30 dark:hover:bg-violet-400/[0.08]",
                            "dark:focus-visible:border-violet-400/30 dark:focus-visible:bg-violet-400/[0.08]"
                          )}
                          style={{
                            top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                            height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                            touchAction: "manipulation",
                          }}
                          onClick={() =>
                            handleSlotClick(prof, slot.hour, slot.minute)
                          }
                        >
                          <div className="flex h-full items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Plus
                              className="h-[18px] w-[18px] text-violet-500 dark:text-violet-400"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Cards de agendamentos posicionados com absolute */}
                      {profAppointments.map((apt) => (
                        <div key={apt.id} className="animate-fade-in">
                          <AppointmentCard
                            appointment={apt}
                            scheduleConfig={scheduleConfig}
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setDetailDialogOpen(true);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Linha "AGORA" — única, atravessando todas as colunas de profissional.
                    Começa em left-[62px] (= largura da hour column) e vai até right-0.
                    z-20 fica acima dos cards (z-10) mas abaixo do hour column sticky. */}
                {showNowLine && (
                  <>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-[62px] right-0 z-20 h-0 border-t-[1.5px] border-dashed border-violet-500/60 dark:border-violet-400/60"
                      style={{ top: `${nowLineTop}px` }}
                    />
                    {/* Dot violeta no fim do board */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute right-0 z-30 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500 shadow-[0_0_0_3px_rgba(139,92,246,0.2)] dark:bg-violet-400 dark:shadow-[0_0_0_3px_rgba(139,92,246,0.35)]"
                      style={{ top: `${nowLineTop}px` }}
                    />
                  </>
                )}
              </div>

                {appointments.length === 0 && professionals.length > 0 && (
                  <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center px-6">
                    <div className="animate-fade-in text-center text-muted-foreground/60">
                      <CalendarX2
                        className="mx-auto mb-2 h-10 w-10"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-medium">Nenhum agendamento hoje</p>
                      <p className="text-xs">Clique em um horário para agendar</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ---- MODAL DE NOVO AGENDAMENTO ---- */}
      <AppointmentDetailDialog
        appointment={selectedAppointment}
        open={detailDialogOpen}
        onOpenChange={(open) => {
          setDetailDialogOpen(open);
          if (!open) {
            setSelectedAppointment(null);
            router.refresh();
          }
        }}
        hasOpenCashRegister={hasOpenCashRegister}
        openCashRegisterAccountId={openCashRegisterAccountId}
        financialAccounts={financialAccounts}
      />

      <NewAppointmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        professional={selectedProfessional}
        startTime={selectedStartTime}
        services={services}
        customers={customers}
        rooms={rooms}
        equipment={equipment}
      />

      <AgendaOperationsPanel
        dateLabel={dateFormatted}
        appointments={operationalAppointments}
        hasOpenCashRegister={hasOpenCashRegister}
        openCashRegisterAccountId={openCashRegisterAccountId}
        financialAccounts={financialAccounts}
      />
    </>
  );
}

/**
 * Toggle visual Dia/Semana/Mês do timeline card.
 * Apenas "Dia" é interativo (e já é o estado atual — noop).
 * Semana e Mês ficam desabilitados com tooltip "Em breve" até
 * serem implementados (escopo fora do Batch B).
 */
function TimelineViewToggle() {
  return (
    <div
      role="tablist"
      aria-label="Visualização do calendário"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-[10px] bg-muted/60 p-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected="true"
        className="rounded-md bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-sm shadow-primary/25"
      >
        Dia
      </button>
      <button
        type="button"
        role="tab"
        aria-selected="false"
        aria-disabled="true"
        disabled
        title="Em breve"
        className="cursor-not-allowed rounded-md px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground/70"
      >
        Semana
      </button>
      <button
        type="button"
        role="tab"
        aria-selected="false"
        aria-disabled="true"
        disabled
        title="Em breve"
        className="cursor-not-allowed rounded-md px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground/70"
      >
        Mês
      </button>
    </div>
  );
}
