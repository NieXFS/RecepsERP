"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "./appointment-card";
import { AgendaOperationsPanel } from "./agenda-operations-panel";
import { NewAppointmentDialog } from "./new-appointment-dialog";
import { getAppointmentStatusLabel } from "@/lib/appointments/status";
import {
  generateTimeSlots,
  CALENDAR_CONFIG,
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
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";

type DailyCalendarProps = {
  date: string;
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
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Estado do modal de novo agendamento
  const [dialogOpen, setDialogOpen] = useState(false);
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
  const gridStartMinutes = CALENDAR_CONFIG.START_HOUR * 60;
  const gridEndMinutes = CALENDAR_CONFIG.END_HOUR * 60;
  const showNowLine = isToday && nowMinutes >= gridStartMinutes && nowMinutes <= gridEndMinutes;
  const nowLineTop = ((nowMinutes - gridStartMinutes) / CALENDAR_CONFIG.SLOT_MINUTES) * CALENDAR_CONFIG.SLOT_HEIGHT_PX;
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

    if (isToday) {
      const clampedHour = Math.min(
        Math.max(now.getHours(), CALENDAR_CONFIG.START_HOUR),
        CALENDAR_CONFIG.END_HOUR - 1
      );
      const roundedMinute = now.getMinutes() >= 30 ? 30 : 0;

      initialTime.setHours(clampedHour, roundedMinute, 0, 0);
    } else {
      initialTime.setHours(CALENDAR_CONFIG.START_HOUR, 0, 0, 0);
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
      {/* ---- CABEÇALHO: Navegação de data ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="animate-fade-in-down">
          <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
          <p className="text-sm text-muted-foreground capitalize">{dateFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleNewAppointmentClick} disabled={professionals.length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo Agendamento
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay(-1)}
            className="transition-transform active:scale-95"
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="transition-transform active:scale-95"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDay(1)}
            className="transition-transform active:scale-95"
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

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
            className="relative flex-1 h-[60vh] min-h-[500px] overflow-x-auto overflow-y-auto rounded-lg border bg-background pb-4"
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
                <div className="sticky top-0 left-0 z-30 w-[80px] min-w-[80px] border-r border-b bg-background px-2 py-3 text-xs font-medium text-muted-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
                  Horário
                </div>

                {/* Uma coluna por profissional */}
                {professionals.map((prof) => (
                  <div
                    key={prof.id}
                    role="columnheader"
                    className="sticky top-0 z-20 min-w-[220px] border-b border-r bg-background px-3 py-3 text-center shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] last:border-r-0"
                  >
                    <p className="truncate text-sm font-semibold">{prof.name}</p>
                    {prof.specialty && (
                      <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {appointmentsByProfessional.get(prof.id)?.length ?? 0} agendamento(s)
                    </p>
                  </div>
                ))}
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
                  className="sticky left-0 relative z-20 w-[80px] min-w-[80px] border-r bg-background"
                  style={{ height: `${totalGridHeight}px` }}
                >
                  {timeSlots.map((slot, i) => (
                    <div
                      key={slot.label}
                      className="absolute flex w-full items-start justify-end pr-2 text-xs text-muted-foreground tabular-nums"
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
                      className="pointer-events-none absolute right-2 z-30 -mt-2 text-[10px] font-semibold text-red-500 tabular-nums"
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
                      className="relative min-w-[220px] snap-start border-r last:border-r-0"
                      style={{ height: `${totalGridHeight}px` }}
                    >
                      {/* Linhas horizontais de cada slot (fundo clicável) */}
                      {timeSlots.map((slot, i) => (
                        <div
                          key={slot.label}
                          className="group absolute w-full cursor-pointer border-t border-dashed border-muted-foreground/15 transition-all duration-200 hover:bg-primary/8 hover:shadow-[inset_0_0_0_1px_var(--color-primary)] active:bg-primary/12"
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
                          <div className="flex h-full items-center justify-center opacity-35 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <Plus
                              className="h-4 w-4 text-primary/40"
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Cards de agendamentos posicionados com absolute */}
                      {profAppointments.map((apt) => (
                        <div key={apt.id} className="animate-fade-in">
                          <AppointmentCard appointment={apt} />
                        </div>
                      ))}

                      {/* Linha "agora" (apenas no dia atual) */}
                      {showNowLine && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-10"
                          style={{ top: `${nowLineTop}px` }}
                        >
                          <div className="flex items-center">
                            <div className="-ml-1 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse-ring" />
                            <div className="h-[2px] flex-1 bg-red-500/70" />
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
