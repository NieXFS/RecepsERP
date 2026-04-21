"use client";

import { cn } from "@/lib/utils";
import { Clock, User } from "lucide-react";
import {
  APPOINTMENT_STATUS_CARD_STYLES,
  getAppointmentStatusLabel,
  normalizeAppointmentStatus,
} from "@/lib/appointments/status";
import { CALENDAR_SLOT_HEIGHT_PX, getTenantScheduleBounds } from "@/lib/tenant-schedule";
import type { CalendarAppointment, CalendarScheduleConfig } from "./types";

type AppointmentCardProps = {
  appointment: CalendarAppointment;
  scheduleConfig: CalendarScheduleConfig;
  onClick?: () => void;
};

/**
 * Card visual posicionado sobre o grid da agenda.
 * Calcula top e height com base no horário de início/fim
 * relativo ao início do dia no grid configurado pelo tenant.
 */
export function AppointmentCard({
  appointment,
  scheduleConfig,
  onClick,
}: AppointmentCardProps) {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const scheduleBounds = getTenantScheduleBounds(scheduleConfig);

  // Calcula a posição (top) e altura relativa ao grid
  const gridStartMinutes = scheduleBounds.startMinutes;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const durationMinutes = endMinutes - startMinutes;

  const topOffset =
    ((startMinutes - gridStartMinutes) / scheduleConfig.slotIntervalMinutes) *
    CALENDAR_SLOT_HEIGHT_PX;
  const height =
    (durationMinutes / scheduleConfig.slotIntervalMinutes) *
    CALENDAR_SLOT_HEIGHT_PX;

  const normalizedStatus = normalizeAppointmentStatus(appointment.status);
  const style =
    APPOINTMENT_STATUS_CARD_STYLES[normalizedStatus] ??
    APPOINTMENT_STATUS_CARD_STYLES.SCHEDULED;
  const statusLabel = getAppointmentStatusLabel(appointment.status);
  const serviceLabel =
    appointment.services.map((service) => service.name).join(", ") ||
    "Serviço não informado";

  const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} – ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  const cardHeight = Math.max(height - 2, 32);
  const isDense = cardHeight < 40;
  const isCompact = cardHeight < 72;
  const showResources = cardHeight >= 96;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-[10px] cursor-pointer",
        "transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
        "shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        "hover:z-20 hover:-translate-y-0.5 hover:scale-[1.015] hover:shadow-lg hover:shadow-primary/15",
        "active:scale-[0.98]",
        isCompact ? "px-2 py-1" : "px-2.5 py-1.5",
        style.bg,
        style.leftBorder,
        style.text
      )}
      style={{ top: `${topOffset}px`, height: `${cardHeight}px` }}
      title={`${appointment.customerName} — ${serviceLabel} — ${statusLabel} — ${timeLabel}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Agendamento: ${appointment.customerName}, ${serviceLabel}, ${timeLabel}, status ${statusLabel}`}
    >
      {isDense ? (
        <div className="flex h-full flex-col justify-center gap-0.5 leading-[1.05]">
          <div className="flex items-center justify-between gap-1">
            <span className="min-w-0 truncate text-[10px] font-semibold">
              {appointment.customerName}
            </span>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-1 py-0.5 text-[8px] font-medium",
                style.badge
              )}
            >
              {statusLabel}
            </span>
          </div>
          <div className="truncate text-[9px] opacity-80">
            {timeLabel} · {serviceLabel}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex h-full flex-col leading-[1.1]",
            isCompact ? "justify-between gap-0.5" : "gap-0.5"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              {!isCompact && <User className="h-3 w-3 shrink-0" aria-hidden="true" />}
              <span className={cn("truncate font-semibold", isCompact ? "text-[11px]" : "text-xs")}>
                {appointment.customerName}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-1.5 py-0.5 font-medium",
                isCompact ? "text-[9px]" : "text-[10px]",
                style.badge
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className={cn("flex items-center gap-1 opacity-80", isCompact ? "text-[10px]" : "text-[11px]")}>
            {!isCompact && <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />}
            <span>{timeLabel}</span>
          </div>

          <div className={cn("truncate opacity-75", isCompact ? "text-[10px]" : "text-[11px]")}>
            {serviceLabel}
          </div>

          {showResources && appointment.roomName && (
            <div className="truncate text-[10px] opacity-60">
              {appointment.roomName}
              {appointment.equipments.length > 0 && ` · ${appointment.equipments.join(", ")}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
