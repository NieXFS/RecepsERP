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
  getStatusTransitionToast,
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { cn } from "@/lib/utils";
import type { CalendarFinancialAccount, OperationalAppointment } from "./types";

type AgendaOperationsPanelProps = {
  dateLabel: string;
  appointments: OperationalAppointment[];
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
};

type QuickAction = {
  nextStatus: AppointmentWorkflowStatus;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
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

const STATUS_COUNTER_COLORS: Record<AppointmentWorkflowStatus, string> = {
  SCHEDULED: "border-t-2 border-t-blue-400",
  CONFIRMED: "border-t-2 border-t-emerald-400",
  WAITING: "border-t-2 border-t-amber-400",
  IN_PROGRESS: "border-t-2 border-t-purple-400",
  COMPLETED: "border-t-2 border-t-slate-300",
  PAID: "border-t-2 border-t-emerald-500",
  CANCELLED: "border-t-2 border-t-red-400",
  NO_SHOW: "border-t-2 border-t-orange-400",
};

const STATUS_ICONS: Record<
  AppointmentWorkflowStatus,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  SCHEDULED: Clock3,
  CONFIRMED: UserRoundCheck,
  WAITING: Clock3,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle2,
  PAID: Receipt,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};

/**
 * Painel operacional da agenda.
 * Agrupa os agendamentos da data por status e oferece transições rápidas
 * para recepção e atendimento sem depender do dashboard executivo.
 */
export function AgendaOperationsPanel({
  dateLabel,
  appointments,
  hasOpenCashRegister,
  openCashRegisterAccountId,
  financialAccounts,
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
        <div
          className="flex flex-wrap gap-2"
          aria-live="polite"
          aria-atomic="true"
        >
          {counters.map((counter) => (
            <div
              key={counter.status}
              className={cn(
                "rounded-lg border bg-background px-3 py-2 text-xs",
                STATUS_COUNTER_COLORS[counter.status]
              )}
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
        hasOpenCashRegister={hasOpenCashRegister}
        openCashRegisterAccountId={openCashRegisterAccountId}
        financialAccounts={financialAccounts}
      />

      <LaneGrid
        title="Encerramentos do dia"
        statuses={SECONDARY_STATUSES}
        groupedAppointments={groupedAppointments}
        hasOpenCashRegister={hasOpenCashRegister}
        openCashRegisterAccountId={openCashRegisterAccountId}
        financialAccounts={financialAccounts}
      />
    </section>
  );
}

function LaneGrid({
  title,
  statuses,
  groupedAppointments,
  hasOpenCashRegister,
  openCashRegisterAccountId,
  financialAccounts,
}: {
  title: string;
  statuses: AppointmentWorkflowStatus[];
  groupedAppointments: Map<AppointmentWorkflowStatus, OperationalAppointment[]>;
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h4>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statuses.map((status) => (
          <StatusLane
            key={status}
            status={status}
            appointments={groupedAppointments.get(status) ?? []}
            hasOpenCashRegister={hasOpenCashRegister}
            openCashRegisterAccountId={openCashRegisterAccountId}
            financialAccounts={financialAccounts}
          />
        ))}
      </div>
    </div>
  );
}

function StatusLane({
  status,
  appointments,
  hasOpenCashRegister,
  openCashRegisterAccountId,
  financialAccounts,
}: {
  status: AppointmentWorkflowStatus;
  appointments: OperationalAppointment[];
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
}) {
  const Icon = STATUS_ICONS[status];

  return (
    <Card className="min-h-[220px]">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden={true} />
            <CardTitle className="text-base">{APPOINTMENT_STATUS_LABELS[status]}</CardTitle>
          </div>
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
          <div className="animate-fade-in rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhum agendamento neste status.
          </div>
        ) : (
          appointments.map((appointment) => (
            <OperationalAppointmentCard
              key={appointment.id}
              appointment={appointment}
              hasOpenCashRegister={hasOpenCashRegister}
              openCashRegisterAccountId={openCashRegisterAccountId}
              financialAccounts={financialAccounts}
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
  hasOpenCashRegister,
  openCashRegisterAccountId,
  financialAccounts,
}: {
  appointment: OperationalAppointment;
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashClosedAlertOpen, setCashClosedAlertOpen] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<AppointmentWorkflowStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue | "">("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
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
  const accountOptions = useMemo(
    () =>
      financialAccounts.map((account) => ({
        value: account.id,
        label: account.name,
      })),
    [financialAccounts]
  );

  function getDefaultDestinationAccountId() {
    if (
      openCashRegisterAccountId &&
      financialAccounts.some((account) => account.id === openCashRegisterAccountId)
    ) {
      return openCashRegisterAccountId;
    }

    return "";
  }

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
      setDestinationAccountId("");
    }
  }

  function openPaymentDialogWithDefaults() {
    setDestinationAccountId(getDefaultDestinationAccountId());
    setPaymentDialogOpen(true);
  }

  function handleActionClick(nextStatus: AppointmentWorkflowStatus) {
    if (nextStatus === "PAID") {
      if (!hasOpenCashRegister) {
        setCashClosedAlertOpen(true);
        return;
      }

      openPaymentDialogWithDefaults();
      return;
    }

    if (nextStatus === "CANCELLED" || nextStatus === "NO_SHOW") {
      setConfirmAction(nextStatus);
      return;
    }

    handleTransition(nextStatus);
  }

  function handleConfirmPayment() {
    if (!paymentMethod) {
      toast.error("Selecione o meio de pagamento para concluir o checkout.");
      return;
    }

    if (!destinationAccountId) {
      toast.error("Selecione a conta de destino para registrar o pagamento.");
      return;
    }

    startTransition(async () => {
      const result = await checkoutAppointmentAction(appointment.id, {
        paymentMethod,
        accountId: destinationAccountId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Pagamento confirmado e registrado no caixa.");
      setPaymentDialogOpen(false);
      setPaymentMethod("");
      setDestinationAccountId("");
      router.refresh();
    });
  }

  function handleContinueWithoutOpenCash() {
    setCashClosedAlertOpen(false);
    openPaymentDialogWithDefaults();
  }

  function handleGoToCashRegister() {
    setCashClosedAlertOpen(false);
    router.push("/financeiro/caixa");
  }

  const start = new Date(appointment.startTime);
  const timeLabel = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="animate-fade-in-up rounded-xl border bg-background/70 p-3 shadow-sm">
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
                size="sm"
                variant={action.variant}
                disabled={isPending}
                onClick={() => handleActionClick(action.nextStatus)}
                className="min-h-[36px] min-w-[44px]"
              >
                <Icon className="h-3 w-3" aria-hidden={true} />
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

            <div className="space-y-2">
              <Label>Conta de Destino *</Label>
              <Select
                value={destinationAccountId}
                onValueChange={(value) => setDestinationAccountId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValueLabel
                    value={destinationAccountId}
                    options={accountOptions}
                    placeholder="Selecionar conta de destino"
                  />
                </SelectTrigger>
                <SelectContent>
                  {financialAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
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

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) {
            setConfirmAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "CANCELLED"
                ? "Cancelar Agendamento?"
                : "Marcar como Falta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "CANCELLED"
                ? "O agendamento será marcado como cancelado. Esta ação não pode ser desfeita."
                : "O agendamento será marcado como falta (no-show). Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isPending}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmAction) {
                  return;
                }

                const nextStatus = confirmAction;
                setConfirmAction(null);
                handleTransition(nextStatus);
              }}
              disabled={isPending}
            >
              {confirmAction === "CANCELLED"
                ? "Sim, Cancelar"
                : "Sim, Marcar Falta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cashClosedAlertOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setCashClosedAlertOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção: Caixa Fechado</AlertDialogTitle>
            <AlertDialogDescription>
              O Caixa ainda não foi aberto para o dia de hoje. Quer continuar e registrar o pagamento mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={handleGoToCashRegister}
              disabled={isPending}
            >
              Abrir Caixa
            </Button>
            <Button onClick={handleContinueWithoutOpenCash} disabled={isPending}>
              Continuar mesmo assim
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
