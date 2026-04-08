"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "./appointment-card";
import { AgendaOperationsPanel } from "./agenda-operations-panel";
import { NewAppointmentDialog } from "./new-appointment-dialog";
import {
  generateTimeSlots,
  CALENDAR_CONFIG,
  type CalendarProfessional,
  type CalendarAppointment,
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

type DailyCalendarProps = {
  date: string;
  professionals: CalendarProfessional[];
  appointments: CalendarAppointment[];
  operationalAppointments: OperationalAppointment[];
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
  services,
  customers,
  rooms,
  equipment,
}: DailyCalendarProps) {
  const router = useRouter();
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
  function navigateDay(offset: number) {
    const nextDate = addDaysToCivilDate(currentCivilDate, offset);
    router.push(`/agenda?date=${formatCivilDateToQuery(nextDate)}`);
  }

  /** Navega para hoje */
  function goToToday() {
    router.push(`/agenda?date=${formatCivilDateToQuery(getTodayCivilDate())}`);
  }

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

  return (
    <>
      {/* ---- CABEÇALHO: Navegação de data ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
          <p className="text-sm text-muted-foreground capitalize">{dateFormatted}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDay(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDay(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ---- GRID DA AGENDA ---- */}
      {professionals.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Nenhum profissional cadastrado. Cadastre profissionais para usar a agenda.
        </div>
      ) : (
        <div className="relative flex-1 h-[60vh] min-h-[500px] overflow-x-auto overflow-y-auto rounded-lg border bg-background pb-4">
          <div className="min-w-full w-max">
            {/* Cabeçalho de colunas: Profissionais */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `80px repeat(${professionals.length}, minmax(220px, 1fr))`,
              }}
            >
              {/* Célula vazia no canto (coluna de horários) */}
              <div className="sticky top-0 left-0 z-30 w-[80px] min-w-[80px] bg-background border-r border-b px-2 py-3 text-xs font-medium text-muted-foreground">
                Horário
              </div>

              {/* Uma coluna por profissional */}
              {professionals.map((prof) => (
                <div
                  key={prof.id}
                  className="sticky top-0 z-20 min-w-[220px] bg-background border-b border-r last:border-r-0 px-3 py-3 text-center"
                >
                  <p className="text-sm font-semibold truncate">{prof.name}</p>
                  {prof.specialty && (
                    <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
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
              <div className="sticky left-0 z-20 w-[80px] min-w-[80px] bg-background border-r relative" style={{ height: `${totalGridHeight}px` }}>
                {timeSlots.map((slot, i) => (
                  <div
                    key={slot.label}
                    className="absolute w-full flex items-start justify-end pr-2 text-xs text-muted-foreground"
                    style={{
                      top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                      height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                    }}
                  >
                    <span className="-mt-2">{slot.label}</span>
                  </div>
                ))}
              </div>

              {/* Uma coluna por profissional com slots clicáveis */}
              {professionals.map((prof) => {
                const profAppointments = appointmentsByProfessional.get(prof.id) ?? [];

                return (
                  <div
                    key={prof.id}
                    className="relative min-w-[220px] border-r last:border-r-0"
                    style={{ height: `${totalGridHeight}px` }}
                  >
                    {/* Linhas horizontais de cada slot (fundo clicável) */}
                    {timeSlots.map((slot, i) => (
                      <div
                        key={slot.label}
                        className="absolute w-full border-t border-dashed border-muted-foreground/15 hover:bg-primary/5 cursor-pointer transition-colors group"
                        style={{
                          top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                          height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
                        }}
                        onClick={() => handleSlotClick(prof, slot.hour, slot.minute)}
                      >
                        {/* Ícone de + aparece no hover */}
                        <div className="hidden group-hover:flex items-center justify-center h-full">
                          <Plus className="h-4 w-4 text-primary/40" />
                        </div>
                      </div>
                    ))}

                    {/* Cards de agendamentos posicionados com absolute */}
                    {profAppointments.map((apt) => (
                      <AppointmentCard
                        key={apt.id}
                        appointment={apt}
                      />
                    ))}

                    {/* Linha "agora" (apenas no dia atual) */}
                    {showNowLine && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${nowLineTop}px` }}
                      >
                        <div className="flex items-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1" />
                          <div className="flex-1 h-[2px] bg-red-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
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
      />
    </>
  );
}
