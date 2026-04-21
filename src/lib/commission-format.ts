import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Monta a descrição padrão de uma Transaction originada num acerto de comissão.
 * Formato: "Acerto de comissão — {profissional} — dd/MM a dd/MM/yyyy".
 * Se periodStart e periodEnd caem no mesmo dia, usa "dd/MM/yyyy" apenas.
 */
export function buildPayoutDescription(
  professionalName: string,
  periodStart: Date,
  periodEnd: Date
): string {
  const name = professionalName.trim() || "Profissional";
  if (isSameDay(periodStart, periodEnd)) {
    const single = format(periodEnd, "dd/MM/yyyy", { locale: ptBR });
    return `Acerto de comissão — ${name} — ${single}`;
  }
  const startLabel = format(periodStart, "dd/MM", { locale: ptBR });
  const endLabel = format(periodEnd, "dd/MM/yyyy", { locale: ptBR });
  return `Acerto de comissão — ${name} — ${startLabel} a ${endLabel}`;
}
