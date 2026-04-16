"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TenantBusinessSegment } from "@/generated/prisma/enums";
import { getBusinessSegment } from "@/lib/business-segments";
import { saveSetupProfessionalAction } from "@/actions/setup.actions";

type InitialData = {
  specialty: string;
  registrationNumber: string;
  commissionPercent: number;
};

export function StepProfessional({
  initialData,
  defaultSpecialtyFromSegment,
  onSaved,
  onBack,
}: {
  initialData?: InitialData;
  defaultSpecialtyFromSegment: TenantBusinessSegment | null;
  onSaved: () => void;
  onBack: () => void;
}) {
  const fallbackSpecialty = defaultSpecialtyFromSegment
    ? getBusinessSegment(defaultSpecialtyFromSegment).sampleProfessionalSpecialty
    : "";

  const [specialty, setSpecialty] = useState(initialData?.specialty || fallbackSpecialty);
  const [registrationNumber, setRegistrationNumber] = useState(initialData?.registrationNumber ?? "");
  const [commissionPercent, setCommissionPercent] = useState(initialData?.commissionPercent ?? 0);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await saveSetupProfessionalAction({
        specialty,
        registrationNumber,
        commissionPercent,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Profissional salvo.");
      onSaved();
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Quem vai atender os clientes?</h2>
        <p className="text-sm text-muted-foreground">
          Você será cadastrado como o primeiro profissional da equipe. Depois você pode adicionar outros membros em <strong>Profissionais</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="specialty">Especialidade</Label>
          <Input
            id="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Ex: Esteticista, Cabeleireira, Dentista..."
          />
          <p className="text-xs text-muted-foreground">
            Aparece no perfil do profissional e nos agendamentos.
          </p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="registration">Registro profissional (opcional)</Label>
          <Input
            id="registration"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Ex: CRO-SP 12345"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="commission">Comissão padrão (%)</Label>
          <Input
            id="commission"
            type="number"
            min={0}
            max={100}
            step={1}
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(Number(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            Use 0 se você atende sozinho ou define comissão por serviço.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
          Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleSubmit}
          disabled={isPending || specialty.trim().length < 2}
        >
          {isPending ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
