# Prompt para Codex — Apple-Level Animations & Motion System

## Contexto do Projeto

**Receps ERP** — SaaS multitenant para saúde e beleza.

- **Stack**: Next.js 16.2 (App Router, Server Components), React 19, TypeScript, Tailwind CSS v4, shadcn/base-ui (@base-ui/react), Recharts, Lucide React, Sonner, next-themes
- **Idioma**: pt-BR
- **Sprints 1-4 já implementados**: aria-labels, tabular-nums, loading.tsx, lazy load Recharts, sidebar responsiva, empty states, stagger cards

## Missão

Transformar o ERP inteiro numa experiência fluida estilo Apple — cada interação deve fazer o usuário sentir que a interface está **viva e conectada**. Nada de snaps abruptos. Toda transição de estado deve ter causa-efeito visual: algo cresce, desliza, dissolve, responde.

## Filosofia de Animação (Apple HIG + Material Motion)

Seguir estas regras obrigatoriamente:

1. **Toda animação comunica causalidade** — o usuário deve entender DE ONDE veio e PARA ONDE vai
2. **Spring physics > cubic-bezier** — movimentos naturais com overshoot sutil
3. **Enter 300ms, exit 200ms** — saídas mais rápidas que entradas
4. **Stagger 40-60ms** entre itens de lista
5. **prefers-reduced-motion** sempre respeitado — nunca ignorar
6. **Nunca bloquear input** — UI interativa durante animações
7. **Transform + opacity apenas** — nunca animar width/height/top/left
8. **Consistência global** — todas as animações compartilham o mesmo ritmo

---

## PARTE 1: Motion Foundation (Sistema de Animação Global)

### Tarefa 1.1: Criar arquivo de tokens de animação

**Arquivo a CRIAR:** `src/lib/motion.ts`

Este arquivo centraliza todas as constantes de animação do projeto. Todo componente que anima importa daqui.

```tsx
/**
 * Tokens de animação centralizados — Apple HIG + Material Motion.
 * Importar em qualquer componente que precise animar.
 */

// ── Durations (ms) ──────────────────────────────────────────────
export const DURATION = {
  instant: 100,    // Micro feedback (press, toggle)
  fast: 150,       // Hover states, small elements
  normal: 250,     // Standard transitions (modals, panels)
  slow: 400,       // Page-level, complex transitions
  chart: 800,      // Data visualization animations
} as const;

// ── Easings (CSS) ───────────────────────────────────────────────
// Spring-inspired easings que imitam física real
export const EASING = {
  // Standard: para a maioria das transições
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  // Enter: elementos aparecendo (desacelera no final)
  enter: "cubic-bezier(0, 0, 0.2, 1)",
  // Exit: elementos sumindo (acelera no início)
  exit: "cubic-bezier(0.4, 0, 1, 1)",
  // Spring: para movimentos com bounce sutil
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  // Bounce: para feedback de tap/press
  bounce: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
} as const;

// ── Stagger delay (ms) ──────────────────────────────────────────
export const STAGGER = {
  fast: 30,   // Listas densas
  normal: 50, // Cards, grid items
  slow: 80,   // Seções grandes
} as const;

// ── CSS custom properties (injetar via style) ───────────────────
export function staggerDelay(index: number, base: number = STAGGER.normal): React.CSSProperties {
  return { animationDelay: `${index * base}ms` };
}

// ── Reduced motion helper ───────────────────────────────────────
// Para uso em hooks client-side:
export function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

**Critério:** Arquivo existe, exporta todos os tokens, é importável de qualquer componente.

---

### Tarefa 1.2: Adicionar keyframes globais ao CSS

**Arquivo:** `src/app/globals.css`

Adicionar APÓS o bloco `@layer base { ... }` existente:

```css
/* ==========================================================================
   MOTION SYSTEM — Keyframes globais para animações Apple-level
   ========================================================================== */

/* ── Fade & Slide (entrada de elementos) ─────────────────────── */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-left {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes fade-in-right {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ── Scale (modais, cards expansíveis) ───────────────────────── */
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes scale-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
}

/* Expand from trigger — para o efeito "botão vira modal" */
@keyframes expand-from-trigger {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(8px);
    border-radius: 16px;
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
    border-radius: 12px;
  }
}

@keyframes collapse-to-trigger {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.85) translateY(8px);
  }
}

/* ── Slide (drawers, painéis laterais) ───────────────────────── */
@keyframes slide-in-from-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slide-out-to-right {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}

@keyframes slide-in-from-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slide-out-to-left {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

@keyframes slide-in-from-bottom {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes slide-out-to-bottom {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}

/* ── Pulse & Glow (feedback sutil) ───────────────────────────── */
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 var(--color-primary); opacity: 0.4; }
  100% { box-shadow: 0 0 0 8px var(--color-primary); opacity: 0; }
}

@keyframes success-check {
  0% { transform: scale(0) rotate(-45deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

/* ── Utility Classes ─────────────────────────────────────────── */
.animate-fade-in { animation: fade-in 0.25s cubic-bezier(0.2, 0, 0, 1) both; }
.animate-fade-in-up { animation: fade-in-up 0.4s cubic-bezier(0.2, 0, 0, 1) both; }
.animate-fade-in-down { animation: fade-in-down 0.3s cubic-bezier(0.2, 0, 0, 1) both; }
.animate-fade-in-left { animation: fade-in-left 0.3s cubic-bezier(0.2, 0, 0, 1) both; }
.animate-fade-in-right { animation: fade-in-right 0.3s cubic-bezier(0.2, 0, 0, 1) both; }
.animate-scale-in { animation: scale-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.animate-expand-in { animation: expand-from-trigger 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

/* ── Reduced Motion: desabilitar TUDO ────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-in,
  .animate-fade-in-up,
  .animate-fade-in-down,
  .animate-fade-in-left,
  .animate-fade-in-right,
  .animate-scale-in,
  .animate-expand-in,
  [class*="animate-"] {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**IMPORTANTE:** O projeto já tem um `animate-fade-in-up` do Sprint 2 anterior. Substituí-lo por esta versão que usa o easing correto. Se houver conflito, a nova versão sobrescreve a anterior.

**Critério:** Todos os keyframes existem. Classe `.animate-fade-in-up` funciona como antes mas com easing melhorado. `prefers-reduced-motion` desabilita tudo.

---

## PARTE 2: Dialog & Modal System — "O Botão Vira a Tela"

### Tarefa 2.1: Melhorar animações do Dialog existente

**Arquivo:** `src/components/ui/dialog.tsx`

O Dialog atual usa `duration-100` e `zoom-in-95` — muito rápido e mecânico. Vamos torná-lo Apple-level:

**DialogOverlay — melhorar blur e duração:**
```tsx
function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/25 backdrop-blur-sm",
        "data-open:animate-in data-open:fade-in-0 data-open:duration-250",
        "data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200",
        className
      )}
      {...props}
    />
  )
}
```

**DialogContent — animação expand mais fluida:**
```tsx
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          // Animação de entrada: expand com spring
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-90 data-open:duration-300",
          "data-open:[animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          // Animação de saída: collapse rápido
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-200",
          "data-closed:[animation-timing-function:cubic-bezier(0.4,0,1,1)]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon aria-hidden="true" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}
```

**Mudanças chave:**
- Overlay: `bg-black/10` → `bg-black/25` (scrim mais visível), `backdrop-blur-xs` → `backdrop-blur-sm` (blur mais perceptível), `duration-100` → `duration-250`/`200`
- Content: `zoom-in-95` → `zoom-in-90` (entrada mais dramática), `duration-100` → `duration-300`/`200`, adicionado `animation-timing-function` spring para entrada e easing acelerado para saída
- O XIcon agora tem `aria-hidden="true"`

**IMPORTANTE:** As classes `data-open:duration-300` e `data-open:[animation-timing-function:...]` são Tailwind v4 com arbitrary values. Se não funcionar, use style inline ou adicione classes CSS custom. O objetivo é: entrada 300ms com spring, saída 200ms rápida.

**Critério:** Dialogs abrem com scale spring (começa menor, expande com bounce sutil) e fecham rapidamente.

---

### Tarefa 2.2: Criar componente AnimatedDialog para efeito "botão vira tela"

**Arquivo a CRIAR:** `src/components/ui/animated-dialog.tsx`

Este é um Dialog especial que captura a posição do botão trigger e anima o modal expandindo A PARTIR daquele ponto. Efeito: o usuário clica "Novo Cliente" e o modal parece crescer do botão.

```tsx
"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

/**
 * AnimatedDialog — Dialog que expande a partir do elemento trigger.
 * 
 * Uso:
 * <AnimatedDialog open={open} onOpenChange={setOpen}>
 *   <AnimatedDialogTrigger>
 *     <Button>Novo Cliente</Button>
 *   </AnimatedDialogTrigger>
 *   <AnimatedDialogContent>
 *     ...conteúdo do form...
 *   </AnimatedDialogContent>
 * </AnimatedDialog>
 */

const TriggerRefContext = React.createContext<React.RefObject<HTMLElement | null> | null>(null);

function AnimatedDialog({ children, ...props }: DialogPrimitive.Root.Props) {
  const triggerRef = React.useRef<HTMLElement | null>(null);
  return (
    <TriggerRefContext.Provider value={triggerRef}>
      <DialogPrimitive.Root data-slot="animated-dialog" {...props}>
        {children}
      </DialogPrimitive.Root>
    </TriggerRefContext.Provider>
  );
}

function AnimatedDialogTrigger({
  children,
  className,
  ...props
}: DialogPrimitive.Trigger.Props) {
  const triggerRef = React.useContext(TriggerRefContext);

  return (
    <DialogPrimitive.Trigger
      data-slot="animated-dialog-trigger"
      className={className}
      ref={(node) => {
        if (triggerRef) triggerRef.current = node;
      }}
      {...props}
    >
      {children}
    </DialogPrimitive.Trigger>
  );
}

function AnimatedDialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  const triggerRef = React.useContext(TriggerRefContext);
  const popupRef = React.useRef<HTMLDivElement | null>(null);

  // Calcular transform-origin baseado na posição do trigger
  React.useEffect(() => {
    const trigger = triggerRef?.current;
    const popup = popupRef.current;
    if (!trigger || !popup) return;

    const triggerRect = trigger.getBoundingClientRect();
    const centerX = triggerRect.left + triggerRect.width / 2;
    const centerY = triggerRect.top + triggerRect.height / 2;

    // Converter coordenadas do trigger para % relativo ao viewport center
    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const originX = 50 + ((centerX - viewportCenterX) / popup.offsetWidth) * 100;
    const originY = 50 + ((centerY - viewportCenterY) / popup.offsetHeight) * 100;

    popup.style.transformOrigin = `${Math.round(originX)}% ${Math.round(originY)}%`;
  });

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 isolate z-50 bg-black/25 backdrop-blur-sm",
          "data-open:animate-in data-open:fade-in-0 data-open:duration-250",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:duration-200"
        )}
      />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="animated-dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
          // Expand from trigger com spring easing
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-75 data-open:duration-350",
          "data-open:[animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)]",
          // Collapse back
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-90 data-closed:duration-200",
          "data-closed:[animation-timing-function:cubic-bezier(0.4,0,1,1)]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          data-slot="animated-dialog-close"
          render={
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            />
          }
        >
          <XIcon aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

// Re-exportar subcomponentes do Dialog normal que não mudam
function AnimatedDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-2", className)} {...props} />;
}

function AnimatedDialogFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function AnimatedDialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("font-heading text-base leading-none font-medium", className)} {...props} />;
}

function AnimatedDialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export {
  AnimatedDialog,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogFooter,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
};
```

**IMPORTANTE:**
- Se `@base-ui/react/dialog` não suportar `ref` direto no `Trigger` ou `Popup`, adapte usando um wrapper `<div ref={...}>`. O objetivo é capturar a posição do botão trigger.
- Se `data-open:zoom-in-75` não existir no tw-animate-css, use a classe CSS custom `.animate-expand-in` do keyframe `expand-from-trigger` criado na Tarefa 1.2.
- O `transformOrigin` dinâmico é o que faz o modal parecer "nascer" do botão.

**Critério:** Ao abrir, o modal expande a partir da posição do botão. Ao fechar, colapsa de volta.

---

## PARTE 3: Listas & Cards — Tudo Aparece com Vida

### Tarefa 3.1: Criar componente AnimatedList para stagger reveal

**Arquivo a CRIAR:** `src/components/ui/animated-list.tsx`

Componente wrapper que aplica stagger fade-in-up em qualquer lista de children.

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AnimatedListProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay base entre cada item (ms) */
  stagger?: number;
  /** Classe de animação aplicada a cada child */
  animation?: string;
  /** Tag HTML do container */
  as?: "div" | "ul" | "ol" | "section";
};

/**
 * Wrapper que aplica animação stagger em cada child direto.
 * Cada child recebe um animation-delay incremental.
 *
 * Uso:
 * <AnimatedList stagger={50} className="grid gap-2">
 *   {items.map(item => <Card key={item.id}>...</Card>)}
 * </AnimatedList>
 */
export function AnimatedList({
  children,
  className,
  stagger = 50,
  animation = "animate-fade-in-up",
  as: Tag = "div",
}: AnimatedListProps) {
  const items = React.Children.toArray(children);

  return (
    <Tag className={className}>
      {items.map((child, index) => (
        <div
          key={React.isValidElement(child) ? (child.key ?? index) : index}
          className={animation}
          style={{ animationDelay: `${index * stagger}ms` }}
        >
          {child}
        </div>
      ))}
    </Tag>
  );
}
```

**Critério:** Componente funciona como wrapper. Filhos aparecem um a um com delay crescente.

---

### Tarefa 3.2: Aplicar AnimatedList na lista de Clientes

**Arquivo:** `src/components/customer/customer-list.tsx`

**O que mudar:**

1. Importar AnimatedList
2. Envolver o grid de customer cards com `<AnimatedList>`
3. Adicionar hover lift nos cards
4. Adicionar transição suave no filtro de busca

```tsx
import { AnimatedList } from "@/components/ui/animated-list";

// No JSX, substituir o grid de cards:

// ANTES:
// <div className="grid gap-2">
//   {filtered.map((customer) => ( ... ))}
// </div>

// DEPOIS:
<AnimatedList className="grid gap-2" stagger={40}>
  {filtered.map((customer) => (
    <Link key={customer.id} href={`/clientes/${customer.id}`}>
      <Card className="transition-all duration-200 ease-out hover:bg-muted/50 hover:shadow-sm hover:-translate-y-0.5 cursor-pointer">
        {/* ... conteúdo do card inalterado ... */}
      </Card>
    </Link>
  ))}
</AnimatedList>
```

Também melhorar o hover do card: `transition-colors` → `transition-all duration-200 ease-out` e adicionar `hover:shadow-sm hover:-translate-y-0.5`.

**Também:** Converter o Dialog de "Novo Cliente" para usar `AnimatedDialog`:

```tsx
import {
  AnimatedDialog,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
} from "@/components/ui/animated-dialog";

// Substituir o Dialog + botão separados por:
<AnimatedDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <AnimatedDialogTrigger
    render={
      <Button type="button" className="sm:self-stretch">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Novo Cliente
      </Button>
    }
  />
  <AnimatedDialogContent className="sm:max-w-lg">
    <AnimatedDialogHeader>
      <AnimatedDialogTitle>Novo Cliente</AnimatedDialogTitle>
      <AnimatedDialogDescription>
        Cadastre manualmente um novo cliente ou paciente no estabelecimento.
      </AnimatedDialogDescription>
    </AnimatedDialogHeader>
    <CustomerCreateForm
      onCancel={() => setIsDialogOpen(false)}
      onSuccess={() => setIsDialogOpen(false)}
    />
  </AnimatedDialogContent>
</AnimatedDialog>
```

**Critério:** Cards de clientes aparecem com stagger. Botão "Novo Cliente" abre modal que expande a partir do botão. Cards têm lift sutil no hover.

---

### Tarefa 3.3: Aplicar stagger + hover em TODAS as listas de cards do sistema

**Arquivos para modificar (mesmo padrão da Tarefa 3.2):**

1. **`src/components/settings/service-catalog-panel.tsx`**
   - Encontrar o loop que renderiza cards de serviços
   - Envolver com `<AnimatedList stagger={40}>`
   - Adicionar hover lift nos cards: `transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5`
   - Converter Dialog de criar/editar serviço para `AnimatedDialog`

2. **`src/components/settings/team-panel.tsx`**
   - Encontrar o loop que renderiza membros da equipe
   - Envolver com `<AnimatedList stagger={40}>`
   - Hover lift nos cards de membro
   - Converter Dialog para `AnimatedDialog`

3. **`src/components/inventory/product-catalog-panel.tsx`**
   - Encontrar o loop que renderiza produtos
   - Envolver com `<AnimatedList stagger={40}>`
   - Hover lift nos cards
   - Converter Dialog para `AnimatedDialog`

4. **`src/components/packages/package-panel.tsx`**
   - Encontrar o loop que renderiza pacotes
   - Envolver com `<AnimatedList stagger={40}>`
   - Hover lift nos cards
   - Converter Dialog para `AnimatedDialog`

5. **`src/components/financial/expense-panel.tsx`**
   - Encontrar o loop que renderiza despesas
   - Envolver com `<AnimatedList stagger={30}>`
   - Hover lift

6. **`src/components/financial/commission-panel.tsx`**
   - Encontrar o loop que renderiza cards de profissionais
   - Envolver com `<AnimatedList stagger={50}>`
   - Hover sutil nos cards expansíveis

**Padrão universal de hover para cards clicáveis/interativos:**
```
transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-0.5
```

**Padrão universal de hover para cards não-clicáveis:**
```
transition-shadow duration-200 hover:shadow-sm
```

**IMPORTANTE:** Não converter TODOS os Dialogs para AnimatedDialog — apenas os que têm trigger button visível (os de "Criar novo X"). Dialogs que abrem por estado interno (como edição via ícone) mantêm o Dialog normal com as animações melhoradas da Tarefa 2.1.

**Critério:** Toda lista de cards no ERP aparece com stagger. Todos os cards têm hover lift. Os principais "Criar X" usam AnimatedDialog.

---

## PARTE 4: Page-Level Transitions

### Tarefa 4.1: Criar loading.tsx para TODAS as rotas que não têm

**Arquivos a CRIAR:**
- `src/app/(dashboard)/clientes/loading.tsx`
- `src/app/(dashboard)/clientes/[id]/loading.tsx`
- `src/app/(dashboard)/profissionais/loading.tsx`
- `src/app/(dashboard)/servicos/loading.tsx`
- `src/app/(dashboard)/pacotes/loading.tsx`
- `src/app/(dashboard)/produtos/loading.tsx`
- `src/app/(dashboard)/produtos/estoque/loading.tsx`
- `src/app/(dashboard)/financeiro/loading.tsx`
- `src/app/(dashboard)/financeiro/caixa/loading.tsx`
- `src/app/(dashboard)/financeiro/extrato/loading.tsx`
- `src/app/(dashboard)/financeiro/despesas/loading.tsx`
- `src/app/(dashboard)/financeiro/comissoes/loading.tsx`
- `src/app/(dashboard)/prontuarios/loading.tsx`
- `src/app/(dashboard)/configuracoes/aparencia/loading.tsx`
- `src/app/(dashboard)/configuracoes/equipe/loading.tsx`
- `src/app/(dashboard)/configuracoes/recursos/loading.tsx`
- `src/app/(dashboard)/configuracoes/contas/loading.tsx`
- `src/app/(dashboard)/configuracoes/servicos/loading.tsx`

**Cada loading.tsx deve refletir o layout da página que está carregando.** Padrão base:

```tsx
export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />

      {/* Card list skeleton */}
      <div className="grid gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Variações por seção:**

- **Clientes**: Card list com avatar circular + 2 linhas + badge (como acima)
- **Clientes/[id]**: Profile header skeleton (avatar grande + nome + badges) + tabs skeleton
- **Profissionais/Serviços/Pacotes**: Header + search + card list (como base)
- **Produtos**: Header + search + card grid (com badges de estoque)
- **Financeiro (hub)**: 4 KPI cards skeleton + grid de shortcuts
- **Financeiro/Despesas**: Month nav skeleton + summary cards + expense list
- **Financeiro/Comissões**: 3 KPI cards + expandable professional cards
- **Financeiro/Caixa**: Status card + KPIs + transaction table
- **Financeiro/Extrato**: Date filter bar + table
- **Prontuários**: 3 stat cards + recent forms list
- **Configurações/***: Header + card/form content

Use `animate-fade-in` no wrapper principal para que os skeletons apareçam suavemente.

**Critério:** Toda rota tem loading.tsx. Os skeletons refletem o layout real da página.

---

### Tarefa 4.2: Animar cabeçalhos de página com fade-in-down

**TODAS as páginas** que têm um `<h2>` ou heading principal devem receber `animate-fade-in-down` no header.

**Padrão:**

```tsx
// Em cada page.tsx, no bloco do header:
<div className="animate-fade-in-down">
  <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
  <p className="text-sm text-muted-foreground">
    Gerencie seus clientes e pacientes.
  </p>
</div>
```

**Arquivos a atualizar:**
- `src/app/(dashboard)/clientes/page.tsx`
- `src/app/(dashboard)/profissionais/page.tsx`
- `src/app/(dashboard)/servicos/page.tsx`
- `src/app/(dashboard)/pacotes/page.tsx`
- `src/app/(dashboard)/produtos/page.tsx`
- `src/app/(dashboard)/financeiro/page.tsx`
- `src/app/(dashboard)/prontuarios/page.tsx`
- `src/app/(dashboard)/configuracoes/*/page.tsx` (todas as sub-rotas de settings que tenham header)

**NOTA:** A maioria dessas páginas é Server Component — `className="animate-fade-in-down"` funciona sem "use client" porque é CSS puro.

**Critério:** Ao navegar para qualquer seção, o título aparece com slide-down suave.

---

## PARTE 5: Micro-Interações Específicas por Seção

### Tarefa 5.1: Agenda — Animação nos appointment cards

**Arquivo:** `src/components/agenda/daily-calendar.tsx`

**O que adicionar:**

1. **Slots vazios**: ao hover, o slot deve ter uma animação de "convite" — brilho sutil que indica clicabilidade:
```tsx
// No slot vazio:
className="... transition-all duration-200 hover:bg-primary/8 hover:shadow-[inset_0_0_0_1px_var(--color-primary)] hover:scale-[1.01]"
```

2. **Appointment cards posicionados absolutamente**: adicionar entrada com fade-in rápido:
```tsx
className="... animate-fade-in"
```

3. **Botões de navegação de data (prev/next)**: adicionar scale feedback no clique:
```tsx
className="... active:scale-95 transition-transform"
```

---

### Tarefa 5.2: Perfil do Cliente — Hero transition

**Arquivo:** `src/components/customer/profile-header.tsx`

**O que adicionar:**
1. O avatar grande deve ter `animate-scale-in` para aparecer com bounce
2. O nome e badges devem ter `animate-fade-in-left`
3. Os KPI cards (visitas, LTV) devem ter `animate-fade-in-up` com stagger

```tsx
// Avatar:
<div className="... animate-scale-in">
  {/* avatar content */}
</div>

// Nome + tier badge:
<div className="... animate-fade-in-left" style={{ animationDelay: "100ms" }}>
  <h2>{customer.name}</h2>
  <Badge>...</Badge>
</div>

// KPI cards:
<div className="animate-fade-in-up" style={{ animationDelay: "150ms" }}>
  {/* Visitas */}
</div>
<div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
  {/* LTV */}
</div>
```

---

### Tarefa 5.3: Tabs — Conteúdo anima ao trocar de aba

**Arquivo:** `src/components/ui/tabs.tsx`

Adicionar animação de fade no `TabsContent`:

```tsx
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none",
        "animate-fade-in",
        className
      )}
      {...props}
    />
  )
}
```

**Critério:** Ao trocar de aba (ex: no perfil do cliente), o conteúdo novo aparece com fade suave em vez de snap.

---

### Tarefa 5.4: Financeiro Hub — Cards de métricas com stagger + shortcuts com hover scale

**Arquivo:** `src/app/(dashboard)/financeiro/page.tsx`

1. Os 4 metric cards devem ter `animate-fade-in-up` com stagger (0ms, 50ms, 100ms, 150ms)
2. Os ShortcutCards devem ter hover com scale sutil:
```tsx
className="... transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
```

O `active:scale-[0.98]` dá o efeito de "press" — o card encolhe levemente ao clicar, como um botão físico.

---

### Tarefa 5.5: Botões globais — Press feedback em TODOS os botões

**Arquivo:** `src/components/ui/button.tsx`

Adicionar `active:scale-[0.97]` e `transition-all` na classe base do button (no início da string `cva`):

```tsx
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none active:scale-[0.97] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 ...",
  // rest...
)
```

**Mudança:** `transition-all` em vez de `transition-all` (já tem) + adicionar `active:scale-[0.97]`.

**NOTA:** Verificar se `transition-all` já está na string. Se sim, apenas adicionar `active:scale-[0.97]` logo depois.

**Critério:** Todo botão no ERP "encolhe" levemente ao ser pressionado — feedback tátil visual instantâneo.

---

### Tarefa 5.6: Success feedback — Animação de check após ações bem-sucedidas

**Arquivo:** `src/components/ui/sonner.tsx` (ou onde o Toaster é configurado)

Adicionar estilos customizados para toasts de sucesso com animação de entrada:

Se o Toaster do Sonner já está configurado em `providers.tsx` ou `layout.tsx`, ajustar para:

```tsx
<Toaster
  position="top-right"
  toastOptions={{
    className: "animate-fade-in-left",
    style: {
      animationDuration: "300ms",
    },
  }}
/>
```

Isso faz os toasts deslizarem da direita em vez de aparecer de forma abrupta.

---

### Tarefa 5.7: Empty states — Animação de entrada em todos os empty states

Buscar em TODOS os componentes onde existe "Nenhum" ou empty state text. Envolver com `animate-fade-in`:

- `customer-list.tsx`: "Nenhum cliente encontrado" card
- `client-tabs.tsx`: Empty states das tabs
- `commission-panel.tsx`: "Tudo em dia!"
- `resources-panel.tsx`: "Nenhuma sala cadastrada"
- `prontuarios/page.tsx`: "Ainda não existem formulários"

**Padrão:**
```tsx
<Card className="animate-fade-in">
  <CardContent className="py-12 text-center text-muted-foreground">
    {/* conteúdo do empty state */}
  </CardContent>
</Card>
```

---

## PARTE 6: Polish Final

### Tarefa 6.1: Sidebar active indicator — animação de slide

**Arquivo:** `src/components/layout/sidebar.tsx`

O item ativo na sidebar muda de `bg-primary` sem transição. Adicionar um indicator animado:

No NavGroup, melhorar a transição do estado ativo para incluir `transition-all duration-200`:

```tsx
// O link ativo já tem transition-all duration-200 ease-out (do Sprint 3+4)
// Adicionar transform para dar sensação de "seleção":
isActive
  ? "bg-primary text-primary-foreground shadow-sm translate-x-0.5"
  : "text-muted-foreground hover:bg-muted hover:text-foreground translate-x-0"
```

O `translate-x-0.5` sutil no item ativo dá a sensação de que ele "avançou" — como se tivesse sido selecionado e dado um passo à frente.

---

### Tarefa 6.2: Scroll reveal para elementos abaixo do fold

**Arquivo a CRIAR:** `src/components/ui/scroll-reveal.tsx`

Componente que aplica animação quando o elemento entra no viewport:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  animation?: string;
  delay?: number;
  threshold?: number;
};

export function ScrollReveal({
  children,
  className,
  animation = "animate-fade-in-up",
  delay = 0,
  threshold = 0.1,
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respeitar prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={cn(
        isVisible ? animation : "opacity-0",
        className
      )}
      style={isVisible && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
```

**Onde aplicar:**
- Seções abaixo do fold na página do Financeiro Hub
- Cards de prontuários na página de prontuários
- Qualquer conteúdo que esteja fora da viewport inicial

**Critério:** Elementos aparecem suavemente ao scrollar para eles.

---

## Regras Gerais

1. **NÃO instale dependências** — tudo é CSS + React puro
2. **NÃO altere lógica de negócio** — apenas adicione classes e envolva com wrappers
3. **SEMPRE respeite prefers-reduced-motion** — está no CSS global e nos componentes
4. **Mantenha** todas as melhorias dos Sprints anteriores
5. **Mantenha** idioma pt-BR
6. **Use** os tokens de `motion.ts` quando possível
7. **Teste** `npm run build` após cada parte
8. Se `data-open:duration-300` ou `data-open:[animation-timing-function:...]` não funcionarem no Tailwind v4, use CSS classes custom definidos no globals.css com os mesmos valores
9. Não há problema em ter muitos keyframes — o CSS é tree-shaken pelo build

## Ordem de Implementação Sugerida

1. **Parte 1** primeiro (foundation) — motion.ts + keyframes
2. **Parte 2** (dialogs) — melhora base + AnimatedDialog
3. **Parte 5.5** (button press) — impacto global imediato
4. **Parte 3** (listas) — AnimatedList + aplicar em tudo
5. **Parte 4** (page transitions) — loading.tsx + headers
6. **Parte 5** (por seção) — uma seção por vez
7. **Parte 6** (polish) — sidebar, scroll reveal, toasts

## Checklist Final

- [ ] `npm run build` sem erros
- [ ] `src/lib/motion.ts` existe com tokens
- [ ] Keyframes no globals.css (12+ keyframes)
- [ ] `prefers-reduced-motion` desabilita todas as animações
- [ ] Dialog padrão tem animação melhorada (300ms spring in, 200ms out)
- [ ] AnimatedDialog existe e expande do trigger
- [ ] AnimatedList existe e é usado em 6+ listas
- [ ] Loading.tsx existe para 18+ rotas
- [ ] Headers de página com fade-in-down
- [ ] Botões têm active:scale-[0.97]
- [ ] Cards têm hover lift
- [ ] Tabs content tem fade transition
- [ ] Empty states animam
- [ ] Toasts deslizam
- [ ] Agenda slots têm hover feedback
- [ ] Profile header tem stagger animation
- [ ] Financeiro hub cards com stagger + shortcuts com hover scale
- [ ] ScrollReveal existe e é usado abaixo do fold
- [ ] Sidebar active item tem translate sutil
