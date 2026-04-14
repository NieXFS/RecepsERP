export type CivilDate = {
  year: number;
  month: number;
  day: number;
};

export type CivilMonth = {
  year: number;
  month: number;
};

const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Converte um valor arbitrário no formato YYYY-MM-DD em uma data civil válida.
 * Não usa `new Date("YYYY-MM-DD")` para evitar deslocamentos implícitos de UTC.
 */
export function parseCivilDate(value?: string | string[] | null): CivilDate | null {
  const normalized = Array.isArray(value) ? value[0] : value;

  if (!normalized) {
    return null;
  }

  const match = CIVIL_DATE_PATTERN.exec(normalized.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const probe = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() !== month - 1 ||
    probe.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/**
 * Extrai a data civil local de um objeto Date já existente.
 */
export function getCivilDateFromDate(date: Date): CivilDate {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

/**
 * Retorna a data civil de hoje no timezone local do runtime.
 */
export function getTodayCivilDate(now = new Date()): CivilDate {
  return getCivilDateFromDate(now);
}

/**
 * Extrai apenas ano e mês de um objeto Date local.
 */
export function getCivilMonthFromDate(date: Date): CivilMonth {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

/**
 * Retorna o mês civil atual no timezone local do runtime.
 */
export function getTodayCivilMonth(now = new Date()): CivilMonth {
  return getCivilMonthFromDate(now);
}

/**
 * Resolve o query param `date` da agenda para uma data civil estável.
 * Se o valor for inválido ou ausente, usa o dia atual local.
 */
export function parseCivilDateFromQuery(value?: string | string[]): CivilDate {
  return parseCivilDate(value) ?? getTodayCivilDate();
}

/**
 * Formata a data civil para o query string estável YYYY-MM-DD.
 */
export function formatCivilDateToQuery(date: CivilDate): string {
  return `${String(date.year).padStart(4, "0")}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

/**
 * Materializa uma data civil em um Date local com horário explícito.
 * O horário padrão 12:00 evita ambiguidades na navegação e formatação.
 */
export function civilDateToLocalDate(
  date: CivilDate,
  options: {
    hour?: number;
    minute?: number;
    second?: number;
    millisecond?: number;
  } = {}
): Date {
  const {
    hour = 12,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = options;

  return new Date(date.year, date.month - 1, date.day, hour, minute, second, millisecond);
}

/**
 * Soma ou subtrai dias sobre a data civil sem depender de parsing ISO ambíguo.
 */
export function addDaysToCivilDate(date: CivilDate, offset: number): CivilDate {
  const shifted = civilDateToLocalDate(date);
  shifted.setDate(shifted.getDate() + offset);
  return getCivilDateFromDate(shifted);
}

/**
 * Monta o intervalo local [início do dia, próximo dia) para consultas do banco.
 */
export function getCivilDayRange(date: CivilDate) {
  const start = civilDateToLocalDate(date, {
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const endExclusive = civilDateToLocalDate(addDaysToCivilDate(date, 1), {
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });

  return { start, endExclusive };
}

/**
 * Resolve mês/ano vindos da URL para um período civil estável.
 * Se o valor for inválido ou ausente, usa o mês atual local.
 */
export function parseCivilMonthFromQuery(
  monthValue?: string | string[],
  yearValue?: string | string[]
): CivilMonth {
  const normalizedMonth = Array.isArray(monthValue) ? monthValue[0] : monthValue;
  const normalizedYear = Array.isArray(yearValue) ? yearValue[0] : yearValue;

  const today = getTodayCivilMonth();
  const month = Number(normalizedMonth);
  const year = Number(normalizedYear);

  if (
    Number.isInteger(month) &&
    Number.isInteger(year) &&
    month >= 1 &&
    month <= 12 &&
    year >= 2000 &&
    year <= 2100
  ) {
    return { month, year };
  }

  return today;
}

/**
 * Retorna o intervalo local [início do mês, próximo mês) para consultas do banco.
 */
export function getCivilMonthRange(month: CivilMonth) {
  const start = new Date(month.year, month.month - 1, 1, 0, 0, 0, 0);
  const endExclusive = new Date(month.year, month.month, 1, 0, 0, 0, 0);

  return { start, endExclusive };
}

/**
 * Soma ou subtrai meses sobre um período civil sem depender de parsing ISO.
 */
export function addMonthsToCivilMonth(period: CivilMonth, offset: number): CivilMonth {
  const shifted = new Date(period.year, period.month - 1, 1, 12, 0, 0, 0);
  shifted.setMonth(shifted.getMonth() + offset);

  return getCivilMonthFromDate(shifted);
}

/**
 * Retorna a quantidade de dias do mês civil informado.
 */
export function getDaysInCivilMonth(period: CivilMonth): number {
  return new Date(period.year, period.month, 0).getDate();
}

/**
 * Formata o rótulo do mês por extenso com base no timezone local.
 */
export function formatCivilMonthLabel(
  period: CivilMonth,
  locale = "pt-BR",
  options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  }
) {
  return new Date(period.year, period.month - 1, 1, 12, 0, 0, 0).toLocaleDateString(
    locale,
    options
  );
}

/**
 * Formata a data civil para o cabeçalho da agenda com base no timezone local.
 */
export function formatCivilDateLabel(
  date: CivilDate,
  locale = "pt-BR",
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }
) {
  return civilDateToLocalDate(date).toLocaleDateString(locale, options);
}
