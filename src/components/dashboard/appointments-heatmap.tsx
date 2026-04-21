import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentsHeatmap } from "@/services/dashboard.service";

/** Retorna o nível 0..4 para o valor dentro da escala do heatmap. */
function heatLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount === 0) return 0;
  const ratio = count / maxCount;
  if (ratio >= 0.99) return 4;
  if (ratio >= 0.75) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}

const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-primary/5 text-muted-foreground/60",
  1: "bg-primary/20 text-foreground/85 dark:text-foreground",
  2: "bg-primary/45 text-primary-foreground",
  3: "bg-primary text-primary-foreground shadow-md shadow-primary/30",
  4: "bg-primary text-primary-foreground shadow-lg shadow-primary/45",
};

function formatSlotTitle(dayLabel: string, hour: number, count: number) {
  const hourLabel = `${String(hour).padStart(2, "0")}h`;
  const appointmentLabel = count === 1 ? "agendamento" : "agendamentos";
  return count === 0
    ? `Nenhum agendamento em ${dayLabel} às ${hourLabel}`
    : `${count} ${appointmentLabel} em ${dayLabel} às ${hourLabel}`;
}

export function AppointmentsHeatmap({
  heatmap,
}: {
  heatmap: AppointmentsHeatmap;
}) {
  const gridTemplate = `46px repeat(${heatmap.hours.length}, minmax(52px, 1fr))`;

  return (
    <section
      className={cn(
        "rounded-[22px] bg-card px-7 pb-5 pt-[26px]",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]"
      )}
    >
      {/* header */}
      <div className="mb-5 flex flex-col items-start justify-between gap-5 md:flex-row">
        <div>
          <h3 className="text-[19px] font-extrabold tracking-[-0.025em] text-foreground">
            Mapa de calor de agendamentos
          </h3>
          <p className="mt-1.5 max-w-[540px] text-[13px] leading-[1.5] text-muted-foreground">
            Descubra os horários e dias da semana com maior pico de movimento no período selecionado.
          </p>
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            Faixa analisada:{" "}
            <b className="font-bold text-foreground tabular-nums">
              {heatmap.openingTime} às {heatmap.closingTime}
            </b>{" "}
            · {heatmap.totalAppointments} agendamento(s)
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Pico:{" "}
          <b className="ml-0.5 font-bold text-foreground tabular-nums">
            {heatmap.maxCount} agendamento{heatmap.maxCount === 1 ? "" : "s"}
          </b>
        </div>
      </div>

      {/* grid */}
      <div className="overflow-x-auto pb-1.5">
        <div
          className="grid min-w-[820px] gap-1.5"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {/* header row: corner + hour labels */}
          <div aria-hidden="true" />
          {heatmap.hours.map((hour) => (
            <div
              key={hour}
              className="flex items-end justify-center pb-1 text-[11.5px] font-semibold tabular-nums text-muted-foreground"
            >
              {String(hour).padStart(2, "0")}h
            </div>
          ))}

          {/* body rows */}
          {heatmap.days.map((day) => (
            <div key={day.dayOfWeek} className="contents">
              <div className="flex items-center pr-1.5 text-[12px] font-bold text-foreground">
                {day.label}
              </div>
              {day.slots.map((slot) => {
                const title = formatSlotTitle(day.label, slot.hour, slot.count);
                const level = heatLevel(slot.count, heatmap.maxCount);
                return (
                  <div
                    key={`${day.dayOfWeek}-${slot.hour}`}
                    title={title}
                    aria-label={title}
                    className={cn(
                      "relative grid aspect-[1.15/1] min-h-[38px] place-items-center rounded-[10px] text-[12px] font-semibold tabular-nums",
                      "cursor-default transition-all duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                      "hover:z-[2] hover:scale-[1.08] hover:shadow-lg hover:shadow-primary/25",
                      LEVEL_CLASSES[level]
                    )}
                  >
                    <span className="sr-only">{title}</span>
                    {slot.count}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-5 pt-4 text-[12.5px] text-muted-foreground">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-medium">
          <span>Frio</span>
          <span className="h-3.5 w-3.5 rounded bg-primary/5" />
          <span className="h-3.5 w-3.5 rounded bg-primary/22" />
          <span className="h-3.5 w-3.5 rounded bg-primary/45" />
          <span className="h-3.5 w-3.5 rounded bg-primary" />
          <span className="h-3.5 w-3.5 rounded bg-primary brightness-75" />
          <span>Quente</span>
        </div>
        <div className="text-[12.5px]">
          Pico do período:{" "}
          <b className="font-bold text-foreground tabular-nums">
            {heatmap.maxCount} agendamento(s)
          </b>{" "}
          no mesmo horário
        </div>
      </div>

      {heatmap.totalAppointments === 0 ? (
        <p className="mt-3 text-[12px] text-muted-foreground">
          Nenhum agendamento foi encontrado no período selecionado.
        </p>
      ) : null}
    </section>
  );
}
