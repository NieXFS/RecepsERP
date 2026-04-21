import type { CashSessionHistoryFilters } from "@/services/cash-register.service";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 200;

export type CashHistorySearchParams = {
  account?: string | string[];
  from?: string | string[];
  to?: string | string[];
  limit?: string | string[];
};

export type ParsedHistoryFilters = Required<Pick<CashSessionHistoryFilters, "from" | "to" | "limit">> & {
  accountId?: string;
  fromInput: string;
  toInput: string;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseCivilDate(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function formatCivilInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function parseHistoryFilters(
  params: CashHistorySearchParams | undefined
): ParsedHistoryFilters {
  const rawAccount = firstValue(params?.account)?.trim();
  const rawFrom = firstValue(params?.from)?.trim();
  const rawTo = firstValue(params?.to)?.trim();
  const rawLimit = firstValue(params?.limit)?.trim();

  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - DEFAULT_WINDOW_DAYS);
  defaultFrom.setHours(0, 0, 0, 0);

  const defaultTo = endOfDay(now);

  let from = rawFrom ? parseCivilDate(rawFrom) : null;
  let to = rawTo ? parseCivilDate(rawTo) : null;

  if (from && to && from.getTime() > to.getTime()) {
    from = null;
    to = null;
  }

  const resolvedFrom = from ?? defaultFrom;
  const resolvedTo = to ? endOfDay(to) : defaultTo;

  let limit = DEFAULT_LIMIT;
  if (rawLimit) {
    const parsed = Number.parseInt(rawLimit, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(parsed, MAX_LIMIT);
    }
  }

  return {
    accountId: rawAccount && rawAccount.length > 0 ? rawAccount : undefined,
    from: resolvedFrom,
    to: resolvedTo,
    limit,
    fromInput: from ? formatCivilInput(from) : "",
    toInput: to ? formatCivilInput(to) : "",
  };
}

export const CASH_HISTORY_DEFAULT_LIMIT = DEFAULT_LIMIT;
export const CASH_HISTORY_MAX_LIMIT = MAX_LIMIT;
export const CASH_HISTORY_PAGE_STEP = 20;
