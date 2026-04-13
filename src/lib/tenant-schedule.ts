export const DEFAULT_TENANT_SCHEDULE = {
  openingTime: "08:00",
  closingTime: "20:00",
  slotIntervalMinutes: 30,
} as const;

export const TENANT_SLOT_INTERVAL_OPTIONS = [15, 30, 60] as const;
export const CALENDAR_SLOT_HEIGHT_PX = 48;

export type TenantSlotIntervalMinutes =
  (typeof TENANT_SLOT_INTERVAL_OPTIONS)[number];

export type TenantScheduleConfig = {
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: number;
};

export type TenantTimeSlot = {
  hour: number;
  minute: number;
  minutes: number;
  label: string;
};

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeString(value: string) {
  return TIME_PATTERN.test(value);
}

export function parseTimeStringToMinutes(value: string) {
  if (!isValidTimeString(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTimeString(totalMinutes: number) {
  const normalized = Math.max(0, totalMinutes);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeTenantScheduleConfig(
  config?: Partial<TenantScheduleConfig> | null
): TenantScheduleConfig {
  const slotIntervalMinutes = TENANT_SLOT_INTERVAL_OPTIONS.includes(
    config?.slotIntervalMinutes as TenantSlotIntervalMinutes
  )
    ? (config?.slotIntervalMinutes as TenantSlotIntervalMinutes)
    : DEFAULT_TENANT_SCHEDULE.slotIntervalMinutes;

  const openingTime = isValidTimeString(config?.openingTime ?? "")
    ? (config?.openingTime as string)
    : DEFAULT_TENANT_SCHEDULE.openingTime;

  const closingTime = isValidTimeString(config?.closingTime ?? "")
    ? (config?.closingTime as string)
    : DEFAULT_TENANT_SCHEDULE.closingTime;

  const openingMinutes =
    parseTimeStringToMinutes(openingTime) ??
    parseTimeStringToMinutes(DEFAULT_TENANT_SCHEDULE.openingTime)!;
  const closingMinutes =
    parseTimeStringToMinutes(closingTime) ??
    parseTimeStringToMinutes(DEFAULT_TENANT_SCHEDULE.closingTime)!;

  if (closingMinutes <= openingMinutes) {
    return {
      openingTime,
      closingTime: DEFAULT_TENANT_SCHEDULE.closingTime,
      slotIntervalMinutes,
    };
  }

  return {
    openingTime,
    closingTime,
    slotIntervalMinutes,
  };
}

export function getTenantScheduleBounds(config: TenantScheduleConfig) {
  const normalized = normalizeTenantScheduleConfig(config);

  return {
    startMinutes:
      parseTimeStringToMinutes(normalized.openingTime) ??
      parseTimeStringToMinutes(DEFAULT_TENANT_SCHEDULE.openingTime)!,
    endMinutes:
      parseTimeStringToMinutes(normalized.closingTime) ??
      parseTimeStringToMinutes(DEFAULT_TENANT_SCHEDULE.closingTime)!,
  };
}

export function generateTimeSlots(config: TenantScheduleConfig): TenantTimeSlot[] {
  const normalized = normalizeTenantScheduleConfig(config);
  const { startMinutes, endMinutes } = getTenantScheduleBounds(normalized);
  const slots: TenantTimeSlot[] = [];

  for (
    let currentMinutes = startMinutes;
    currentMinutes < endMinutes;
    currentMinutes += normalized.slotIntervalMinutes
  ) {
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    slots.push({
      hour,
      minute,
      minutes: currentMinutes,
      label: formatMinutesToTimeString(currentMinutes),
    });
  }

  return slots;
}

export function generateHeatmapHours(config: TenantScheduleConfig) {
  const normalized = normalizeTenantScheduleConfig(config);
  const { startMinutes, endMinutes } = getTenantScheduleBounds(normalized);
  const startHour = Math.floor(startMinutes / 60);
  const endHour = Math.floor(endMinutes / 60);

  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
}
