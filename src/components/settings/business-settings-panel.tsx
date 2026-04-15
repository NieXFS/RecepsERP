"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Clock3, Save } from "lucide-react";
import { toast } from "sonner";
import { updateTenantSettingsAction } from "@/actions/tenant-settings.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { TENANT_SLOT_INTERVAL_OPTIONS } from "@/lib/tenant-schedule";

type BusinessSettings = {
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  openingTime: string;
  closingTime: string;
  slotIntervalMinutes: number;
};

const intervalOptions = TENANT_SLOT_INTERVAL_OPTIONS.map((value) => ({
  value: String(value),
  label: `${value} minutos`,
}));

export function BusinessSettingsPanel({
  settings,
}: {
  settings: BusinessSettings;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [email, setEmail] = useState(settings.email ?? "");
  const [openingTime, setOpeningTime] = useState(settings.openingTime);
  const [closingTime, setClosingTime] = useState(settings.closingTime);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(
    String(settings.slotIntervalMinutes)
  );

  useEffect(() => {
    setName(settings.name);
    setPhone(settings.phone ?? "");
    setEmail(settings.email ?? "");
    setOpeningTime(settings.openingTime);
    setClosingTime(settings.closingTime);
    setSlotIntervalMinutes(String(settings.slotIntervalMinutes));
  }, [settings]);

  const schedulePreview = useMemo(
    () =>
      `${openingTime || "--:--"} às ${closingTime || "--:--"} · ${
        slotIntervalMinutes || "--"
      } min`,
    [closingTime, openingTime, slotIntervalMinutes]
  );

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateTenantSettingsAction({
        name,
        phone,
        email,
        openingTime,
        closingTime,
        slotIntervalMinutes: Number(slotIntervalMinutes),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Configurações do negócio atualizadas com sucesso.");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Dados do Negócio
          </CardTitle>
          <CardDescription>
            Atualize os dados principais do estabelecimento e defina como a agenda deve
            operar em todo o ERP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-name">Nome do estabelecimento</Label>
                <Input
                  id="tenant-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Clínica Bella"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-cnpj">CNPJ</Label>
                <Input
                  id="tenant-cnpj"
                  value={settings.cnpj ?? ""}
                  readOnly
                  disabled
                  placeholder="CNPJ cadastrado no onboarding"
                />
                <p className="text-xs text-muted-foreground">
                  Para alterar o CNPJ, fale com o suporte da Receps.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-phone">Telefone</Label>
                <Input
                  id="tenant-phone"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-email">Email</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="contato@estabelecimento.com.br"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
            <div>
              <h3 className="text-sm font-semibold">Expediente & Agenda</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Esses horários alimentam a agenda diária, a disponibilidade pública e o
                mapa de calor do dashboard.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-opening-time">Abertura</Label>
                <Input
                  id="tenant-opening-time"
                  type="time"
                  value={openingTime}
                  onChange={(event) => setOpeningTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-closing-time">Fechamento</Label>
                <Input
                  id="tenant-closing-time"
                  type="time"
                  value={closingTime}
                  onChange={(event) => setClosingTime(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-slot-interval">Intervalo da Agenda</Label>
                <Select
                  value={slotIntervalMinutes}
                  onValueChange={(value) =>
                    setSlotIntervalMinutes(
                      value ?? String(settings.slotIntervalMinutes)
                    )
                  }
                >
                  <SelectTrigger id="tenant-slot-interval" className="w-full">
                    <SelectValueLabel
                      value={slotIntervalMinutes}
                      options={intervalOptions}
                      placeholder="Selecione"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
              <Save className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Preview Operacional
          </CardTitle>
          <CardDescription>
            Confira rapidamente como o expediente atual será refletido nas principais
            telas do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Funcionamento
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{schedulePreview}</p>
          </div>

          <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium">Agenda diária</p>
              <p className="text-sm text-muted-foreground">
                Os slots serão gerados com base no horário de abertura, fechamento e no
                intervalo escolhido.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Dashboard & BI</p>
              <p className="text-sm text-muted-foreground">
                O heatmap de agendamentos passará a usar exatamente a mesma faixa horária
                do negócio.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Disponibilidade pública</p>
              <p className="text-sm text-muted-foreground">
                O bot e os fluxos externos só oferecerão horários dentro desse expediente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
