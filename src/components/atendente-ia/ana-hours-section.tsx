"use client";

import { CalendarClock } from "lucide-react";
import { AnaSectionCard } from "./ana-section-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { BOT_TIMEZONE_OPTIONS } from "@/lib/bot-config";
import { cn } from "@/lib/utils";

const timezoneOptions = BOT_TIMEZONE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const MARKERS = [0, 4, 8, 12, 16, 20, 24] as const;

function timeToPercent(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 0;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const total = hours * 60 + minutes;
  return Math.max(0, Math.min(100, (total / (24 * 60)) * 100));
}

export function AnaHoursSection({
  botIsAlwaysActive,
  botActiveStart,
  botActiveEnd,
  timezone,
  onAlwaysActiveChange,
  onStartChange,
  onEndChange,
  onTimezoneChange,
  style,
}: {
  botIsAlwaysActive: boolean;
  botActiveStart: string;
  botActiveEnd: string;
  timezone: string;
  onAlwaysActiveChange: (value: boolean) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onTimezoneChange: (value: string) => void;
  style?: React.CSSProperties;
}) {
  const startPct = botIsAlwaysActive ? 0 : timeToPercent(botActiveStart);
  const endPct = botIsAlwaysActive ? 100 : timeToPercent(botActiveEnd);
  const invalidRange =
    !botIsAlwaysActive && endPct <= startPct && botActiveStart && botActiveEnd;

  return (
    <AnaSectionCard
      icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
      title="Expediente"
      subtitle="Quando a Ana pode responder automaticamente aos clientes."
      style={style}
    >
      <label
        htmlFor="ana-always-active"
        className={cn(
          "flex cursor-pointer items-start gap-3 rounded-xl border border-primary/10 bg-background/60 p-4 transition-colors",
          botIsAlwaysActive && "border-primary/30 bg-primary/5"
        )}
      >
        <input
          id="ana-always-active"
          type="checkbox"
          checked={botIsAlwaysActive}
          onChange={(event) => onAlwaysActiveChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">Atender 24 horas</p>
          <p className="text-xs leading-5 text-muted-foreground">
            A Ana responde a qualquer horário do dia, sem intervalos.
          </p>
        </div>
      </label>

      <div className="space-y-3 rounded-xl border border-primary/10 bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Linha do tempo do dia
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {botIsAlwaysActive
              ? "00:00 — 24:00"
              : `${botActiveStart} — ${botActiveEnd}`}
          </span>
        </div>
        <div
          aria-hidden="true"
          className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className={cn(
              "absolute inset-y-0 rounded-full bg-primary transition-all duration-500 ease-out",
              botIsAlwaysActive && "animate-highlight-pulse"
            )}
            style={{
              left: `${Math.min(startPct, endPct)}%`,
              width: `${Math.max(0, Math.abs(endPct - startPct))}%`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] tabular-nums text-muted-foreground">
          {MARKERS.map((hour) => (
            <span key={hour}>{hour.toString().padStart(2, "0")}h</span>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4 md:grid-cols-3",
          botIsAlwaysActive && "pointer-events-none opacity-60"
        )}
      >
        <div className="space-y-1.5">
          <Label
            htmlFor="ana-active-start"
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            Início
          </Label>
          <Input
            id="ana-active-start"
            type="time"
            value={botActiveStart}
            onChange={(event) => onStartChange(event.target.value)}
            disabled={botIsAlwaysActive}
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="ana-active-end"
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            Fim
          </Label>
          <Input
            id="ana-active-end"
            type="time"
            value={botActiveEnd}
            onChange={(event) => onEndChange(event.target.value)}
            disabled={botIsAlwaysActive}
            className="h-10"
            aria-invalid={Boolean(invalidRange)}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="ana-timezone"
            className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
          >
            Timezone
          </Label>
          <Select
            value={timezone}
            onValueChange={(value) => onTimezoneChange(value ?? timezone)}
            disabled={botIsAlwaysActive}
          >
            <SelectTrigger id="ana-timezone" className="h-10 w-full">
              <SelectValueLabel
                value={timezone}
                options={timezoneOptions}
                placeholder="Selecione o timezone"
              />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {invalidRange && (
        <p className="text-xs text-destructive">
          O fim do atendimento precisa ser posterior ao início.
        </p>
      )}
    </AnaSectionCard>
  );
}
