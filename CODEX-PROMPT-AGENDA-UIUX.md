# Codex Prompt — Agenda: UI/UX Pro Max Overhaul

> **Contexto**: ERP SaaS para clínicas de beleza/estética.
> **Stack**: Next.js 16 (App Router), React 19, Tailwind v4, @base-ui/react, Lucide, Recharts, Sonner, next-themes.
> **Motion tokens**: `src/lib/motion.ts` já existe com DURATION, EASING, STAGGER.
> **Keyframes**: `src/app/globals.css` já contém fade-in, fade-in-up, fade-in-down, scale-in, etc.
> **Componentes de animação**: `animated-dialog.tsx`, `animated-list.tsx`, `scroll-reveal.tsx` já existem.
> **Regra**: toda mudança deve preservar a build (`npm run build` sem erros). Rodar build ao final.

---

## PARTE 1 — Appointment Card: Interatividade e Feedback Visual

### Arquivo: `src/components/agenda/appointment-card.tsx`

O card de agendamento atual é **estático** — não tem hover, press, nem cursor interativo. Ele precisa comunicar que é clicável/interativo.

### 1.1 — Hover elevado + cursor pointer

**Antes** (linha 52):
```tsx
className={cn(
  "absolute left-1 right-1 z-10 overflow-hidden rounded-md border transition-shadow hover:shadow-md",
```

**Depois**:
```tsx
className={cn(
  "absolute left-1 right-1 z-10 overflow-hidden rounded-md border cursor-pointer",
  "transition-all duration-200 ease-out",
  "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 hover:z-20",
  "active:scale-[0.98] active:shadow-sm",
```

**Por quê** (UI/UX Pro Max regras):
- `cursor-pointer`: regra `cursor-pointer` — todo elemento clicável deve ter cursor de mão.
- `hover:scale-[1.02]`: regra `scale-feedback` — leve escala no hover para affordance.
- `active:scale-[0.98]`: regra `press-feedback` — visual feedback on press.
- `hover:-translate-y-0.5`: regra `elevation-consistent` — elevação sutil para indicar interatividade.

### 1.2 — Borda esquerda colorida por status (visual hierarchy)

Adicionar uma borda lateral grossa colorida por status, tipo Kanban. Isso melhora a scanabilidade visual do grid.

**No objeto `APPOINTMENT_STATUS_CARD_STYLES`** em `src/lib/appointments/status.ts`, adicionar uma propriedade `leftBorder` a cada status:

```ts
export const APPOINTMENT_STATUS_CARD_STYLES: Record<
  AppointmentWorkflowStatus,
  { bg: string; border: string; text: string; badge: string; leftBorder: string }
> = {
  SCHEDULED: {
    // ... manter existentes ...
    leftBorder: "border-l-[3px] border-l-blue-500",
  },
  CONFIRMED: {
    leftBorder: "border-l-[3px] border-l-emerald-500",
  },
  WAITING: {
    leftBorder: "border-l-[3px] border-l-amber-500",
  },
  IN_PROGRESS: {
    leftBorder: "border-l-[3px] border-l-purple-500",
  },
  COMPLETED: {
    leftBorder: "border-l-[3px] border-l-slate-400",
  },
  PAID: {
    leftBorder: "border-l-[3px] border-l-emerald-600",
  },
  CANCELLED: {
    leftBorder: "border-l-[3px] border-l-red-500",
  },
  NO_SHOW: {
    leftBorder: "border-l-[3px] border-l-orange-500",
  },
};
```

Depois no `appointment-card.tsx`, adicionar `style.leftBorder` ao className do card.

### 1.3 — aria-label semântico

O card atualmente tem `title` como tooltip, mas não tem `role` nem `aria-label` para screen readers.

Adicionar ao div do card:
```tsx
role="button"
tabIndex={0}
aria-label={`Agendamento: ${appointment.customerName}, ${serviceLabel}, ${timeLabel}, status ${statusLabel}`}
```

**Por quê**: regras `aria-labels`, `keyboard-nav`, `voiceover-sr`.

### 1.4 — Ícones com aria-hidden

Os ícones `<User>` e `<Clock>` (linhas 90, 107) já não têm `aria-hidden`. Verificar e garantir:
```tsx
<User className="h-3 w-3 shrink-0" aria-hidden="true" />
<Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
```

---

## PARTE 2 — Grid da Agenda: UX e Responsividade

### Arquivo: `src/components/agenda/daily-calendar.tsx`

### 2.1 — Botão "Novo Agendamento" visível no header

**Problema**: Não existe um botão "Novo Agendamento" visível. O único jeito de criar é clicando em um slot vazio, o que não é descobrível.

**Regra violada**: `primary-action` — cada tela precisa de um CTA primário visível.

**Solução**: Adicionar um botão CTA no header, ao lado da navegação de data:

```tsx
<div className="flex items-center gap-2">
  <Button onClick={() => { setSelectedProfessional(professionals[0] ?? null); setSelectedStartTime(new Date()); setDialogOpen(true); }}>
    <Plus className="h-4 w-4" aria-hidden="true" />
    Novo Agendamento
  </Button>
  {/* ... botões de navegação existentes ... */}
</div>
```

### 2.2 — Empty state melhor para grid sem agendamentos

**Problema atual** (linha 189): mensagem genérica sem ação quando não há profissionais. Mas quando há profissionais mas 0 agendamentos no dia, o grid aparece todo vazio sem nenhuma orientação.

**Solução**: Se houver 0 appointments no dia (mas profissionais existem), exibir uma orientação sutil no centro do grid:

Após a renderização do grid (dentro do `<div className="relative flex-1 ..."`), se `appointments.length === 0`:
```tsx
{appointments.length === 0 && professionals.length > 0 && (
  <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
    <div className="animate-fade-in text-center text-muted-foreground/60">
      <CalendarX2 className="mx-auto h-10 w-10 mb-2" aria-hidden="true" />
      <p className="text-sm font-medium">Nenhum agendamento hoje</p>
      <p className="text-xs">Clique em um horário para agendar</p>
    </div>
  </div>
)}
```

Importar `CalendarX2` do Lucide.

**Por quê**: regra `empty-states` — mensagem útil + ação quando não há conteúdo.

### 2.3 — Header das colunas sticky com shadow

O header já é `sticky top-0`, mas quando o usuário scrolla, a separação entre header e conteúdo não é clara.

Adicionar shadow dinâmica: no container pai do grid, usar intersection observer ou simplesmente adicionar `shadow-[0_2px_4px_-1px_rgba(0,0,0,0.06)]` ao header:

```tsx
className="sticky top-0 z-20 min-w-[220px] bg-background border-b border-r last:border-r-0 px-3 py-3 text-center shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]"
```

### 2.4 — Slot hover com affordance mais clara

O hover do slot vazio já tem `hover:bg-primary/8`, mas o ícone `+` só aparece no hover (não é visível no mobile/touch).

**Regra violada**: `hover-vs-tap` — não depender apenas de hover.

**Solução**: No mobile, o slot deve ter uma dica tátil diferente — ao invés de esconder o `+`, tornar o background de hover mais perceptível e adicionar `touch-action: manipulation`:

```tsx
className="group absolute w-full cursor-pointer border-t border-dashed border-muted-foreground/15 transition-all duration-200 hover:bg-primary/8 hover:shadow-[inset_0_0_0_1px_var(--color-primary)] active:bg-primary/12"
style={{
  top: `${i * CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
  height: `${CALENDAR_CONFIG.SLOT_HEIGHT_PX}px`,
  touchAction: "manipulation",
}}
```

Remover o `hover:scale-[1.01]` do slot (escala no slot causa problemas de layout no grid absolute).

### 2.5 — Navegação de data com swipe gesture (mobile)

Para mobile, adicionar suporte a swipe esquerda/direita para navegar entre dias. Usar um hook simples:

Criar um hook `useSwipeNavigation` em `src/hooks/use-swipe-navigation.ts`:
```tsx
"use client";
import { useRef, useCallback } from "react";

type SwipeDirection = "left" | "right";

export function useSwipeNavigation(onSwipe: (direction: SwipeDirection) => void, threshold = 50) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - startX.current;
    const deltaY = e.changedTouches[0].clientY - startY.current;
    
    // Só detectar swipe horizontal (não vertical — regra gesture-conflicts)
    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      onSwipe(deltaX > 0 ? "right" : "left");
    }
  }, [onSwipe, threshold]);

  return { onTouchStart, onTouchEnd };
}
```

No `daily-calendar.tsx`, usar no container do grid:
```tsx
const swipeHandlers = useSwipeNavigation((dir) => {
  navigateDay(dir === "left" ? 1 : -1);
});

// No div do grid:
<div
  className="relative flex-1 h-[60vh] ..."
  {...swipeHandlers}
>
```

### 2.6 — Navegação de data: atalhos de teclado

Adicionar suporte a setas esquerda/direita do teclado para navegar entre dias:

```tsx
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Não interceptar se o foco está em um input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "ArrowLeft") navigateDay(-1);
    if (e.key === "ArrowRight") navigateDay(1);
  }
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [currentCivilDate]); // eslint-disable-line react-hooks/exhaustive-deps
```

**Por quê**: regra `keyboard-shortcuts` — oferecer alternativas de teclado.

### 2.7 — Linha "agora" com label

A linha vermelha de "agora" não tem label, fica confusa para quem não sabe o que é.

Adicionar um label ao lado do dot:

```tsx
{showNowLine && (
  <div
    className="absolute left-0 right-0 z-10 pointer-events-none"
    style={{ top: `${nowLineTop}px` }}
  >
    <div className="flex items-center">
      <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1 animate-pulse-ring" />
      <div className="flex-1 h-[2px] bg-red-500/70" />
    </div>
  </div>
)}
```

Na coluna de horários (eixo Y), adicionar um label especial quando `showNowLine` é true. Próximo ao slot correspondente, exibir o horário atual formatado em vermelho:

Adicionar no eixo Y, acima dos time slot labels, um label absoluto:
```tsx
{showNowLine && (
  <div
    className="absolute right-2 z-30 -mt-2 text-[10px] font-semibold text-red-500 tabular-nums"
    style={{ top: `${nowLineTop}px` }}
  >
    {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
  </div>
)}
```

Posicionar este label dentro da coluna de horários (o div sticky left-0).

---

## PARTE 3 — Novo Agendamento Dialog: Forms & Feedback

### Arquivo: `src/components/agenda/new-appointment-dialog.tsx`

### 3.1 — Indicadores visuais de campos obrigatórios

**Problema**: Os labels "Cliente *" e "Serviços *" usam asterisco, mas não há estilo diferenciado.

**Regra**: `required-indicators` — campos obrigatórios devem ter indicação visual clara.

**Solução**: Estilizar o asterisco:
```tsx
<Label>Cliente <span className="text-destructive">*</span></Label>
```

Aplicar o mesmo pattern em "Serviços *".

### 3.2 — Checkboxes nativos → estilizados

**Problema** (linhas 325-327): Os checkboxes de serviço usam `<input type="checkbox">` nativo HTML, que quebra a consistência visual do design system.

**Regra**: `system-controls` + `consistency`.

**Solução**: Substituir por um checkbox estilizado com Tailwind:
```tsx
<input
  type="checkbox"
  checked={isSelected}
  onChange={() => toggleService(svc.id)}
  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 focus:ring-offset-0"
/>
```

Mesmo tratamento para os checkboxes de equipamentos (linha 394).

### 3.3 — Resumo animado (progressive disclosure)

O resumo de duração/preço (linhas 342-354) aparece/desaparece bruscamente quando serviços são selecionados.

**Regra**: `state-transition` — transições de estado devem ser suaves.

**Solução**: Envolver em animação:
```tsx
{selectedServiceIds.length > 0 && (
  <div className="animate-fade-in-up flex items-center gap-4 rounded-md bg-muted/50 px-3 py-2 text-sm">
```

### 3.4 — Loading state no botão de submissão

**Problema** (linha 425): O botão mostra "Agendando..." mas sem spinner visual.

**Regra**: `loading-buttons` — botão durante async deve mostrar spinner.

**Solução**:
```tsx
<Button onClick={handleSubmit} disabled={isPending}>
  {isPending ? (
    <>
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Agendando...
    </>
  ) : (
    "Confirmar Agendamento"
  )}
</Button>
```

### 3.5 — Auto-focus no campo de busca ao abrir

**Regra**: `focus-management` — foco deve ir automaticamente para o primeiro campo interativo.

No `useEffect` do dialog, quando `open` muda para `true`, focar no input de busca de cliente:
```tsx
const customerSearchRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (open) {
    // Timeout para aguardar a animação de entrada do dialog
    const timer = setTimeout(() => customerSearchRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }
}, [open]);
```

Adicionar `ref={customerSearchRef}` ao Input de busca de cliente.

### 3.6 — Validation visual: erro inline

**Problema** (linha 184): Quando o usuário tenta submeter sem preencher, aparece apenas um toast genérico.

**Regra**: `error-placement` — erro deve aparecer perto do campo com problema, não apenas no topo.

**Solução**: Manter o toast para feedback rápido, mas também adicionar um estado de erro nos campos:

```tsx
const [fieldErrors, setFieldErrors] = useState<{ customer?: boolean; services?: boolean }>({});

function handleSubmit() {
  const errors: typeof fieldErrors = {};
  if (!customerId) errors.customer = true;
  if (selectedServiceIds.length === 0) errors.services = true;
  
  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    toast.error("Preencha todos os campos obrigatórios.");
    return;
  }
  
  setFieldErrors({});
  // ... resto do submit
}
```

No label de Cliente:
```tsx
<Label className={fieldErrors.customer ? "text-destructive" : ""}>
  Cliente <span className="text-destructive">*</span>
</Label>
{fieldErrors.customer && (
  <p className="text-xs text-destructive" role="alert">Selecione um cliente</p>
)}
```

Mesmo pattern para Serviços.

---

## PARTE 4 — Painel Operacional: Visual Polish

### Arquivo: `src/components/agenda/agenda-operations-panel.tsx`

### 4.1 — Contadores no header com cor semântica

**Problema**: Os contadores no topo do painel (Agendado 0, Confirmado 0, etc.) são todos iguais visualmente — não há hierarquia ou cor.

**Solução**: Adicionar uma cor sutil de borda superior a cada counter que corresponda ao status:

```tsx
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
```

Aplicar no counter:
```tsx
<div
  key={counter.status}
  className={cn(
    "rounded-lg border bg-background px-3 py-2 text-xs",
    STATUS_COUNTER_COLORS[counter.status]
  )}
>
```

### 4.2 — Lanes com ícone de status no header

Cada lane (Agendado, Confirmado, etc.) pode ter um ícone semântico ao lado do título para reforçar visualmente:

```tsx
const STATUS_ICONS: Record<AppointmentWorkflowStatus, ComponentType<{ className?: string }>> = {
  SCHEDULED: Clock3,
  CONFIRMED: UserRoundCheck,
  WAITING: Clock3,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle2,
  PAID: Receipt,
  CANCELLED: XCircle,
  NO_SHOW: AlertCircle,
};
```

No `StatusLane` CardTitle:
```tsx
const Icon = STATUS_ICONS[status];
<div className="flex items-center gap-2">
  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  <CardTitle className="text-base">{APPOINTMENT_STATUS_LABELS[status]}</CardTitle>
</div>
```

### 4.3 — Botões de ação com confirmação para destrutivos

**Problema**: Os botões "Cancelar" e "Faltou" executam imediatamente sem confirmação.

**Regra**: `confirmation-dialogs` — confirmar antes de ações destrutivas.

**Solução**: Antes de chamar `handleTransition` para CANCELLED ou NO_SHOW, exibir um AlertDialog de confirmação:

Adicionar estado:
```tsx
const [confirmAction, setConfirmAction] = useState<AppointmentWorkflowStatus | null>(null);
```

Modificar `handleActionClick`:
```tsx
function handleActionClick(nextStatus: AppointmentWorkflowStatus) {
  if (nextStatus === "PAID") { /* ... existente ... */ }
  if (nextStatus === "CANCELLED" || nextStatus === "NO_SHOW") {
    setConfirmAction(nextStatus);
    return;
  }
  handleTransition(nextStatus);
}
```

Adicionar um AlertDialog genérico no card:
```tsx
<AlertDialog open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>
        {confirmAction === "CANCELLED" ? "Cancelar Agendamento?" : "Marcar como Falta?"}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {confirmAction === "CANCELLED"
          ? "O agendamento será marcado como cancelado. Esta ação não pode ser desfeita."
          : "O agendamento será marcado como falta (no-show). Esta ação não pode ser desfeita."}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isPending}>
        Voltar
      </Button>
      <Button
        variant="destructive"
        onClick={() => { if (confirmAction) handleTransition(confirmAction); setConfirmAction(null); }}
        disabled={isPending}
      >
        {confirmAction === "CANCELLED" ? "Sim, Cancelar" : "Sim, Marcar Falta"}
      </Button>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 4.4 — Animação de transição entre lanes

Quando um appointment muda de status (ex: Agendado → Confirmado), ele desaparece de uma lane e aparece em outra sem animação.

**Regra**: `continuity` — manter continuidade espacial nas transições.

**Solução prática** (sem layout animation library): Adicionar `animate-fade-in-up` ao `OperationalAppointmentCard`:

```tsx
<div className="animate-fade-in-up rounded-xl border bg-background/70 p-3 shadow-sm">
```

### 4.5 — Botões de ação: touch targets mínimos

**Problema**: Os botões de ação usam `size="xs"` — podem ser menores que 44×44px.

**Regra**: `touch-target-size` — mínimo 44×44pt.

**Solução**: Adicionar `min-h-[44px]` nos botões de ação, ou trocar `size="xs"` para `size="sm"`:

```tsx
<Button
  key={action.nextStatus}
  size="sm"
  variant={action.variant}
  disabled={isPending}
  onClick={() => handleActionClick(action.nextStatus)}
  className="min-h-[36px]"
>
```

Se `size="sm"` já fornece 36px de altura, complementar com padding para chegar perto de 44px no mobile. Pelo menos garantir `min-h-[36px] min-w-[44px]`.

---

## PARTE 5 — Responsividade Mobile

### 5.1 — Grid scroll horizontal com snap

O grid já tem `overflow-x-auto`, mas no mobile a experiência de scroll é ruim sem snap points.

Adicionar ao container do grid body:
```tsx
className="min-w-full w-max snap-x snap-mandatory md:snap-none"
```

E nas colunas de profissional:
```tsx
className="relative min-w-[220px] border-r last:border-r-0 snap-start"
```

### 5.2 — Painel de operações: layout responsivo

O `LaneGrid` usa `xl:grid-cols-4` que colapsa para 1 coluna no mobile. Em tablet (md), deveria ser 2 colunas.

**Mudar**:
```tsx
<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
```

### 5.3 — Header responsivo

Em mobile, o header com "Agenda" + data + botões pode ficar apertado.

**Mudar** o layout para empilhar em mobile:
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="animate-fade-in-down">
    <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
    <p className="text-sm text-muted-foreground capitalize">{dateFormatted}</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Botão "Novo Agendamento" + navegação */}
  </div>
</div>
```

---

## PARTE 6 — Accessibility Deep Dive

### 6.1 — role e aria no grid

O grid inteiro não tem landmark semântico.

**Solução**: Envolver o grid em:
```tsx
<div
  role="grid"
  aria-label={`Agenda de ${dateFormatted}`}
  className="relative flex-1 h-[60vh] ..."
>
```

As colunas de profissional devem ter `role="columnheader"`:
```tsx
<div
  key={prof.id}
  role="columnheader"
  className="sticky top-0 z-20 ..."
>
```

### 6.2 — Tabela acessível para screen readers (sr-only)

Adicionar uma versão `sr-only` dos dados da agenda como tabela HTML para screen readers:

```tsx
<table className="sr-only">
  <caption>Agendamentos de {dateFormatted}</caption>
  <thead>
    <tr>
      <th>Horário</th>
      <th>Profissional</th>
      <th>Cliente</th>
      <th>Serviço</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    {appointments.map((apt) => (
      <tr key={apt.id}>
        <td>{timeLabel}</td>
        <td>{apt.professionalName}</td>
        <td>{apt.customerName}</td>
        <td>{apt.services.map(s => s.name).join(", ")}</td>
        <td>{getAppointmentStatusLabel(apt.status)}</td>
      </tr>
    ))}
  </tbody>
</table>
```

Posicionar antes do grid visual.

### 6.3 — Focus ring nos slots

Os slots clicáveis não têm focus ring visível para navegação por teclado.

**Regra**: `focus-states` — focus rings visíveis em elementos interativos.

Adicionar ao slot div:
```tsx
tabIndex={0}
role="button"
aria-label={`Agendar com ${prof.name} às ${slot.label}`}
onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSlotClick(prof, slot.hour, slot.minute); } }}
className="... focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none ..."
```

⚠️ **IMPORTANTE**: Não adicionar tabIndex em TODOS os slots (seriam 24×N slots = centenas de tab stops). Apenas nos da primeira hora visível ou usar `roving tabindex` pattern. Alternativa mais simples: deixar sem tabIndex individual e confiar no botão "Novo Agendamento" + tabela sr-only para acessibilidade por teclado.

**Decisão recomendada**: NÃO adicionar tabIndex nos slots individuais (evitar tab hell). Confiar no botão CTA primário "Novo Agendamento" + sr-only table.

### 6.4 — Painel operacional: aria-live para contadores

Quando um agendamento muda de status (ex: "Confirmado" vai de 0→1), screen readers devem ser notificados.

Adicionar `aria-live="polite"` ao container de contadores:
```tsx
<div className="flex flex-wrap gap-2" aria-live="polite" aria-atomic="true">
```

---

## PARTE 7 — Micro-interações e Polish

### 7.1 — Linha "agora" com animação pulse

A linha vermelha de "agora" deve ter o dot com pulse suave (já existe `animate-pulse-ring` no globals.css). Verificar que está aplicado no dot:
```tsx
<div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1 animate-pulse-ring" />
```

Se `animate-pulse-ring` não estiver definido no globals.css, adicionar:
```css
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgb(239 68 68 / 0.5); }
  70% { box-shadow: 0 0 0 6px rgb(239 68 68 / 0); }
  100% { box-shadow: 0 0 0 0 rgb(239 68 68 / 0); }
}
.animate-pulse-ring {
  animation: pulse-ring 2s ease-out infinite;
}
```

### 7.2 — Scroll automático para "agora"

Quando o usuário abre a agenda no dia de hoje, o scroll do grid deveria posicionar automaticamente na hora atual.

Adicionar no `daily-calendar.tsx`:
```tsx
const gridRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (showNowLine && gridRef.current) {
    // Scroll para posicionar a linha "agora" um pouco acima do centro visível
    const scrollTarget = Math.max(0, nowLineTop - 150);
    gridRef.current.scrollTo({ top: scrollTarget, behavior: "smooth" });
  }
}, [showNowLine, nowLineTop]);
```

Adicionar `ref={gridRef}` ao div do grid com overflow.

### 7.3 — Appointment card: tooltip com detalhes ao hover (desktop)

O `title` nativo é feio e lento. Para desktop, mostrar um tooltip mais rico não é viável sem uma library de tooltip. Manter o `title` nativo por enquanto mas garantir que ele contém informação útil e completa (já está bom no código atual).

### 7.4 — Success feedback no checkout

Após marcar um agendamento como "Pago" com sucesso, adicionar um flash visual no card do painel antes dele mover para a lane "Pago":

Isso já é parcialmente coberto pelo toast. Manter toast como feedback primário.

---

## CHECKLIST FINAL (Build + Review)

Após implementar todas as partes acima:

1. Rodar `npm run build` — zero erros.
2. Verificar no browser:
   - [ ] Appointment card tem hover elevation e cursor pointer
   - [ ] Borda colorida esquerda por status visível
   - [ ] Botão "Novo Agendamento" visível no header
   - [ ] Empty state do grid quando 0 agendamentos
   - [ ] Linha "agora" com pulse e label de horário
   - [ ] Auto-scroll para hora atual ao carregar
   - [ ] Contadores no painel com cor por status
   - [ ] Ícones nos headers de lane
   - [ ] Confirmação antes de Cancelar/Faltou
   - [ ] Navegação por teclado (setas ←→ trocam dia)
   - [ ] Header responsivo em mobile (flex-col)
   - [ ] Lanes 2-cols no tablet, 4-cols no desktop
   - [ ] Spinner no botão "Confirmar Agendamento"
   - [ ] Asteriscos estilizados nos campos obrigatórios
   - [ ] sr-only table com dados dos agendamentos
3. Testar dark mode — verificar que todas as cores de status funcionam.
4. Testar `prefers-reduced-motion` — animações devem ser desativadas.
