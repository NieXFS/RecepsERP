import { Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { RevenueGoalEditTrigger } from "./revenue-goal-edit-dialog";

type Props = {
  month: string;
  canEdit: boolean;
};

function formatMonthLabel(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1, 12, 0, 0, 0);
  const label = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function RevenueGoalEmpty({ month, canEdit }: Props) {
  return (
    <section aria-label="Meta de faturamento não definida">
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">
              Defina a meta de faturamento de {formatMonthLabel(month)}
            </h3>
            <p className="text-xs text-muted-foreground">
              Acompanhe realizado, projeção e ritmo diário para fechar o mês no alvo.
            </p>
          </div>
          {canEdit ? (
            <RevenueGoalEditTrigger
              month={month}
              currentTarget={null}
              variant="empty"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Apenas usuários com permissão de edição no Financeiro podem definir a meta.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
