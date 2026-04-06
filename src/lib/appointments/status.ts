export const APPOINTMENT_WORKFLOW_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "PAID",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentWorkflowStatus =
  (typeof APPOINTMENT_WORKFLOW_STATUSES)[number];

export type AppointmentStoredStatus =
  | AppointmentWorkflowStatus
  | "CHECKED_IN";

export const APPOINTMENT_VISIBLE_STATUS_ORDER: AppointmentWorkflowStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
  "COMPLETED",
  "PAID",
  "CANCELLED",
  "NO_SHOW",
];

export const APPOINTMENT_REALIZED_STATUSES: AppointmentWorkflowStatus[] = [
  "COMPLETED",
  "PAID",
];

export const APPOINTMENT_STATUS_LABELS: Record<
  AppointmentWorkflowStatus,
  string
> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  WAITING: "Aguardando",
  IN_PROGRESS: "Em Atendimento",
  COMPLETED: "Finalizado",
  PAID: "Pago",
  CANCELLED: "Cancelado",
  NO_SHOW: "Faltou",
};

export const APPOINTMENT_STATUS_BADGE_VARIANTS: Record<
  AppointmentWorkflowStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  SCHEDULED: "outline",
  CONFIRMED: "secondary",
  WAITING: "default",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
  NO_SHOW: "destructive",
};

export const APPOINTMENT_STATUS_CARD_STYLES: Record<
  AppointmentWorkflowStatus,
  { bg: string; border: string; text: string; badge: string }
> = {
  SCHEDULED: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-700",
    text: "text-blue-900 dark:text-blue-200",
    badge: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  CONFIRMED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-200",
    badge: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  },
  WAITING: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-300 dark:border-amber-700",
    text: "text-amber-900 dark:text-amber-200",
    badge: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  IN_PROGRESS: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-300 dark:border-purple-700",
    text: "text-purple-900 dark:text-purple-200",
    badge: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  COMPLETED: {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-800 dark:text-slate-200",
    badge: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
  PAID: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-300 dark:border-emerald-700",
    text: "text-emerald-900 dark:text-emerald-200",
    badge: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  },
  CANCELLED: {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-300 dark:border-red-700",
    text: "text-red-900 dark:text-red-200",
    badge: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  NO_SHOW: {
    bg: "bg-orange-50 dark:bg-orange-950/40",
    border: "border-orange-300 dark:border-orange-700",
    text: "text-orange-900 dark:text-orange-200",
    badge: "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  },
};

export const APPOINTMENT_STATUS_TRANSITIONS: Record<
  AppointmentWorkflowStatus,
  AppointmentWorkflowStatus[]
> = {
  SCHEDULED: ["CONFIRMED", "WAITING", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["WAITING", "CANCELLED", "NO_SHOW"],
  WAITING: ["CONFIRMED", "IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["PAID"],
  PAID: [],
  CANCELLED: [],
  NO_SHOW: [],
};

/**
 * Normaliza o status persistido para a nomenclatura operacional atual.
 * CHECKED_IN continua aceito no banco por compatibilidade, mas a UI e o fluxo
 * passam a tratá-lo como WAITING.
 */
export function normalizeAppointmentStatus(
  status: AppointmentStoredStatus | string
): AppointmentWorkflowStatus {
  if (status === "CHECKED_IN") {
    return "WAITING";
  }

  if (
    APPOINTMENT_WORKFLOW_STATUSES.includes(
      status as AppointmentWorkflowStatus
    )
  ) {
    return status as AppointmentWorkflowStatus;
  }

  return "SCHEDULED";
}

/**
 * Retorna o rótulo amigável do status operacional do agendamento.
 */
export function getAppointmentStatusLabel(
  status: AppointmentStoredStatus | string
) {
  return APPOINTMENT_STATUS_LABELS[normalizeAppointmentStatus(status)];
}

/**
 * Retorna as opções válidas de transição para o status atual.
 */
export function getAllowedAppointmentTransitions(
  status: AppointmentStoredStatus | string
) {
  return APPOINTMENT_STATUS_TRANSITIONS[normalizeAppointmentStatus(status)];
}

/**
 * Informa se a transição pretendida é permitida dentro do fluxo operacional.
 */
export function canTransitionAppointmentStatus(
  currentStatus: AppointmentStoredStatus | string,
  nextStatus: AppointmentStoredStatus | string
) {
  const current = normalizeAppointmentStatus(currentStatus);
  const next = normalizeAppointmentStatus(nextStatus);

  if (current === next) {
    return true;
  }

  return getAllowedAppointmentTransitions(current).includes(next);
}
