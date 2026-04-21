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
            ref={gridRef}
            role="grid"
            aria-label={`Agenda de ${dateFormatted}`}
            className="relative flex-1 h-[62vh] min-h-[520px] overflow-x-auto overflow-y-auto rounded-[22px] bg-card pb-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]"
            {...swipeHandlers}
          >
            <div className="min-w-full w-max snap-x snap-mandatory md:snap-none">
              {/* Cabeçalho de colunas: Profissionais */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `80px repeat(${professionals.length}, minmax(220px, 1fr))`,
                }}
              >
                {/* Célula vazia no canto (coluna de horários) */}
                <div className="sticky top-0 left-0 z-30 w-[80px] min-w-[80px] bg-card/95 px-3 pb-3 pt-4 text-[10.5px] font-bold uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                  Horário
                </div>

                {/* Uma coluna por profissional */}
                {professionals.map((prof) => {
                  const count = appointmentsByProfessional.get(prof.id)?.length ?? 0;
                  return (
                    <div
                      key={prof.id}
                      role="columnheader"
                      className="sticky top-0 z-20 min-w-[220px] bg-card/95 px-3 pb-3 pt-4 backdrop-blur"
                    >
                      <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-primary/12 to-primary/4 px-3.5 py-2.5 dark:from-primary/20 dark:to-primary/8">
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-[10px] left-0 w-[2.5px] rounded-full bg-primary"
                        />
                        <p className="truncate text-[13px] font-bold text-foreground">
                          {prof.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {prof.specialty ?? "Profissional"} · {count} agendamento(s)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Corpo do grid: Slots de horário × Profissionais */}
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `80px repeat(${professionals.length}, minmax(220px, 1fr))`,
                }}
              >
                {/* Coluna de horários (eixo Y) */}
                <div
                  className="sticky left-0 relative z-20 w-[80px] min-w-[80px] bg-card"
                  style={{ height: `${totalGridHeight}px` }}
                >
                  {timeSlots.map((slot, i) => (
                    <div
                      key={slot.label}
                      className="absolute flex w-full items-start justify-end pr-3 text-[11px] font-semibold text-muted-foreground tabular-nums"
                      style={{
                        top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                        height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                      }}
                    >
                      <span className="-mt-2">{slot.label}</span>
                    </div>
                  ))}
                  {showNowLine && (
                    <div
                      className="pointer-events-none absolute right-2 z-30 -mt-2.5 rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-md shadow-red-500/35 tabular-nums"
                      style={{ top: `${nowLineTop}px` }}
                    >
                      {nowFormatted}
                    </div>
                  )}
                </div>

                {/* Uma coluna por profissional com slots clicáveis */}
                {professionals.map((prof) => {
                  const profAppointments =
                    appointmentsByProfessional.get(prof.id) ?? [];

                  return (
                    <div
                      key={prof.id}
                      className="relative min-w-[220px] snap-start"
                      style={{ height: `${totalGridHeight}px` }}
                    >
                      {/* Linhas horizontais de cada slot (fundo clicável) */}
                      {timeSlots.map((slot, i) => (
                        <div
                          key={slot.label}
                          className="group absolute w-full cursor-pointer border-t border-dashed border-border/60 transition-all duration-200 hover:bg-primary/[0.06] active:bg-primary/[0.1]"
                          style={{
                            top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                            height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                            touchAction: "manipulation",
                          }}
                          onClick={() =>
                            handleSlotClick(prof, slot.hour, slot.minute)
                          }
                        >
                          {/* Ícone de + aparece no hover */}
                          <div className="flex h-full items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <Plus
                              className="h-4 w-4 text-primary/55"
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

                      {/* Linha "agora" (apenas no dia atual) */}
                      {showNowLine && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-10"
                          style={{ top: `${nowLineTop}px` }}
                        >
                          <div className="flex items-center">
                            <div className="-ml-1 h-2.5 w-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/45 animate-pulse-ring" />
                            <div
                              className="h-[1.5px] flex-1"
                              style={{
                                background:
                                  "repeating-linear-gradient(90deg, rgb(239 68 68 / 0.85) 0 6px, transparent 6px 10px)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
