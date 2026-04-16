"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BUSINESS_SEGMENT_DEFINITIONS,
  getBusinessSegment,
  type StarterService,
} from "@/lib/business-segments";
import type { TenantBusinessSegment } from "@/generated/prisma/enums";
import { saveSetupSegmentAndServicesAction } from "@/actions/setup.actions";

type DraftService = {
  key: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
};

function toDraft(starter: StarterService, index: number): DraftService {
  return {
    key: `starter-${index}-${starter.name}`,
    name: starter.name,
    durationMinutes: starter.durationMinutes,
    price: starter.price,
    description: starter.description ?? "",
  };
}

function randomKey() {
  return `svc-${Math.random().toString(36).slice(2, 10)}`;
}

export function StepSegmentAndServices({
  initialSegment,
  onSaved,
}: {
  initialSegment: TenantBusinessSegment | null;
  onSaved: () => void;
}) {
  const [segment, setSegment] = useState<TenantBusinessSegment | null>(initialSegment);
  const [services, setServices] = useState<DraftService[]>(() =>
    initialSegment
      ? [...getBusinessSegment(initialSegment).starterServices].map(toDraft)
      : []
  );
  const [isPending, startTransition] = useTransition();

  // Ao trocar segmento, substituímos a lista pelas sugestões correspondentes.
  useEffect(() => {
    if (!segment) return;
    setServices([...getBusinessSegment(segment).starterServices].map(toDraft));
  }, [segment]);

  const canSubmit = useMemo(
    () => Boolean(segment) && services.length > 0 && services.every((s) => s.name.trim().length > 1),
    [segment, services]
  );

  const updateService = (key: string, patch: Partial<DraftService>) => {
    setServices((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const removeService = (key: string) => {
    setServices((prev) => prev.filter((s) => s.key !== key));
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      { key: randomKey(), name: "", durationMinutes: 60, price: 0, description: "" },
    ]);
  };

  const handleSubmit = () => {
    if (!segment) {
      toast.error("Selecione um segmento primeiro.");
      return;
    }

    startTransition(async () => {
      const result = await saveSetupSegmentAndServicesAction({
        segment,
        services: services.map((s) => ({
          name: s.name,
          durationMinutes: s.durationMinutes,
          price: s.price,
          description: s.description,
        })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const n = result.data.servicesCreated;
      toast.success(
        n === 0
          ? "Segmento salvo! Serviços já existiam."
          : `${n} ${n === 1 ? "serviço cadastrado" : "serviços cadastrados"}.`
      );
      onSaved();
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Que tipo de negócio você atende?</h2>
        <p className="text-sm text-muted-foreground">
          Escolha o segmento que mais se aproxima — vamos sugerir 3 serviços iniciais que você pode editar ou remover.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Segmento de negócio"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {BUSINESS_SEGMENT_DEFINITIONS.map((def) => {
          const active = segment === def.key;
          return (
            <button
              key={def.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSegment(def.key)}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-lg border bg-background p-3 text-left transition-all hover:border-primary/60 hover:shadow-sm",
                active && "border-primary ring-2 ring-primary/30"
              )}
            >
              <span className="text-2xl" aria-hidden>
                {def.emoji}
              </span>
              <span className="text-sm font-semibold leading-tight">{def.label}</span>
              <span className="text-xs text-muted-foreground leading-snug">
                {def.description}
              </span>
            </button>
          );
        })}
      </div>

      {segment && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold">Seus primeiros serviços</h3>
              <p className="text-xs text-muted-foreground">
                Edite, remova ou adicione. Você pode ajustar tudo depois em Serviços.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addService}
              disabled={services.length >= 10}
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3">
            {services.map((svc) => (
              <div
                key={svc.key}
                className="grid grid-cols-12 gap-3 rounded-lg border bg-muted/20 p-3"
              >
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <Label htmlFor={`${svc.key}-name`} className="text-xs">
                    Nome
                  </Label>
                  <Input
                    id={`${svc.key}-name`}
                    value={svc.name}
                    onChange={(e) => updateService(svc.key, { name: e.target.value })}
                    placeholder="Ex: Corte masculino"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3 space-y-1">
                  <Label htmlFor={`${svc.key}-dur`} className="text-xs">
                    Duração (min)
                  </Label>
                  <Input
                    id={`${svc.key}-dur`}
                    type="number"
                    min={5}
                    max={600}
                    step={5}
                    value={svc.durationMinutes}
                    onChange={(e) =>
                      updateService(svc.key, {
                        durationMinutes: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="col-span-6 sm:col-span-3 space-y-1">
                  <Label htmlFor={`${svc.key}-price`} className="text-xs">
                    Preço (R$)
                  </Label>
                  <Input
                    id={`${svc.key}-price`}
                    type="number"
                    min={0}
                    step={1}
                    value={svc.price}
                    onChange={(e) =>
                      updateService(svc.key, {
                        price: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="col-span-12 sm:col-span-1 flex items-end justify-end">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeService(svc.key)}
                    aria-label={`Remover ${svc.name || "serviço"}`}
                    disabled={services.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                {svc.description !== undefined && (
                  <div className="col-span-12 space-y-1">
                    <Label htmlFor={`${svc.key}-desc`} className="text-xs">
                      Descrição (opcional)
                    </Label>
                    <Textarea
                      id={`${svc.key}-desc`}
                      value={svc.description ?? ""}
                      onChange={(e) =>
                        updateService(svc.key, { description: e.target.value })
                      }
                      rows={2}
                      placeholder="Observações sobre o serviço..."
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit || isPending}
        >
          {isPending ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </div>
  );
}
