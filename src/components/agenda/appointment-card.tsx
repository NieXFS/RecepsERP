"use client";

import { cn } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import {
  APPOINTMENT_STATUS_CARD_STYLES,
  getAppointmentStatusLabel,
  normalizeAppointmentStatus,
} from "@/lib/appointments/status";
import type { CalendarAppointment } from "./types";
import { CALENDAR_CONFIG } from "./types";

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

  const normalizedStatus = normalizeAppointmentStatus(appointment.status);
  const style =
    APPOINTMENT_STATUS_CARD_STYLES[normalizedStatus] ??
    APPOINTMENT_STATUS_CARD_STYLES.SCHEDULED;
  const statusLabel = getAppointmentStatusLabel(appointment.status);

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
