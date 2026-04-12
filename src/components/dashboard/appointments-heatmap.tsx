import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppointmentsHeatmap } from "@/services/dashboard.service";
import { cn } from "@/lib/utils";

function getHeatmapColor(count: number, maxCount: number) {
  if (count === 0 || maxCount === 0) {
    return "bg-muted/20 text-muted-foreground/50";
  }

  const ratio = count / maxCount;

  if (ratio <= 0.25) {
    return "bg-emerald-500/30 text-emerald-200";
  }

  if (ratio <= 0.5) {
    return "bg-amber-500/50 text-amber-100";
  }

  if (ratio <= 0.75) {
    return "bg-orange-500/80 text-white";
  }

  return "bg-rose-600 text-white shadow-sm";
}

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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor de Agendamentos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Descubra os horários e dias da semana com maior pico de movimento no período
          selecionado.
        </p>
        <p className="text-xs text-muted-foreground">
          Faixa analisada: 08h às 20h · {heatmap.totalAppointments} agendamento(s)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <div className="w-full rounded-xl border border-border/70 bg-background/70 p-3">
            <div
              className="grid w-full gap-2"
              style={{
                gridTemplateColumns: `minmax(40px, auto) repeat(${heatmap.hours.length}, minmax(0, 1fr))`,
              }}
            >
              <div aria-hidden="true" className="h-10" />
              {heatmap.hours.map((hour) => (
                <div
                  key={hour}
                  className="flex h-10 w-full items-center justify-center text-center text-xs font-medium text-muted-foreground tabular-nums"
                >
                  {String(hour).padStart(2, "0")}h
                </div>
              ))}

              {heatmap.days.map((day) => (
                <div key={day.dayOfWeek} className="contents">
                  <div className="flex h-10 min-w-[40px] items-center justify-end pr-2 text-right text-sm font-medium text-muted-foreground">
                    {day.label}
                  </div>
                  {day.slots.map((slot) => {
                    const title = formatSlotTitle(day.label, slot.hour, slot.count);

                    return (
                      <div
                        key={`${day.dayOfWeek}-${slot.hour}`}
                        title={title}
                        aria-label={title}
                        className={cn(
                          "flex h-10 w-full items-center justify-center rounded-md p-0 text-center text-xs font-semibold tabular-nums transition-all duration-200 hover:z-10 hover:scale-110 cursor-default",
                          getHeatmapColor(slot.count, heatmap.maxCount)
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
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span>Frio</span>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm border border-background bg-emerald-500 dark:bg-emerald-600" />
              <span className="h-3 w-3 rounded-sm border border-background bg-green-400 dark:bg-green-500" />
              <span className="h-3 w-3 rounded-sm border border-background bg-yellow-400 dark:bg-yellow-500" />
              <span className="h-3 w-3 rounded-sm border border-background bg-orange-500" />
              <span className="h-3 w-3 rounded-sm border border-background bg-red-600" />
            </div>
            <span>Quente</span>
          </div>
          <p>
            Pico do período:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {heatmap.maxCount}
            </span>{" "}
            agendamento(s) no mesmo horário
          </p>
        </div>

        {heatmap.totalAppointments === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhum agendamento foi encontrado no período selecionado.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
