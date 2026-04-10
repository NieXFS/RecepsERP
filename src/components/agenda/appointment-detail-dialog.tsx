"use client";

import {
  useMemo,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Clock3,
  DoorOpen,
  ExternalLink,
  Phone,
  Play,
  Receipt,
  Scissors,
  UserRoundCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { checkoutAppointmentAction } from "@/actions/financial.actions";
import { updateAppointmentStatusAction } from "@/actions/appointment.actions";
import {
  APPOINTMENT_STATUS_BADGE_VARIANTS,
  APPOINTMENT_STATUS_CARD_STYLES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_WORKFLOW_STATUSES,
  getAllowedAppointmentTransitions,
  getAppointmentStatusLabel,
  getStatusTransitionToast,
  normalizeAppointmentStatus,
  type AppointmentWorkflowStatus,
} from "@/lib/appointments/status";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodValue,
} from "@/lib/payment-methods";
import { cn } from "@/lib/utils";
import type { CalendarAppointment, CalendarFinancialAccount } from "./types";

type AppointmentDetailDialogProps = {
  appointment: CalendarAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
};

const STATUS_ICON_MAP: Record<
  AppointmentWorkflowStatus,
  ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
  SCHEDULED: CalendarCheck,
  CONFIRMED: UserRoundCheck,
  WAITING: Clock3,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle2,
  PAID: Receipt,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};

function StatusIcon({
  status,
  className,
}: {
  status: AppointmentWorkflowStatus;
  className?: string;
}) {
  const Icon = STATUS_ICON_MAP[status];
  return <Icon className={className} aria-hidden={true} />;
}

export function AppointmentDetailDialog({
  appointment,
  open,
  onOpenChange,
  hasOpenCashRegister,
  openCashRegisterAccountId,
  financialAccounts,
}: AppointmentDetailDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cashClosedAlertOpen, setCashClosedAlertOpen] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<AppointmentWorkflowStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue | "">("");
  const [destinationAccountId, setDestinationAccountId] = useState("");

  const appointmentId = appointment?.id ?? null;
  const currentStatus = appointment
    ? normalizeAppointmentStatus(appointment.status)
    : null;
  const allowedTransitions = useMemo(
    () =>
      currentStatus
        ? new Set(getAllowedAppointmentTransitions(currentStatus))
        : new Set<AppointmentWorkflowStatus>(),
    [currentStatus]
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

  if (!appointment || !appointmentId || !currentStatus) {
    return null;
  }

  const resolvedAppointmentId = appointmentId;
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const timeLabel = `${start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${end.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const statusStyle = APPOINTMENT_STATUS_CARD_STYLES[currentStatus];
  const normalizedPhone = appointment.customerPhone?.replace(/\D/g, "") ?? "";
  const canCheckoutDirectly =
    currentStatus !== "PAID" &&
    currentStatus !== "CANCELLED" &&
    currentStatus !== "NO_SHOW";

  function getDefaultDestinationAccountId() {
    if (
      openCashRegisterAccountId &&
      financialAccounts.some((account) => account.id === openCashRegisterAccountId)
    ) {
      return openCashRegisterAccountId;
    }

    return "";
  }

  function executeTransition(nextStatus: AppointmentWorkflowStatus) {
    startTransition(async () => {
      const result = await updateAppointmentStatusAction({
        appointmentId: resolvedAppointmentId,
        status: nextStatus,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(getStatusTransitionToast(nextStatus));
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleStatusChange(nextStatus: AppointmentWorkflowStatus) {
    if (nextStatus === "PAID") {
      if (!hasOpenCashRegister) {
        setCashClosedAlertOpen(true);
        return;
      }

      setDestinationAccountId(getDefaultDestinationAccountId());
      setPaymentDialogOpen(true);
      return;
    }

    if (nextStatus === "CANCELLED" || nextStatus === "NO_SHOW") {
      setConfirmAction(nextStatus);
      return;
    }

    executeTransition(nextStatus);
  }

  function handlePaymentDialogChange(nextOpen: boolean) {
    if (isPending) {
      return;
    }

    setPaymentDialogOpen(nextOpen);

    if (!nextOpen) {
      setPaymentMethod("");
      setDestinationAccountId("");
    }
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
      const result = await checkoutAppointmentAction(resolvedAppointmentId, {
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
      onOpenChange(false);
      router.refresh();
    });
  }

  function handleContinueWithoutOpenCash() {
    setCashClosedAlertOpen(false);
    setDestinationAccountId(getDefaultDestinationAccountId());
    setPaymentDialogOpen(true);
  }

  function handleGoToCashRegister() {
    setCashClosedAlertOpen(false);
    onOpenChange(false);
    router.push("/financeiro/caixa");
  }

  function formatCurrency(value: number) {
    return `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{appointment.customerName}</DialogTitle>
            <DialogDescription>
              {appointment.professionalName}
              {appointment.professionalSpecialty
                ? ` · ${appointment.professionalSpecialty}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1">
            <section className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden={true}
                />
                <span>{timeLabel}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <Scissors
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden={true}
                  />
                  <div className="min-w-0 space-y-1">
                    {appointment.services.map((service) => (
                      <div
                        key={`${appointment.id}-${service.name}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="truncate">{service.name}</span>
                        <span className="shrink-0 text-muted-foreground tabular-nums">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {appointment.roomName && (
                  <div className="flex items-center gap-2 text-sm">
                    <DoorOpen
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden={true}
                    />
                    <span>{appointment.roomName}</span>
                  </div>
                )}

                {appointment.equipments.length > 0 && (
                  <div className="flex items-start gap-2 text-sm">
                    <Wrench
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden={true}
                    />
                    <span>{appointment.equipments.join(", ")}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatCurrency(appointment.totalPrice)}
                </span>
              </div>
            </section>

            <section
              className={cn(
                "space-y-3 rounded-xl border p-4",
                statusStyle.bg,
                statusStyle.border,
                statusStyle.text
              )}
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  Status Atual
                </p>
                <Badge
                  variant={APPOINTMENT_STATUS_BADGE_VARIANTS[currentStatus]}
                  className="w-fit px-3 py-1 text-sm"
                >
                  {getAppointmentStatusLabel(appointment.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {APPOINTMENT_WORKFLOW_STATUSES.map((status) => {
                  const isCurrent = status === currentStatus;
                  const isAllowed =
                    allowedTransitions.has(status) ||
                    (status === "PAID" && canCheckoutDirectly);
                  const nextStyle = APPOINTMENT_STATUS_CARD_STYLES[status];

                  return (
                    <button
                      key={status}
                      type="button"
                      disabled={isCurrent || !isAllowed || isPending}
                      onClick={() => handleStatusChange(status)}
                      className={cn(
                        "relative flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all duration-200 ease-out",
                        isCurrent && "ring-2 ring-primary ring-offset-2 opacity-100",
                        isAllowed &&
                          !isCurrent &&
                          "cursor-pointer hover:scale-[1.03] hover:shadow-md active:scale-[0.97]",
                        !isAllowed && !isCurrent && "cursor-not-allowed opacity-30",
                        nextStyle.bg,
                        nextStyle.border,
                        nextStyle.text
                      )}
                    >
                      <StatusIcon status={status} className="h-4 w-4" />
                      <span>{APPOINTMENT_STATUS_LABELS[status]}</span>
                      {isCurrent && (
                        <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <DialogFooter className="gap-2 border-t pt-4 sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {appointment.customerPhone && normalizedPhone && (
                <a
                  href={`tel:${normalizedPhone}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-2"
                  )}
                >
                  <Phone className="h-4 w-4" aria-hidden={true} />
                  {appointment.customerPhone}
                </a>
              )}
            </div>

            <Link
              href={`/clientes/${appointment.customerId}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-2"
              )}
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="h-4 w-4" aria-hidden={true} />
              Ver Perfil do Cliente
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={handlePaymentDialogChange}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Revise o valor do atendimento e informe o meio de pagamento antes
              de concluir o checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Valor total do agendamento
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(appointment.totalPrice)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {appointment.customerName} · {timeLabel} ·{" "}
                {appointment.professionalName}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Meio de Pagamento *</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod((value ?? "") as PaymentMethodValue | "")
                }
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
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isPending) {
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
                executeTransition(nextStatus);
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
        onOpenChange={(nextOpen) => {
          if (!isPending) {
            setCashClosedAlertOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atenção: Caixa Fechado</AlertDialogTitle>
            <AlertDialogDescription>
              O Caixa ainda não foi aberto para o dia de hoje. Quer continuar e
              registrar o pagamento mesmo assim?
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
            <Button
              onClick={handleContinueWithoutOpenCash}
              disabled={isPending}
            >
              Continuar mesmo assim
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
