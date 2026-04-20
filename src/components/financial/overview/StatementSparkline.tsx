"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Point = {
  date: string;
  count: number;
};

type Props = {
  data: Point[];
};

export function StatementSparkline({ data }: Props) {
  const hasData = data.some((point) => point.count > 0);

  if (!hasData) {
    return (
      <div className="h-[60px] w-full rounded-md border border-dashed bg-muted/30" />
    );
  }

  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Tooltip
            cursor={{ stroke: "#94a3b8", strokeDasharray: 3 }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0].payload as Point;
              let label = point.date;
              try {
                label = format(parseISO(point.date), "dd 'de' MMM", { locale: ptBR });
              } catch {}
              return (
                <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
                  <p className="capitalize text-muted-foreground">{label}</p>
                  <p className="font-medium">
                    {point.count} lançamento{point.count === 1 ? "" : "s"}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
