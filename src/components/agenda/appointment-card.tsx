"use client";

import { cn } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_CARD_STYLES,
  getAppointmentStatusLabel,
  normalizeAppointmentStatus,
  type AppointmentWorkflowStatus,
} from "@/lib/appointments/status";
import { CALENDAR_SLOT_HEIGHT_PX, getTenantScheduleBounds } from "@/lib/tenant-schedule";
import type { CalendarAppointment, CalendarScheduleConfig } from "./types";

type AppointmentCardProps = {
  appointment: CalendarAppointment;
  scheduleConfig: CalendarScheduleConfig;
  onClick?: () => void;
};

/**
 * Mapa de cores fortes para o accent pill à esquerda do card.
 * Alinhado com o leftBorder do APPOINTMENT_STATUS_CARD_STYLES mas expresso
 * como bg utility para usar num elemento absolute (não border-left).
 */
const STATUS_ACCENT_CLASSES: Record<AppointmentWorkflowStatus, string> = {
  SCHEDULED: "bg-blue-500",
  CONFIRMED: "bg-emerald-500",
  WAITING: "bg-amber-500",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-slate-400",
  PAID: "bg-emerald-600",
  CANCELLED: "bg-red-500",
  NO_SHOW: "bg-orange-500",
};

function formatPrice(totalPrice: number) {
  return `R$ ${totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

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
  const accentClass = STATUS_ACCENT_CLASSES[normalizedStatus];
  const statusLabel = getAppointmentStatusLabel(appointment.status);
  const serviceLabel =
    appointment.services.map((service) => service.name).join(", ") ||
    "Serviço não informado";

  const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")} – ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  const priceLabel =
    appointment.totalPrice > 0 ? formatPrice(appointment.totalPrice) : null;
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
        "absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-[12px] cursor-pointer",
        "transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
        "shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
        "hover:z-20 hover:translate-x-[2px] hover:shadow-lg hover:shadow-primary/15",
        "active:scale-[0.98]",
        isCompact ? "px-2.5 py-1.5 pl-3" : "px-3 py-2 pl-3.5",
        style.bg,
        style.text
      )}
      style={{ top: `${topOffset}px`, height: `${cardHeight}px` }}
      title={`${appointment.customerName} — ${serviceLabel} — ${statusLabel} — ${timeLabel}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Agendamento: ${appointment.customerName}, ${serviceLabel}, ${timeLabel}, status ${statusLabel}`}
    >
      {/* Left accent pill (inset, not full-height border) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 w-[3px] rounded-full",
          isDense ? "top-1 bottom-1" : "top-2 bottom-2",
          accentClass
        )}
      />

      {isDense ? (
        // isDense (<40px) — só time + price. Cliente/serviço sacrificados
        // porque não há espaço suficiente pra renderizar sem corte.
        <div className="flex h-full items-center justify-between gap-1.5 leading-[1.05]">
          <span className="min-w-0 truncate text-[10px] font-bold tabular-nums tracking-[0.02em] opacity-85">
            {timeLabel}
          </span>
          {priceLabel && (
            <span className="shrink-0 text-[10px] font-bold tabular-nums">
              {priceLabel}
            </span>
          )}
        </div>
      ) : isCompact ? (
        // isCompact (40-72px) — time + cliente + price. Serviço omitido.
        <div className="flex h-full flex-col leading-[1.1]">
          <div className="flex items-start justify-between gap-2">
            <span className="shrink-0 text-[10.5px] font-bold tabular-nums tracking-[0.02em] opacity-85">
              {timeLabel}
            </span>
            {priceLabel && (
              <span className="shrink-0 text-[10.5px] font-bold tabular-nums">
                {priceLabel}
              </span>
            )}
          </div>
          <span className="mt-0.5 truncate text-[12.5px] font-bold tracking-[-0.01em]">
            {appointment.customerName}
          </span>
        </div>
      ) : (
        // Full (>=72px) — time + cliente + serviço + price (+ recursos se >=96).
        <div className="flex h-full flex-col leading-[1.1]">
          <div className="flex items-start justify-between gap-2">
            <span className="shrink-0 text-[11px] font-bold tabular-nums tracking-[0.02em] opacity-85">
              {timeLabel}
            </span>
            {priceLabel && (
              <span className="shrink-0 text-[11.5px] font-bold tabular-nums">
                {priceLabel}
              </span>
            )}
          </div>

          <span className="mt-[3px] truncate text-[13.5px] font-bold tracking-[-0.01em]">
            {appointment.customerName}
          </span>

          <span className="mt-[3px] truncate text-[11.5px] opacity-80">
            {serviceLabel}
          </span>

          {showResources && appointment.roomName && (
            <span className="mt-1 truncate text-[10.5px] opacity-60">
              {appointment.roomName}
              {appointment.equipments.length > 0 && ` · ${appointment.equipments.join(", ")}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
