# Codex Prompt — Agenda: Dialog de Detalhe do Agendamento + Troca Rápida de Status

> **Contexto**: ERP SaaS para clínicas de beleza/estética.
> **Stack**: Next.js 16 (App Router), React 19, Tailwind v4, @base-ui/react, Lucide, Sonner, next-themes.
> **Componentes existentes**: `Dialog`, `AlertDialog`, `Button`, `Badge`, `Select` em `src/components/ui/`.
> **Status system**: `src/lib/appointments/status.ts` com `APPOINTMENT_STATUS_CARD_STYLES`, `getAllowedAppointmentTransitions`, `normalizeAppointmentStatus`, `APPOINTMENT_STATUS_LABELS`.
> **Server actions**: `updateAppointmentStatusAction` em `src/actions/appointment.actions.ts`, `checkoutAppointmentAction` em `src/actions/financial.actions.ts`.
> **Motion tokens**: `src/lib/motion.ts` + keyframes em `globals.css`.
> **Regra**: toda mudança deve preservar a build (`npm run build` sem erros). Rodar build ao final.

---

## O QUE FAZER

Atualmente, ao clicar no card de agendamento no grid da agenda, **nada acontece**. O card tem `role="button"` e `cursor-pointer` mas não tem `onClick`.

O fluxo desejado é:
1. Recepcionista clica no card do agendamento no grid → abre um **Dialog de detalhe** com todas as informações do agendamento.
2. Dentro do dialog, ela pode **ver o perfil do cliente** (link para `/clientes/{id}`).
3. Dentro do dialog, ela pode **trocar o status diretamente para QUALQUER status permitido**, sem precisar percorrer o fluxo sequencial (ex: pular de SCHEDULED direto para PAID se necessário).
4. O dialog de checkout (pagamento) já existe no `agenda-operations-panel.tsx` — reutilizar a mesma lógica.

---

## PARTE 1 — Criar `AppointmentDetailDialog`

### Arquivo: `src/components/agenda/appointment-detail-dialog.tsx` (NOVO)

Criar um componente client ("use client") que recebe:

```ts
type AppointmentDetailDialogProps = {
  appointment: CalendarAppointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasOpenCashRegister: boolean;
  openCashRegisterAccountId: string | null;
  financialAccounts: CalendarFinancialAccount[];
};
```

### 1.1 — Layout do Dialog

O dialog deve ter **max-w-[520px]** e ser dividido em seções claras:

**Header**:
- Título: nome do cliente (ex: "Victor")
- Descrição: profissional + especialidade (ex: "Dra. Julia Santos · Esteticista")

**Corpo** (dividido em cards/seções):

**Seção 1 — Informações do agendamento** (card com bg-muted/30):
- Horário: `09:00 – 09:45` (com ícone `Clock` do Lucide)
- Serviços: lista com nome + preço de cada (com ícone `Scissors` ou `Sparkles`)
- Sala: nome da sala se houver (com ícone `DoorOpen`)
- Equipamentos: lista se houver (com ícone `Wrench`)
- Total: `R$ 80,00` (destaque com `text-lg font-semibold`)

**Seção 2 — Status atual** (card com bg correspondente ao status via `APPOINTMENT_STATUS_CARD_STYLES`):
- Badge grande com o status atual
- Abaixo: **grid de botões** para trocar para qualquer status permitido

**Seção 3 — Ações adicionais** (footer):
- Botão "Ver Perfil do Cliente" → `Link` para `/clientes/${appointment.customerId}` (ícone `ExternalLink`)
- Telefone do cliente clicável se existir → `<a href="tel:${phone}">` (ícone `Phone`)

### 1.2 — Troca rápida de status (ponto principal da UX)

**O problema atual**: No painel operacional inferior, a recepcionista precisa encontrar o card do cliente na lane correta, clicar no botão de ação sequencial, e ir avançando passo a passo (Agendado → Confirmado → Aguardando → Em Atendimento → Finalizado → Pago). Isso é lento.

**A solução**: Dentro do dialog de detalhe, exibir TODOS os status possíveis como botões em um grid. Usar `getAllowedAppointmentTransitions(currentStatus)` para determinar quais estão habilitados.

```tsx
import {
  APPOINTMENT_WORKFLOW_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_CARD_STYLES,
  getAllowedAppointmentTransitions,
  normalizeAppointmentStatus,
  type AppointmentWorkflowStatus,
} from "@/lib/appointments/status";
```

Renderizar um grid 2×4 (ou flex wrap) com TODOS os 8 status:

```tsx
const currentStatus = normalizeAppointmentStatus(appointment.status);
const allowedTransitions = new Set(getAllowedAppointmentTransitions(currentStatus));

// Renderizar todos os status:
{APPOINTMENT_WORKFLOW_STATUSES.map((status) => {
  const isCurrent = status === currentStatus;
  const isAllowed = allowedTransitions.has(status);
  const style = APPOINTMENT_STATUS_CARD_STYLES[status];

  return (
    <button
      key={status}
      disabled={isCurrent || !isAllowed || isPending}
      onClick={() => handleStatusChange(status)}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-all",
        isCurrent && "ring-2 ring-primary ring-offset-2 opacity-100",
        isAllowed && !isCurrent && "cursor-pointer hover:scale-[1.03] hover:shadow-md active:scale-[0.97]",
        !isAllowed && !isCurrent && "opacity-30 cursor-not-allowed",
        style.bg, style.border, style.text,
      )}
    >
      {/* Ícone do status (reutilizar os mesmos ícones de buildQuickActions no operations panel) */}
      <StatusIcon status={status} className="h-4 w-4" />
      <span>{APPOINTMENT_STATUS_LABELS[status]}</span>
      {isCurrent && (
        <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
      )}
    </button>
  );
})}
```

Onde `StatusIcon` é um helper que mapeia cada status para o ícone correto:
```tsx
import {
  CalendarCheck,
  UserRoundCheck,
  Clock3,
  Play,
  CheckCircle2,
  Receipt,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_ICON_MAP: Record<AppointmentWorkflowStatus, ComponentType<{ className?: string }>> = {
  SCHEDULED: CalendarCheck,
  CONFIRMED: UserRoundCheck,
  WAITING: Clock3,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle2,
  PAID: Receipt,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};

function StatusIcon({ status, className }: { status: AppointmentWorkflowStatus; className?: string }) {
  const Icon = STATUS_ICON_MAP[status];
  return <Icon className={className} aria-hidden="true" />;
}
```

### 1.3 — Lógica de transição de status

Reutilizar a mesma lógica do `OperationalAppointmentCard` em `agenda-operations-panel.tsx`:

```tsx
const router = useRouter();
const [isPending, startTransition] = useTransition();

// Para checkout (PAID)
const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
const [cashClosedAlertOpen, setCashClosedAlertOpen] = useState(false);
const [paymentMethod, setPaymentMethod] = useState<PaymentMethodValue | "">("");
const [destinationAccountId, setDestinationAccountId] = useState("");

// Para ações destrutivas
const [confirmAction, setConfirmAction] = useState<AppointmentWorkflowStatus | null>(null);
```

O `handleStatusChange`:
```tsx
function handleStatusChange(nextStatus: AppointmentWorkflowStatus) {
  // PAID → abrir dialog de checkout
  if (nextStatus === "PAID") {
    if (!hasOpenCashRegister) {
      setCashClosedAlertOpen(true);
      return;
    }
    setDestinationAccountId(getDefaultDestinationAccountId());
    setPaymentDialogOpen(true);
    return;
  }

  // CANCELLED ou NO_SHOW → pedir confirmação
  if (nextStatus === "CANCELLED" || nextStatus === "NO_SHOW") {
    setConfirmAction(nextStatus);
    return;
  }

  // Demais → executar direto
  executeTransition(nextStatus);
}

function executeTransition(nextStatus: AppointmentWorkflowStatus) {
  startTransition(async () => {
    const result = await updateAppointmentStatusAction({
      appointmentId: appointment!.id,
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
```

Incluir dentro do componente:
- O sub-dialog de pagamento (checkout) — mesmo código do operations panel
- O AlertDialog de confirmação para ações destrutivas (CANCELLED / NO_SHOW)
- O AlertDialog de caixa fechado

Esses sub-dialogs devem ser portalizados corretamente (dialogs dentro de dialog funciona com @base-ui/react pois usam Portal).

### 1.4 — Imports e estado necessários

```tsx
"use client";

import { useState, useTransition, useMemo, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clock,
  ExternalLink,
  Phone,
  Scissors,
  DoorOpen,
  Wrench,
  CalendarCheck,
  UserRoundCheck,
  Clock3,
  Play,
  CheckCircle2,
  Receipt,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueLabel,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateAppointmentStatusAction } from "@/actions/appointment.actions";
import { checkoutAppointmentAction } from "@/actions/financial.actions";
import {
  APPOINTMENT_WORKFLOW_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_CARD_STYLES,
  APPOINTMENT_STATUS_BADGE_VARIANTS,
  getAllowedAppointmentTransitions,
  getAppointmentStatusLabel,
  normalizeAppointmentStatus,
  type AppointmentWorkflowStatus,
} from "@/lib/appointments/status";
import {
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethodValue,
} from "@/lib/payment-methods";
import type { CalendarAppointment, CalendarFinancialAccount } from "./types";
```

---

## PARTE 2 — Integrar no `daily-calendar.tsx`

### 2.1 — Adicionar estado para o appointment selecionado

No `DailyCalendar`, adicionar:

```tsx
const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(null);
const [detailDialogOpen, setDetailDialogOpen] = useState(false);
```

### 2.2 — Passar onClick ao AppointmentCard

O `AppointmentCard` precisa aceitar um `onClick` prop. Modificar:

**Em `appointment-card.tsx`**:

Adicionar à interface:
```tsx
type AppointmentCardProps = {
  appointment: CalendarAppointment;
  onClick?: () => void;
};
```

No componente, adicionar `onClick` ao div raiz:
```tsx
export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  // ... código existente ...

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onClick(); } }}
      className={cn(
        // ... classes existentes já têm cursor-pointer, hover, active ...
      )}
      // ... rest props existentes (style, title, role, tabIndex, aria-label) ...
    >
```

### 2.3 — No `daily-calendar.tsx`, passar onClick

Onde os cards são renderizados (por volta da linha 438):

**Antes**:
```tsx
{profAppointments.map((apt) => (
  <div key={apt.id} className="animate-fade-in">
    <AppointmentCard appointment={apt} />
  </div>
))}
```

**Depois**:
```tsx
{profAppointments.map((apt) => (
  <div key={apt.id} className="animate-fade-in">
    <AppointmentCard
      appointment={apt}
      onClick={() => {
        setSelectedAppointment(apt);
        setDetailDialogOpen(true);
      }}
    />
  </div>
))}
```

### 2.4 — Renderizar o AppointmentDetailDialog

Adicionar antes do `NewAppointmentDialog`, perto da linha 478:

```tsx
<AppointmentDetailDialog
  appointment={selectedAppointment}
  open={detailDialogOpen}
  onOpenChange={(open) => {
    setDetailDialogOpen(open);
    if (!open) {
      setSelectedAppointment(null);
      router.refresh();
    }
  }}
  hasOpenCashRegister={hasOpenCashRegister}
  openCashRegisterAccountId={openCashRegisterAccountId}
  financialAccounts={financialAccounts}
/>
```

Importar no topo:
```tsx
import { AppointmentDetailDialog } from "./appointment-detail-dialog";
```

---

## PARTE 3 — Evitar propagação de click

Quando o card é clicado, o click event pode propagar para o slot vazio atrás (que abre o dialog de novo agendamento). Isso deve ser evitado.

No `AppointmentCard`, o `onClick` handler deve fazer `e.stopPropagation()`:

```tsx
onClick={(e) => {
  e.stopPropagation();
  onClick?.();
}}
onKeyDown={(e) => {
  if (onClick && (e.key === "Enter" || e.key === " ")) {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  }
}}
```

---

## PARTE 4 — Função helper `getStatusTransitionToast`

Essa função já existe no `agenda-operations-panel.tsx` mas é local (não exportada). Duas opções:

**Opção A (recomendada)**: Mover para `src/lib/appointments/status.ts` e exportar, para ser reutilizada em ambos os componentes.

```tsx
// Adicionar em src/lib/appointments/status.ts:
export function getStatusTransitionToast(status: AppointmentWorkflowStatus): string {
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
```

Depois, remover a versão local do `agenda-operations-panel.tsx` e importar de `@/lib/appointments/status`.

**Opção B**: Duplicar a função no novo componente (menos ideal mas funciona).

Escolher **Opção A**.

---

## PARTE 5 — Visual polish do dialog

### 5.1 — Animação de entrada
O dialog já usa o `Dialog` base que foi melhorado com animações spring. Não precisa fazer nada extra.

### 5.2 — Grid de status responsivo
Usar `grid grid-cols-4 gap-2` no desktop e `grid-cols-3` em mobile:
```tsx
<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
```

### 5.3 — Destaque visual do status atual
O status atual deve ter um `ring-2 ring-primary` + um dot indicator no canto. Os status não permitidos devem ter `opacity-30` para ficar visualmente claro que não são clicáveis.

### 5.4 — Seção de informações com ícones alinhados
Usar um layout consistente para cada info row:
```tsx
<div className="flex items-center gap-2 text-sm">
  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  <span>{timeLabel}</span>
</div>
```

### 5.5 — Preço com destaque
```tsx
<div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
  <span className="text-sm text-muted-foreground">Total</span>
  <span className="text-lg font-semibold tabular-nums">
    R$ {appointment.totalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
  </span>
</div>
```

---

## CHECKLIST FINAL (Build + Review)

Após implementar:

1. Rodar `npm run build` — zero erros.
2. Verificar no browser:
   - [ ] Clicar em card no grid → abre dialog de detalhe (não abre dialog de novo agendamento)
   - [ ] Dialog mostra nome do cliente, profissional, horário, serviços, preço
   - [ ] Botão "Ver Perfil" navega para `/clientes/{id}`
   - [ ] Telefone do cliente é clicável
   - [ ] Grid de status mostra TODOS os 8 status
   - [ ] Status atual tem ring visual
   - [ ] Status não permitidos estão desabilitados (opacity-30)
   - [ ] Clicar em PAID abre sub-dialog de checkout
   - [ ] Clicar em CANCELLED abre confirmação
   - [ ] Clicar em CONFIRMED muda direto (sem confirmação)
   - [ ] Após mudar status, dialog fecha e agenda atualiza
   - [ ] Dark mode funcionando
   - [ ] Toast de sucesso após transição
3. Testar: card com status SCHEDULED → clicar direto em PAID → checkout → confirmar → toast "Pagamento confirmado"
4. O painel operacional inferior continua funcionando normalmente (não foi alterado).
