"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TENANT_SLOT_INTERVAL_OPTIONS } from "@/lib/tenant-schedule";
import { saveSetupBusinessHoursAction } from "@/actions/setup.actions";

type InitialData = {
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: number;
};

export function StepBusinessHours({
  initialData,
  onSaved,
  onBack,
}: {
  initialData: InitialData;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [openingTime, setOpeningTime] = useState(initialData.openingTime);
  const [closingTime, setClosingTime] = useState(initialData.closingTime);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState<number>(
    initialData.slotIntervalMinutes
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await saveSetupBusinessHoursAction({
        openingTime,
        closingTime,
        slotIntervalMinutes,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Horário atualizado.");
      onSaved();
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Qual o horário de funcionamento?</h2>
        <p className="text-sm text-muted-foreground">
          Esse horário vai definir quando a agenda permite agendamentos. Você pode ajustar dias específicos depois.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="opening">Abre às</Label>
          <Input
            id="opening"
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="closing">Fecha às</Label>
          <Input
            id="closing"
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
          />
        </div>
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label htmlFor="slot">Intervalo da agenda</Label>
          <Select
            value={String(slotIntervalMinutes)}
            onValueChange={(v) => setSlotIntervalMinutes(Number(v))}
          >
            <SelectTrigger id="slot">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TENANT_SLOT_INTERVAL_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt} minutos
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
        Dica: comece simples. Se você atende de terça a sábado, por exemplo, pode configurar dias bloqueados depois em Configurações → Negócio.
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
          Voltar
        </Button>
        <Button type="button" size="lg" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
