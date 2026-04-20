"use client";

import { UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Item = {
  id: string;
  name: string;
  revenue: number;
  appointmentCount: number;
};

type Props = {
  items: Item[];
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function TopProfessionalsCard({ items }: Props) {
  const max = items.reduce((acc, item) => (item.revenue > acc ? item.revenue : acc), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-primary" aria-hidden="true" />
          Top 5 profissionais
        </CardTitle>
        <CardDescription>Receita gerada por agendamentos pagos no período.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Sem dados no período. Registre agendamentos pagos para ver o ranking.
          </div>
        ) : (
          <ol className="space-y-4">
            {items.map((item, index) => {
              const percent = max > 0 ? (item.revenue / max) * 100 : 0;
              return (
                <li key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.appointmentCount} agendamento{item.appointmentCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(4, percent)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
