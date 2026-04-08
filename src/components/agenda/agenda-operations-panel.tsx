"use client";

import type { ComponentType } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Play,
  Receipt,
  RotateCcw,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { updateAppointmentStatusAction } from "@/actions/appointment.actions";
import { checkoutAppointmentAction } from "@/actions/financial.actions";
import {
  APPOINTMENT_STATUS_BADGE_VARIANTS,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_VISIBLE_STATUS_ORDER,
  getAllowedAppointmentTransitions,
  getAppointmentStatusLabel,
  normalizeAppointmentStatus,
  type AppointmentWorkflowStatus,
} from "@/lib/appointments/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodValue,
} from "@/lib/payment-methods";
import type { OperationalAppointment } from "./types";

type AgendaOperationsPanelProps = {
  dateLabel: string;
  appointments: OperationalAppointment[];
};

type QuickAction = {
  nextStatus: AppointmentWorkflowStatus;
  label: string;
  icon: ComponentType<{ className?: string }>;
  variant: "default" | "outline" | "secondary" | "destructive" | "ghost";
};

const PRIMARY_STATUSES: AppointmentWorkflowStatus[] = [
  "SCHEDULED",
  "CONFIRMED",
  "WAITING",
  "IN_PROGRESS",
];

const SECONDARY_STATUSES: AppointmentWorkflowStatus[] = [
  "COMPLETED",
  "PAID",
  "CANCELLED",
  "NO_SHOW",
];

const STATUS_DESCRIPTIONS: Record<AppointmentWorkflowStatus, string> = {
  SCHEDULED: "Agendamentos ainda pendentes de confirmação ou chegada.",
  CONFIRMED: "Clientes confirmados aguardando chegada ao estabelecimento.",
  WAITING: "Clientes presentes e prontos para seguir ao atendimento.",
  IN_PROGRESS: "Atendimentos em execução neste momento.",
  COMPLETED: "Atendimentos encerrados aguardando baixa operacional final.",
  PAID: "Atendimentos concluídos e sinalizados como pagos.",
  CANCELLED: "Compromissos cancelados para a data selecionada.",
  NO_SHOW: "Clientes que não compareceram ao agendamento.",
};

/**
 * Painel operacional da agenda.
 * Agrupa os agendamentos da data por status e oferece transições rápidas
 * para recepção e atendimento sem depender do dashboard executivo.
 */
export function AgendaOperationsPanel({
  dateLabel,
  appointments,
}: AgendaOperationsPanelProps) {
  const groupedAppointments = useMemo(() => {
    const groups = new Map<AppointmentWorkflowStatus, OperationalAppointment[]>();

    for (const status of APPOINTMENT_VISIBLE_STATUS_ORDER) {
      groups.set(status, []);
    }

    for (const appointment of appointments) {
      const normalizedStatus = normalizeAppointmentStatus(appointment.status);
      groups.get(normalizedStatus)?.push(appointment);
    }

    return groups;
  }, [appointments]);

  const counters = useMemo(() => {
    return APPOINTMENT_VISIBLE_STATUS_ORDER.map((status) => ({
      status,
      label: APPOINTMENT_STATUS_LABELS[status],
      count: groupedAppointments.get(status)?.length ?? 0,
    }));
  }, [groupedAppointments]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Operação da Agenda</h3>
          <p className="text-sm text-muted-foreground">
            Confirmação, recepção, andamento e encerramento dos atendimentos de{" "}
            <span className="font-medium text-foreground capitalize">{dateLabel}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {counters.map((counter) => (
            <div
              key={counter.status}
              className="rounded-lg border bg-background px-3 py-2 text-xs"
            >
              <p className="font-medium text-foreground">{counter.label}</p>
              <p className="text-muted-foreground">{counter.count} agendamento(s)</p>
            </div>
          ))}
        </div>
      </div>

      <LaneGrid
        title="Fluxo operacional"
        statuses={PRIMARY_STATUSES}
        groupedAppointments={groupedAppointments}
      />

      <LaneGrid
        title="Encerramentos do dia"
        statuses={SECONDARY_STATUSES}
        groupedAppointments={groupedAppointments}
      />
    </section>
  );
}

function LaneGrid({
  title,
  statuses,
  groupedAppointments,
}: {
  title: string;
  statuses: AppointmentWorkflowStatus[];
  groupedAppointments: Map<AppointmentWorkflowStatus, OperationalAppointment[]>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {statuses.map((status) => (
          <StatusLane
            key={status}
            status={status}
            appointments={groupedAppointments.get(status) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function StatusLane({
  status,
  appointments,
}: {
  status: AppointmentWorkflowStatus;
  appointments: OperationalAppointment[];
}) {
  return (
    <Card className="min-h-[220px]">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{APPOINTMENT_STATUS_LABELS[status]}</CardTitle>
          <Badge
            variant="outline"
            className={getLaneCounterBadgeClass(appointments.length)}
          >
            {appointments.length}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {STATUS_DESCRIPTIONS[status]}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhum agendamento neste status.
          </div>
        ) : (
          appointments.map((appointment) => (
            <OperationalAppointmentCard
              key={appointment.id}
              appointment={appointment}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function getLaneCounterBadgeClass(count: number) {
  if (count === 0) {
    return "border-border bg-muted/50 text-muted-foreground";
  }

  return "border-primary bg-primary text-primary-foreground";
}

function OperationalAppointmentCard({
  appointment,
}: {
  appointment: OperationalAppointment;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue | "">("");
  const normalizedStatus = normalizeAppointmentStatus(appointment.status);
  const availableActions = useMemo(
    () => buildQuickActions(normalizedStatus),
    [normalizedStatus]
  );
  const paymentMethodOptions = useMemo(
    () =>
      PAYMENT_METHOD_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    []
  );

  function handleTransition(nextStatus: AppointmentWorkflowStatus) {
    startTransition(async () => {
      const result = await updateAppointmentStatusAction({
        appointmentId: appointment.id,
        status: nextStatus,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(getStatusTransitionToast(nextStatus));
      router.refresh();
    });
  }

  function handlePaymentDialogChange(open: boolean) {
    if (isPending) {
      return;
    }

    setPaymentDialogOpen(open);

    if (!open) {
      setPaymentMethod("");
    }
  }

  function handleActionClick(nextStatus: AppointmentWorkflowStatus) {
    if (nextStatus === "PAID") {
      setPaymentDialogOpen(true);
      return;
    }

    handleTransition(nextStatus);
  }

  function handleConfirmPayment() {
    if (!paymentMethod) {
      toast.error("Selecione o meio de pagamento para concluir o checkout.");
      return;
    }

    startTransition(async () => {
      const result = await checkoutAppointmentAction(appointment.id, {
        paymentMethod,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Pagamento confirmado e registrado no caixa.");
      setPaymentDialogOpen(false);
      setPaymentMethod("");
      router.refresh();
    });
  }

  const start = new Date(appointment.startTime);
  const timeLabel = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="rounded-xl border bg-background/70 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{appointment.customerName}</p>
          <p className="text-xs text-muted-foreground">
            {timeLabel} · {appointment.professionalName}
          </p>
        </div>
        <Badge variant={APPOINTMENT_STATUS_BADGE_VARIANTS[normalizedStatus]}>
          {getAppointmentStatusLabel(appointment.status)}
        </Badge>
      </div>

      <div className="mt-2 space-y-1">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {appointment.services.join(", ")}
        </p>
        {appointment.totalPrice > 0 && (
          <p className="text-xs font-medium text-foreground">
            R$ {appointment.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {availableActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {availableActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.nextStatus}
                size="xs"
                variant={action.variant}
                disabled={isPending}
                onClick={() => handleActionClick(action.nextStatus)}
              >
                <Icon className="h-3 w-3" />
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Revise o valor do atendimento e informe o meio de pagamento antes de concluir o checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Valor total do agendamento
              </p>
              <p className="mt-1 text-2xl font-semibold">
                R$ {appointment.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {appointment.customerName} · {timeLabel} · {appointment.professionalName}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Meio de Pagamento *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod((value ?? "") as PaymentMethodValue | "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValueLabel
                    value={paymentMethod}
                    options={paymentMethodOptions}
                    placeholder="Selecionar meio de pagamento"
                  />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => handlePaymentDialogChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmPayment} disabled={isPending}>
              {isPending ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildQuickActions(status: AppointmentWorkflowStatus): QuickAction[] {
  const allowed = new Set(getAllowedAppointmentTransitions(status));

  const actions: QuickAction[] = [];

  if (allowed.has("CONFIRMED")) {
    actions.push({
      nextStatus: "CONFIRMED",
      label: status === "WAITING" ? "Voltar p/ confirmado" : "Confirmar",
      icon: status === "WAITING" ? RotateCcw : UserRoundCheck,
      variant: "outline",
    });
  }

  if (allowed.has("WAITING")) {
    actions.push({
      nextStatus: "WAITING",
      label: "Marcar chegada",
      icon: Clock3,
      variant: "secondary",
    });
  }

  if (allowed.has("IN_PROGRESS")) {
    actions.push({
      nextStatus: "IN_PROGRESS",
      label: "Iniciar",
      icon: Play,
      variant: "default",
    });
  }

  if (allowed.has("COMPLETED")) {
    actions.push({
      nextStatus: "COMPLETED",
      label: "Finalizar",
      icon: CheckCircle2,
      variant: "default",
    });
  }

  if (allowed.has("PAID")) {
    actions.push({
      nextStatus: "PAID",
      label: "Marcar pago",
      icon: Receipt,
      variant: "secondary",
    });
  }

  if (allowed.has("NO_SHOW")) {
    actions.push({
      nextStatus: "NO_SHOW",
      label: "Faltou",
      icon: AlertCircle,
      variant: "outline",
    });
  }

  if (allowed.has("CANCELLED")) {
    actions.push({
      nextStatus: "CANCELLED",
      label: "Cancelar",
      icon: XCircle,
      variant: "destructive",
    });
  }

  return actions;
}

function getStatusTransitionToast(status: AppointmentWorkflowStatus) {
  const messages: Record<AppointmentWorkflowStatus, string> = {
    SCHEDULED: "Agendamento voltou para Agendado.",
    CONFIRMED: "Agendamento confirmado.",
    WAITING: "Cliente marcado como aguardando.",
    IN_PROGRESS: "Atendimento iniciado.",
    COMPLETED: "Atendimento finalizado com sucesso.",
    PAID: "Atendimento marcado como pago.",
    CANCELLED: "Agendamento cancelado.",
    NO_SHOW: "Agendamento marcado como falta.",
  };

  return messages[status];
}
