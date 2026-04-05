"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quickStatusChangeAction } from "@/actions/dashboard.actions";
import {
  LogIn,
  Play,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

type WaitingAppointment = {
  id: string;
  customerName: string;
  customerPhone: string | null;
  professionalName: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
  services: string[];
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  SCHEDULED:   { label: "Agendado",        variant: "outline" },
  CONFIRMED:   { label: "Confirmado",      variant: "secondary" },
  CHECKED_IN:  { label: "Na Sala",         variant: "default" },
  IN_PROGRESS: { label: "Em Atendimento",  variant: "default" },
};

/**
 * Componente da tabela "Sala de Espera" com ações rápidas de mudança de status.
 * A recepcionista pode fazer check-in, iniciar atendimento ou finalizar diretamente.
 */
export function WaitingRoom({ appointments }: { appointments: WaitingAppointment[] }) {
  const router = useRouter();

  if (appointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Sala de Espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Nenhum agendamento pendente para hoje.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Sala de Espera
          <Badge variant="secondary" className="ml-auto text-xs">
            {appointments.length} pendente(s)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {appointments.map((apt) => (
            <WaitingRoomRow key={apt.id} appointment={apt} onAction={() => router.refresh()} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Linha individual da sala de espera com botões de ação */
function WaitingRoomRow({
  appointment,
  onAction,
}: {
  appointment: WaitingAppointment;
  onAction: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const start = new Date(appointment.startTime);
  const timeLabel = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;

  const statusConfig = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.SCHEDULED;

  /** Executa a mudança rápida de status e dispara refresh */
  function handleAction(newStatus: "CHECKED_IN" | "IN_PROGRESS" | "COMPLETED") {
    startTransition(async () => {
      const result = await quickStatusChangeAction(appointment.id, newStatus);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const labels: Record<string, string> = {
        CHECKED_IN: "Check-in realizado",
        IN_PROGRESS: "Atendimento iniciado",
        COMPLETED: "Atendimento finalizado — comissão e receita geradas",
      };
      toast.success(labels[newStatus]);
      onAction();
    });
  }

  return (
    <div className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors">
      {/* Horário */}
      <div className="text-sm font-mono text-muted-foreground w-12 shrink-0">
        {timeLabel}
      </div>

      {/* Info do paciente */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{appointment.customerName}</span>
          <Badge variant={statusConfig.variant} className="text-[10px] shrink-0">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {appointment.services.join(", ")} — {appointment.professionalName}
        </div>
      </div>

      {/* Valor */}
      {appointment.totalPrice > 0 && (
        <div className="text-sm font-medium shrink-0 hidden sm:block">
          R$ {appointment.totalPrice.toFixed(2)}
        </div>
      )}

      {/* Ações rápidas baseadas no status atual */}
      <div className="flex items-center gap-1.5 shrink-0">
        {(appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("CHECKED_IN")}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <LogIn className="h-3.5 w-3.5" />
            Check-in
          </Button>
        )}

        {appointment.status === "CHECKED_IN" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction("IN_PROGRESS")}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <Play className="h-3.5 w-3.5" />
            Iniciar
          </Button>
        )}

        {(appointment.status === "CHECKED_IN" || appointment.status === "IN_PROGRESS") && (
          <Button
            size="sm"
            onClick={() => handleAction("COMPLETED")}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isPending ? "Finalizando..." : "Finalizar"}
          </Button>
        )}
      </div>
    </div>
  );
}
