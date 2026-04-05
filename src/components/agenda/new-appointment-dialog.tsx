"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { createAppointmentAction } from "@/actions/appointment.actions";
import type {
  CalendarProfessional,
  CalendarService,
  CalendarCustomer,
  CalendarResource,
} from "./types";

type NewAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Profissional pré-selecionado (coluna clicada no grid) */
  professional: CalendarProfessional | null;
  /** Horário pré-selecionado (slot clicado no grid) */
  startTime: Date | null;
  /** Dados disponíveis para o formulário */
  services: CalendarService[];
  customers: CalendarCustomer[];
  rooms: CalendarResource[];
  equipment: CalendarResource[];
};

/**
 * Modal de criação de agendamento.
 * Pré-preenche profissional e horário com base no slot clicado na agenda.
 * Filtra serviços pelos que o profissional selecionado pode realizar.
 * Usa useTransition para loading state e mantém o modal aberto em caso de erro.
 */
export function NewAppointmentDialog({
  open,
  onOpenChange,
  professional,
  startTime,
  services,
  customers,
  rooms,
  equipment,
}: NewAppointmentDialogProps) {
  const [isPending, startTransition] = useTransition();

  // Estado do formulário
  const [customerId, setCustomerId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [roomId, setRoomId] = useState("");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Filtra serviços pelos que o profissional pode fazer
  const availableServices = useMemo(() => {
    if (!professional) return services;
    return services.filter((s) => professional.serviceIds.includes(s.id));
  }, [professional, services]);

  // Filtra clientes pelo campo de busca
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 20);
    const search = customerSearch.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          (c.phone && c.phone.includes(search))
      )
      .slice(0, 20);
  }, [customers, customerSearch]);

  // Calcula duração total e preço estimado dos serviços selecionados
  const { totalDuration, totalPrice } = useMemo(() => {
    let duration = 0;
    let price = 0;
    for (const sid of selectedServiceIds) {
      const svc = services.find((s) => s.id === sid);
      if (svc) {
        duration += svc.durationMinutes;
        price += svc.price;
      }
    }
    return { totalDuration: duration, totalPrice: price };
  }, [selectedServiceIds, services]);

  // Horário formatado para exibição
  const startTimeFormatted = startTime
    ? `${String(startTime.getHours()).padStart(2, "0")}:${String(startTime.getMinutes()).padStart(2, "0")}`
    : "--:--";

  const endTime = startTime
    ? new Date(startTime.getTime() + totalDuration * 60 * 1000)
    : null;
  const endTimeFormatted = endTime
    ? `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`
    : "--:--";

  /** Reseta todos os campos do formulário */
  function resetForm() {
    setCustomerId("");
    setSelectedServiceIds([]);
    setRoomId("");
    setSelectedEquipmentIds([]);
    setNotes("");
    setCustomerSearch("");
  }

  /** Toggle de seleção de serviço (multiselect via checkboxes) */
  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  /** Toggle de equipamento selecionado */
  function toggleEquipment(equipmentId: string) {
    setSelectedEquipmentIds((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId]
    );
  }

  /**
   * Submete o agendamento via Server Action.
   * Usa useTransition para exibir loading e manter o modal aberto em caso de erro.
   */
  function handleSubmit() {
    if (!customerId || selectedServiceIds.length === 0 || !startTime || !professional) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    startTransition(async () => {
      const result = await createAppointmentAction({
        customerId,
        professionalId: professional.id,
        serviceIds: selectedServiceIds,
        startTime: startTime.toISOString(),
        roomId: roomId || null,
        equipmentIds: selectedEquipmentIds,
        notes: notes || undefined,
      });

      if (!result.success) {
        // Exibe erro em toast vermelho — modal permanece aberto para correção
        toast.error(result.error);
        return;
      }

      toast.success("Agendamento criado com sucesso!");
      resetForm();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isPending) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            {professional?.name && (
              <span>
                Profissional: <strong>{professional.name}</strong>
                {professional.specialty && ` · ${professional.specialty}`}
                {" · "}
              </span>
            )}
            Horário: <strong>{startTimeFormatted}</strong>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-5 py-2">
            {/* ---- BUSCA DE CLIENTE ---- */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
              {/* Lista de resultados filtrados */}
              {filteredCustomers.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-md border">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCustomerId(c.id);
                        setCustomerSearch(c.name);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex justify-between ${
                        customerId === c.id ? "bg-primary/10 font-medium" : ""
                      }`}
                    >
                      <span>{c.name}</span>
                      {c.phone && (
                        <span className="text-muted-foreground text-xs">{c.phone}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {customerSearch && filteredCustomers.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">
                  Nenhum cliente encontrado.
                </p>
              )}
            </div>

            {/* ---- SELEÇÃO DE SERVIÇOS (Multiselect) ---- */}
            <div className="space-y-2">
              <Label>Serviços * {selectedServiceIds.length > 0 && `(${selectedServiceIds.length})`}</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border divide-y">
                {availableServices.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3">
                    Nenhum serviço disponível para este profissional.
                  </p>
                )}
                {availableServices.map((svc) => {
                  const isSelected = selectedServiceIds.includes(svc.id);
                  return (
                    <label
                      key={svc.id}
                      className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleService(svc.id)}
                          className="rounded border-gray-300"
                        />
                        <span>{svc.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({svc.durationMinutes}min)
                        </span>
                      </div>
                      <span className="text-xs font-medium">
                        R$ {svc.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ---- RESUMO (duração + preço) ---- */}
            {selectedServiceIds.length > 0 && (
              <div className="flex items-center gap-4 rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span>
                  Duração: <strong>{totalDuration}min</strong>
                </span>
                <span>
                  Horário: <strong>{startTimeFormatted} – {endTimeFormatted}</strong>
                </span>
                <span>
                  Total: <strong>R$ {totalPrice.toFixed(2)}</strong>
                </span>
              </div>
            )}

            {/* ---- SALA ---- */}
            <div className="space-y-2">
              <Label>Sala</Label>
              <Select value={roomId} onValueChange={(v) => setRoomId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar sala (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ---- EQUIPAMENTOS (Multiselect) ---- */}
            {equipment.length > 0 && (
              <div className="space-y-2">
                <Label>Equipamentos</Label>
                <div className="max-h-28 overflow-y-auto rounded-md border divide-y">
                  {equipment.map((eq) => {
                    const isSelected = selectedEquipmentIds.includes(eq.id);
                    return (
                      <label
                        key={eq.id}
                        className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleEquipment(eq.id)}
                          className="rounded border-gray-300"
                        />
                        <span>{eq.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---- OBSERVAÇÕES ---- */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                placeholder="Notas internas sobre o agendamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Agendando..." : "Confirmar Agendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
