"use client";

import { cn } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import type { CalendarAppointment } from "./types";
import { CALENDAR_CONFIG } from "./types";

/** Cores por status — usa classes com dark: para funcionar em ambos os temas */
const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  SCHEDULED:   { bg: "bg-blue-50 dark:bg-blue-950/40",     border: "border-blue-300 dark:border-blue-700",     text: "text-blue-900 dark:text-blue-200",     badge: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  CONFIRMED:   { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-300 dark:border-emerald-700", text: "text-emerald-900 dark:text-emerald-200", badge: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  CHECKED_IN:  { bg: "bg-amber-50 dark:bg-amber-950/40",   border: "border-amber-300 dark:border-amber-700",   text: "text-amber-900 dark:text-amber-200",   badge: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  IN_PROGRESS: { bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-300 dark:border-purple-700", text: "text-purple-900 dark:text-purple-200", badge: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  COMPLETED:   { bg: "bg-gray-50 dark:bg-gray-800/40",     border: "border-gray-300 dark:border-gray-600",     text: "text-gray-600 dark:text-gray-400",     badge: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CHECKED_IN: "Check-in",
  IN_PROGRESS: "Em Atendimento",
  COMPLETED: "Finalizado",
};

type AppointmentCardProps = {
  appointment: CalendarAppointment;
  dayStart: Date;
};

/**
 * Card visual posicionado sobre o grid da agenda.
 * Calcula top e height com base no horário de início/fim
 * relativo ao início do dia no grid (CALENDAR_CONFIG.START_HOUR).
 */
export function AppointmentCard({ appointment, dayStart }: AppointmentCardProps) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);

  // Calcula a posição (top) e altura relativa ao grid
  const gridStartMinutes = CALENDAR_CONFIG.START_HOUR * 60;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const durationMinutes = endMinutes - startMinutes;

  const topOffset = ((startMinutes - gridStartMinutes) / CALENDAR_CONFIG.SLOT_MINUTES) * CALENDAR_CONFIG.SLOT_HEIGHT_PX;
  const height = (durationMinutes / CALENDAR_CONFIG.SLOT_MINUTES) * CALENDAR_CONFIG.SLOT_HEIGHT_PX;

  const style = STATUS_STYLES[appointment.status] ?? STATUS_STYLES.SCHEDULED;
  const statusLabel = STATUS_LABELS[appointment.status] ?? appointment.status;

  const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} – ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

  // O card é compacto se a duração é curta (30min = 1 slot)
  const isCompact = durationMinutes <= 30;

  return (
    <div
      className={cn(
        "absolute left-1 right-1 rounded-md border px-2 py-1 overflow-hidden cursor-pointer transition-shadow hover:shadow-md z-10",
        style.bg,
        style.border,
        style.text
      )}
      style={{ top: `${topOffset}px`, height: `${Math.max(height - 2, 20)}px` }}
      title={`${appointment.customerName} — ${appointment.services.map((s) => s.name).join(", ")}`}
    >
      {isCompact ? (
        // Layout compacto: tudo em uma linha
        <div className="flex items-center gap-2 text-xs h-full">
          <span className="font-semibold truncate">{appointment.customerName}</span>
          <span className="text-[10px] opacity-75 shrink-0">{timeLabel}</span>
        </div>
      ) : (
        // Layout expandido: múltiplas linhas
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="h-3 w-3 shrink-0" />
              <span className="text-xs font-semibold truncate">
                {appointment.customerName}
              </span>
            </div>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0", style.badge)}>
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] opacity-80">
            <Clock className="h-3 w-3 shrink-0" />
            <span>{timeLabel}</span>
          </div>

          <div className="text-[11px] truncate opacity-75">
            {appointment.services.map((s) => s.name).join(", ")}
          </div>

          {appointment.roomName && (
            <div className="text-[10px] opacity-60 truncate">
              {appointment.roomName}
              {appointment.equipments.length > 0 && ` · ${appointment.equipments.join(", ")}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
