"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedList } from "@/components/ui/animated-list";
import { toast } from "sonner";
import { Plus, Trash2, DoorOpen, Wrench } from "lucide-react";
import {
  createRoomAction,
  createEquipmentAction,
  deactivateRoomAction,
  deactivateEquipmentAction,
} from "@/actions/resources.actions";

type Room = { id: string; name: string; createdAt: string };
type Equipment = { id: string; name: string; createdAt: string };

/**
 * Painel de Salas & Equipamentos — CRUD rápido inline.
 * Input + botão para criar, lista com botão de excluir.
 */
export function ResourcesPanel({
  rooms,
  equipments,
}: {
  rooms: Room[];
  equipments: Equipment[];
}) {
  const [newRoomName, setNewRoomName] = useState("");
  const [newEquipName, setNewEquipName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCreateRoom() {
    if (!newRoomName.trim()) {
      toast.error("Informe o nome da sala.");
      return;
    }

    startTransition(async () => {
      const result = await createRoomAction(newRoomName.trim());
      if (result.success) {
        toast.success(`Sala "${newRoomName.trim()}" criada!`);
        setNewRoomName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteRoom(room: Room) {
    if (!confirm(`Deseja desativar a sala "${room.name}"?`)) return;

    startTransition(async () => {
      const result = await deactivateRoomAction(room.id);
      if (result.success) {
        toast.success(`Sala "${room.name}" desativada.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleCreateEquipment() {
    if (!newEquipName.trim()) {
      toast.error("Informe o nome do equipamento.");
      return;
    }

    startTransition(async () => {
      const result = await createEquipmentAction(newEquipName.trim());
      if (result.success) {
        toast.success(`Equipamento "${newEquipName.trim()}" criado!`);
        setNewEquipName("");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDeleteEquipment(equip: Equipment) {
    if (!confirm(`Deseja desativar o equipamento "${equip.name}"?`)) return;

    startTransition(async () => {
      const result = await deactivateEquipmentAction(equip.id);
      if (result.success) {
        toast.success(`Equipamento "${equip.name}" desativado.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* ── Salas ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Salas</h2>
        </div>

        {/* Input de criação rápida */}
        <div className="flex gap-2">
          <Input
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder='Ex: "Sala 1", "Consultório 3"'
            onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
          />
          <Button onClick={handleCreateRoom} disabled={isPending} className="gap-1 shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </Button>
        </div>

        {/* Lista de salas */}
        {rooms.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Nenhuma sala cadastrada.
            </CardContent>
          </Card>
        ) : (
          <AnimatedList className="space-y-2" stagger={40}>
            {rooms.map((room) => (
              <Card key={room.id} className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium text-sm">{room.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteRoom(room)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </AnimatedList>
        )}
      </div>

      {/* ── Equipamentos ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Equipamentos</h2>
        </div>

        {/* Input de criação rápida */}
        <div className="flex gap-2">
          <Input
            value={newEquipName}
            onChange={(e) => setNewEquipName(e.target.value)}
            placeholder='Ex: "Máquina de Laser", "Autoclave"'
            onKeyDown={(e) => e.key === "Enter" && handleCreateEquipment()}
          />
          <Button onClick={handleCreateEquipment} disabled={isPending} className="gap-1 shrink-0">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </Button>
        </div>

        {/* Lista de equipamentos */}
        {equipments.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              Nenhum equipamento cadastrado.
            </CardContent>
          </Card>
        ) : (
          <AnimatedList className="space-y-2" stagger={40}>
            {equipments.map((equip) => (
              <Card key={equip.id} className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-sm">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium text-sm">{equip.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteEquipment(equip)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </AnimatedList>
        )}
      </div>
    </div>
  );
}
