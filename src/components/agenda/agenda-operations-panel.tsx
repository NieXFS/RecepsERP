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

const STATUS_PILL_COLORS: Record<
  AppointmentWorkflowStatus,
  { dot: string; tint: string }
> = {
  SCHEDULED: { dot: "bg-blue-500", tint: "hover:bg-blue-500/6" },
  CONFIRMED: { dot: "bg-emerald-500", tint: "hover:bg-emerald-500/6" },
  WAITING: { dot: "bg-amber-500", tint: "hover:bg-amber-500/6" },
  IN_PROGRESS: { dot: "bg-purple-500", tint: "hover:bg-purple-500/6" },
  COMPLETED: { dot: "bg-slate-400", tint: "hover:bg-slate-500/6" },
  PAID: { dot: "bg-emerald-600", tint: "hover:bg-emerald-600/6" },
  CANCELLED: { dot: "bg-red-500", tint: "hover:bg-red-500/6" },
  NO_SHOW: { dot: "bg-orange-500", tint: "hover:bg-orange-500/6" },
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

  const totalCount = counters.reduce((sum, c) => sum + c.count, 0);

  return (
    <section className="flex flex-col gap-[18px]">
      {/* Status strip — 8 colunas com dot + label + count */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[22px] bg-card px-6 py-5",
          "shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]"
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-[18px] left-0 w-[3px] rounded-full bg-gradient-to-b from-primary to-chart-2"
        />
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 pl-2">
          <div>
            <h3 className="text-[19px] font-extrabold tracking-[-0.025em] text-foreground">
              Operação do dia
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Confirmação, recepção, andamento e encerramento dos atendimentos de{" "}
              <b className="font-bold capitalize text-foreground">{dateLabel}</b>.
            </p>
          </div>
          <div className="text-[12px] text-muted-foreground">
            Total no dia:{" "}
            <b className="font-bold text-foreground tabular-nums">
              {totalCount} agendamento(s)
            </b>
          </div>
        </div>
        <div
          className="grid grid-cols-2 gap-2 pl-2 sm:grid-cols-4 xl:grid-cols-8"
          aria-live="polite"
          aria-atomic="true"
        >
          {counters.map((counter) => {
            const { dot, tint } = STATUS_PILL_COLORS[counter.status];
            return (
              <div
                key={counter.status}
                className={cn(
                  "group flex items-center gap-2.5 rounded-[12px] bg-muted/50 px-3 py-2.5 transition-colors duration-150",
                  tint
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-transform duration-150 group-hover:scale-125",
                    dot
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-foreground">
                    {counter.label}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground tabular-nums">
                    {counter.count} agendamento(s)
                  </p>
                </div>
              </div>
            );
          })}
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
    <div className="flex flex-col gap-3">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </h4>
      <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-4">
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
  const { dot } = STATUS_PILL_COLORS[status];

  return (
    <div
      className={cn(
        "relative flex min-h-[240px] flex-col overflow-hidden rounded-[18px] bg-card pb-4 pt-5",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_8px_24px_-12px_rgba(15,23,42,0.06)]"
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-[3px]", dot)} />
      <div className="mb-3 space-y-1.5 px-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="h-[15px] w-[15px] text-muted-foreground" aria-hidden={true} />
            <h5 className="text-[14.5px] font-bold tracking-[-0.01em] text-foreground">
              {APPOINTMENT_STATUS_LABELS[status]}
            </h5>
          </div>
          <span
            className={cn(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold tabular-nums",
              getLaneCounterBadgeClass(appointments.length)
            )}
          >
            {appointments.length}
          </span>
        </div>
        <p className="text-[11.5px] leading-[1.45] text-muted-foreground">
          {STATUS_DESCRIPTIONS[status]}
        </p>
      </div>
      <div className="flex flex-col gap-2.5 px-4">
        {appointments.length === 0 ? (
          <div className="animate-fade-in rounded-[12px] border border-dashed border-border/70 px-3 py-5 text-center text-[12px] text-muted-foreground/70">
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
      </div>
    </div>
  );
}

function getLaneCounterBadgeClass(count: number) {
  if (count === 0) {
    return "bg-muted/70 text-muted-foreground";
  }

  return "bg-primary text-primary-foreground shadow-sm shadow-primary/25";
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

  const { dot } = STATUS_PILL_COLORS[normalizedStatus];

  return (
    <div className="group animate-fade-in-up relative overflow-hidden rounded-[14px] bg-muted/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-md">
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-2 left-0 w-[2.5px] rounded-full", dot)}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">
            {appointment.customerName}
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground tabular-nums">
            {timeLabel} · {appointment.professionalName}
          </p>
        </div>
        <Badge
          variant={APPOINTMENT_STATUS_BADGE_VARIANTS[normalizedStatus]}
          className="shrink-0 text-[10px]"
        >
          {getAppointmentStatusLabel(appointment.status)}
        </Badge>
      </div>

      <div className="mt-2 space-y-1 pl-2">
        <p className="line-clamp-2 text-[11.5px] text-muted-foreground">
          {appointment.services.join(", ")}
        </p>
        {appointment.totalPrice > 0 && (
          <p className="text-[12px] font-semibold text-foreground tabular-nums">
            R$ {appointment.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {availableActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pl-2">
          {availableActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.nextStatus}
                size="sm"
                variant={action.variant}
                disabled={isPending}
                onClick={() => handleActionClick(action.nextStatus)}
                className="h-8 gap-1 rounded-[9px] text-[11.5px]"
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
