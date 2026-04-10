# Prompt para Codex — UI/UX Audit Implementation (Sprint 3 + Sprint 4)

## Contexto do Projeto

Este é o **Receps ERP**, um SaaS multitenant para saúde e beleza.

- **Stack**: Next.js 16.2 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/base-ui (@base-ui/react), Prisma 7, Recharts, Lucide React
- **Idioma da UI**: Português brasileiro (pt-BR)
- **Design tokens**: OKLch em `src/app/globals.css`, tokens semânticos (--primary, --muted-foreground, etc.)
- **UI base**: Dialog em `src/components/ui/dialog.tsx` usa `@base-ui/react/dialog`. O projeto **NÃO tem** componente Sheet/Drawer. Será necessário criar um.
- **O Sprint 1+2 já foi implementado** — os cards já têm aria-labels, tabular-nums, loading.tsx existe, Recharts tem lazy load.

As tarefas abaixo cobrem os Sprints 3 (responsividade) e 4 (micro-interações). **Implemente todas na ordem listada.**

---

## SPRINT 3 — Responsividade & Empty States (~8h)

### Tarefa 3.1: Criar componente Sheet (mobile drawer)

**Arquivo a CRIAR:** `src/components/ui/sheet.tsx`

**Contexto:** O projeto usa `@base-ui/react` como base para todos os componentes UI. O Dialog existente em `src/components/ui/dialog.tsx` segue esse padrão. O Sheet é essencialmente um Dialog que desliza de um lado da tela.

**O que fazer:**
Criar um Sheet component baseado no `@base-ui/react/dialog` (que o projeto já usa), seguindo exatamente as mesmas convenções do `dialog.tsx` existente.

```tsx
"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]",
        "data-[open]:animate-in data-[open]:fade-in-0",
        "data-[closed]:animate-out data-[closed]:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  side = "left",
  children,
  ...props
}: DialogPrimitive.Popup.Props & { side?: "left" | "right" }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col bg-background shadow-xl",
          "transition-transform duration-300 ease-out",
          // Posição e animação por lado
          side === "left" && "inset-y-0 left-0 w-72 border-r data-[open]:animate-in data-[open]:slide-in-from-left data-[closed]:animate-out data-[closed]:slide-out-to-left",
          side === "right" && "inset-y-0 right-0 w-72 border-l data-[open]:animate-in data-[open]:slide-in-from-right data-[closed]:animate-out data-[closed]:slide-out-to-right",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          render={
            <Button variant="ghost" size="icon-xs">
              <XIcon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Fechar</span>
            </Button>
          }
        />
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetOverlay, SheetPortal }
```

**IMPORTANTE:**
- Inspecione como `dialog.tsx` no projeto usa `DialogPrimitive.Backdrop` e `DialogPrimitive.Popup` — siga exatamente as mesmas props e padrões.
- O projeto usa `tw-animate-css` que fornece classes de animação como `animate-in`, `slide-in-from-left`, `fade-in-0`. Verifique que essas classes existem; se não, use transições CSS manuais.
- Se `DialogPrimitive.Popup` usar props ou padrões diferentes dos descritos acima, adapte o código para funcionar com a versão real do `@base-ui/react` instalada. O objetivo final é: um painel que desliza da esquerda com overlay escuro.

**Critério de aceite:** O componente Sheet existe, exporta os subcomponentes, e renderiza um drawer lateral com overlay.

---

### Tarefa 3.2: Tornar a Sidebar responsiva (collapse + drawer mobile)

**Arquivos:**
- `src/components/layout/sidebar.tsx` (refatorar)
- `src/app/(dashboard)/layout.tsx` (adaptar)
- `src/components/layout/header.tsx` (adicionar hamburger)

**Comportamento por breakpoint:**

| Breakpoint | Sidebar | Header |
|---|---|---|
| **< 768px** (mobile) | Escondida. Abre como Sheet (drawer) via botão hamburger no Header | Mostra botão hamburger à esquerda |
| **768px–1023px** (tablet) | Colapsada: apenas ícones (w-16 / 64px), sem labels de texto | Sem hamburger |
| **≥ 1024px** (desktop) | Expandida completa (w-64 / 256px) como está hoje | Sem hamburger |

**3.2a: Refatorar `sidebar.tsx`**

A sidebar precisa aceitar uma prop `collapsed` que controla se mostra apenas ícones ou o layout completo:

```tsx
// Adicionar prop collapsed
type SidebarProps = {
  userRole: string;
  userName: string;
  allowedModules: TenantModule[];
  permissions: TenantCustomPermissions;
  collapsed?: boolean;
};

export function Sidebar({
  userRole,
  userName,
  allowedModules,
  permissions,
  collapsed = false,
}: SidebarProps) {
  // ...

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-background transition-[width] duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo: quando collapsed, mostrar apenas ícone/iniciais em vez da logo completa */}
      <div className={cn(
        "flex h-[64px] items-center border-b",
        collapsed ? "justify-center px-2" : "justify-center px-6"
      )}>
        {collapsed ? (
          <span className="text-lg font-bold text-primary" aria-hidden="true">R</span>
        ) : (
          <BrandLogo className="max-w-full" />
        )}
      </div>

      {/* Navegação */}
      <nav className={cn("flex-1 overflow-y-auto", collapsed ? "p-2" : "p-3")}>
        <NavGroup items={mainItems} pathname={pathname} collapsed={collapsed} />
        {/* ... separadores e grupos, mesma lógica ... */}
        {managementItems.length > 0 && (
          <>
            <Separator className="my-3" />
            {!collapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gestão
              </p>
            )}
            <NavGroup items={managementItems} pathname={pathname} collapsed={collapsed} />
          </>
        )}
        {configItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <NavGroup items={configItems} pathname={pathname} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Rodapé do usuário */}
      <div className="border-t p-4">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
            {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium">{userName}</span>
              <span className="text-xs text-muted-foreground">{roleLabel(userRole)}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```

**NavGroup também precisa de `collapsed`:**
```tsx
function NavGroup({
  items,
  pathname,
  collapsed,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const activePrefixes = item.activePrefixes ?? [item.href];
        const isActive = activePrefixes.some((prefix) =>
          pathname === prefix || pathname?.startsWith(prefix + "/")
        );
        const Icon = item.icon;

        return collapsed ? (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "flex h-10 w-10 mx-auto items-center justify-center rounded-lg transition-all duration-200 ease-out",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">{item.label}</span>
          </Link>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
```

**3.2b: Adaptar `layout.tsx` para controle responsivo**

O layout precisa:
1. Esconder a sidebar em mobile (< md)
2. Passar `collapsed={true}` entre md e lg
3. Mostrar sidebar completa em lg+
4. Em mobile, a sidebar é renderizada dentro de um Sheet no Header

```tsx
// src/app/(dashboard)/layout.tsx
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUserWithAccess();
  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
    select: { name: true, accentTheme: true },
  });

  // Props compartilhadas da sidebar
  const sidebarProps = {
    userRole: user.role,
    userName: user.name,
    allowedModules: user.allowedModules,
    permissions: user.customPermissions,
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      data-accent-theme={tenant?.accentTheme ?? DEFAULT_TENANT_ACCENT_THEME}
    >
      <TenantAccentThemeSync
        accentTheme={tenant?.accentTheme ?? DEFAULT_TENANT_ACCENT_THEME}
      />

      {/* Sidebar desktop: colapsada em md, expandida em lg */}
      {/* hidden em mobile — a versão mobile fica no Header como Sheet */}
      <div className="hidden md:block lg:hidden">
        <Sidebar {...sidebarProps} collapsed={true} />
      </div>
      <div className="hidden lg:block">
        <Sidebar {...sidebarProps} collapsed={false} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          tenantName={tenant?.name}
          userName={user.name}
          userEmail={user.email}
          userRole={user.role}
          sidebarProps={sidebarProps}
        />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

**3.2c: Adicionar hamburger menu no Header**

O Header precisa mostrar um botão hamburger em mobile que abre um Sheet com a sidebar:

```tsx
// src/components/layout/header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

type HeaderProps = {
  tenantName?: string;
  userName: string;
  userEmail: string;
  userRole: string;
  sidebarProps?: {
    userRole: string;
    userName: string;
    allowedModules: any[];
    permissions: any;
  };
};

export function Header({ tenantName, userName, userEmail, userRole, sidebarProps }: HeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger: visível apenas em mobile */}
        {sidebarProps && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu de navegação">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              }
            />
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar {...sidebarProps} collapsed={false} />
            </SheetContent>
          </Sheet>
        )}

        <p className="truncate text-base font-semibold text-foreground sm:text-lg">
          {tenantName ?? "Estabelecimento"}
        </p>
      </div>

      <div className="flex items-center gap-3 pl-4">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {userEmail}
        </span>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}

// Manter a função roleLabel que já existe no arquivo
```

**NOTAS IMPORTANTES:**
- O componente Sheet que você criou na Tarefa 3.1 pode precisar de ajustes para funcionar com a API real do `@base-ui/react/dialog`. Teste se `open`/`onOpenChange` funcionam como props. Se o `@base-ui/react` usar nomes diferentes (como `modal` ou `isOpen`), adapte.
- A prop `render` no `SheetTrigger` segue o padrão do `@base-ui/react` para render-as-child. Se não funcionar, use `asChild` ou envolva diretamente.
- Se a Sidebar dentro do Sheet precisar fechar ao clicar num link, adicione `onClick={() => setSheetOpen(false)}` nos Links da NavGroup, ou use o `usePathname` para detectar mudança de rota.
- A Sidebar precisa exportar o tipo `SidebarProps` para que o Header possa importá-lo.

**Critério de aceite:**
- Em < 768px: sidebar escondida, hamburger aparece no header, clicar abre Sheet com sidebar completa
- Em 768-1023px: sidebar colapsada (ícones apenas, 64px de largura), sem hamburger
- Em ≥ 1024px: sidebar expandida (256px), sem hamburger
- Transições suaves entre estados
- Navegar por um link dentro do Sheet fecha o Sheet
- Build passa sem erros

---

### Tarefa 3.3: Empty state para tenants novos no Dashboard

**Arquivo:** `src/app/(dashboard)/dashboard/page.tsx`
**Arquivo a CRIAR:** `src/components/dashboard/dashboard-empty-state.tsx`

**O que fazer:**
Quando um tenant acabou de ser criado, todos os KPIs são zero e o gráfico está vazio. Em vez de mostrar "R$ 0,00" em tudo, mostramos uma tela de boas-vindas com CTAs para os primeiros passos.

**Detecção (em `page.tsx`):**
```tsx
// Após obter os kpis, antes do return:
const isEmptyDashboard =
  kpis.revenue === 0 &&
  kpis.totalAppointments === 0 &&
  kpis.newCustomers === 0 &&
  kpis.completedAppointments === 0;

if (isEmptyDashboard) {
  return <DashboardEmptyState />;
}

// O return normal continua depois
```

**Componente DashboardEmptyState:**
```tsx
// src/components/dashboard/dashboard-empty-state.tsx
import Link from "next/link";
import { Calendar, Scissors, UserCog } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Scissors,
    title: "Cadastre seus serviços",
    description: "Adicione os serviços que seu estabelecimento oferece, com valores e duração.",
    href: "/servicos",
    cta: "Ir para Serviços",
  },
  {
    icon: UserCog,
    title: "Adicione profissionais",
    description: "Cadastre os profissionais da equipe e vincule aos serviços.",
    href: "/profissionais",
    cta: "Ir para Profissionais",
  },
  {
    icon: Calendar,
    title: "Crie seu primeiro agendamento",
    description: "Agende um atendimento para começar a acompanhar seu faturamento.",
    href: "/agenda",
    cta: "Ir para Agenda",
  },
];

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold tracking-tight">
          Bem-vindo ao Receps!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu dashboard aparecerá aqui assim que você começar a registrar
          atendimentos. Siga os passos abaixo para configurar seu espaço.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <Card key={i} className="relative overflow-visible">
              <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                <Link
                  href={step.href}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-2 w-full"
                  )}
                >
                  {step.cta}
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

**Critério de aceite:**
- Quando todos os KPIs são 0, o dashboard mostra o empty state em vez dos cards
- O empty state mostra 3 cards com CTAs para Serviços, Profissionais e Agenda
- Links funcionam e levam às páginas corretas

---

## SPRINT 4 — Micro-interações & Polish (~6h)

### Tarefa 4.1: Animação staggered de entrada nos KPI cards

**Arquivo:** `src/app/globals.css` (keyframe) e `src/app/(dashboard)/dashboard/page.tsx` (aplicação)

**Passo 1 — Adicionar keyframe no `globals.css`:**
Inserir dentro de `@layer base { ... }` ou logo após ele:

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.4s ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-in-up {
    animation: none;
  }
}
```

**Passo 2 — Aplicar nos KPI cards em `page.tsx`:**
Converter os 4 cards KPI hardcoded para um array mapeado com `style={{ animationDelay }}`:

```tsx
{/* ---- KPI CARDS ---- */}
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {[
    {
      id: "kpi-revenue-title",
      title: "Faturamento Hoje",
      icon: DollarSign,
      value: `R$ ${kpis.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: null,
    },
    {
      id: "kpi-ticket-title",
      title: "Ticket Médio",
      icon: TrendingUp,
      value: `R$ ${kpis.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      subtitle: `${kpis.completedAppointments} atendimento(s) finalizado(s)`,
    },
    {
      id: "kpi-appointments-title",
      title: "Agendamentos Hoje",
      icon: Calendar,
      value: String(kpis.totalAppointments),
      subtitle: `${kpis.completedAppointments} finalizado(s)`,
    },
    {
      id: "kpi-customers-title",
      title: "Novos Clientes",
      icon: UserPlus,
      value: String(kpis.newCustomers),
      subtitle: "cadastrados hoje",
    },
  ].map((card, i) => {
    const Icon = card.icon;
    return (
      <Card
        key={card.id}
        role="region"
        aria-labelledby={card.id}
        className="animate-fade-in-up"
        style={{ animationDelay: `${i * 75}ms` }}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle id={card.id} className="text-sm font-medium text-muted-foreground">
            {card.title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">{card.value}</p>
          {card.subtitle && (
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {card.subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    );
  })}
</div>
```

**IMPORTANTE:** O `style={{ animationDelay }}` funciona em Server Components — é apenas CSS, não requer "use client".

**Critério de aceite:**
- Os 4 KPI cards aparecem com fade-in + slide-up escalonado (0ms, 75ms, 150ms, 225ms)
- Com `prefers-reduced-motion: reduce`, a animação é desabilitada
- Os aria-labelledby e tabular-nums do Sprint 1 são mantidos

---

### Tarefa 4.2: KPI cards clicáveis com drill-down + hover effect

**Arquivo:** `src/app/(dashboard)/dashboard/page.tsx`

**O que fazer:**
Envolver cada KPI card com um `<Link>` para a página de detalhe relevante, e adicionar efeito de hover (elevação + borda sutil).

**Mapeamento de destinos:**
- Faturamento Hoje → `/financeiro`
- Ticket Médio → `/financeiro`
- Agendamentos Hoje → `/agenda`
- Novos Clientes → `/clientes`

Atualizar o array da Tarefa 4.1 para incluir `href`:

```tsx
{
  id: "kpi-revenue-title",
  title: "Faturamento Hoje",
  icon: DollarSign,
  value: `R$ ${kpis.revenue.toLocaleString(...)}`,
  subtitle: null,
  href: "/financeiro",
},
{
  id: "kpi-ticket-title",
  title: "Ticket Médio",
  icon: TrendingUp,
  value: `R$ ${kpis.averageTicket.toLocaleString(...)}`,
  subtitle: `${kpis.completedAppointments} atendimento(s) finalizado(s)`,
  href: "/financeiro",
},
{
  id: "kpi-appointments-title",
  title: "Agendamentos Hoje",
  icon: Calendar,
  value: String(kpis.totalAppointments),
  subtitle: `${kpis.completedAppointments} finalizado(s)`,
  href: "/agenda",
},
{
  id: "kpi-customers-title",
  title: "Novos Clientes",
  icon: UserPlus,
  value: String(kpis.newCustomers),
  subtitle: "cadastrados hoje",
  href: "/clientes",
},
```

E envolver o Card com Link:

```tsx
import Link from "next/link";

// No .map():
return (
  <Link key={card.id} href={card.href} className="group">
    <Card
      role="region"
      aria-labelledby={card.id}
      className="animate-fade-in-up transition-all duration-200 group-hover:shadow-md group-hover:border-primary/20 group-hover:-translate-y-0.5"
      style={{ animationDelay: `${i * 75}ms` }}
    >
      {/* ... conteúdo inalterado ... */}
    </Card>
  </Link>
);
```

**Critério de aceite:**
- KPI cards são clicáveis e navegam para as páginas corretas
- Hover mostra elevação (shadow-md), borda sutil (border-primary/20), e lift (-translate-y-0.5)
- Cursor muda para pointer (via Link)
- Transição suave de 200ms

---

### Tarefa 4.3: Cores distintas para as séries do gráfico

**Arquivo:** `src/app/globals.css`

**Problema:** As 3 séries do gráfico (Faturamento, Comissões, Despesas) usam chart-1, chart-2 e chart-4 que são todas variações do roxo. Difícil distinguir, especialmente para daltônicos.

**O que fazer:**
Manter chart-1 como a primary (roxo). Alterar chart-2 para um teal/verde e chart-4 para um amber/laranja. Fazer isso em AMBOS os modos (light e dark).

**Em `:root` (light mode):**
```css
/* Charts: cores distintas para séries */
--chart-1: oklch(0.42 0.24 285);      /* roxo (faturamento) — inalterado */
--chart-2: oklch(0.55 0.14 175);      /* teal (comissões) */
--chart-3: oklch(0.65 0.16 285);      /* roxo claro — inalterado */
--chart-4: oklch(0.62 0.16 55);       /* amber (despesas) */
--chart-5: oklch(0.85 0.06 285);      /* roxo muito claro — inalterado */
```

**Em `.dark` (dark mode):**
```css
/* Charts: cores distintas para séries */
--chart-1: oklch(0.62 0.24 285);      /* roxo (faturamento) — inalterado */
--chart-2: oklch(0.65 0.14 175);      /* teal (comissões) */
--chart-3: oklch(0.48 0.16 285);      /* roxo médio — inalterado */
--chart-4: oklch(0.68 0.16 55);       /* amber (despesas) */
--chart-5: oklch(0.32 0.08 285);      /* roxo escuro — inalterado */
```

**IMPORTANTE:**
- **NÃO alterar** os accent themes (ROSE_ELEGANCE, etc.) — eles usam hex e ficam como estão.
- Alterar APENAS as variáveis chart-2 e chart-4 nos blocos `:root` e `.dark` do tema padrão (RECEPS_SIGNATURE).
- O gráfico em `monthly-revenue-chart.tsx` já referencia `var(--color-chart-1)`, `var(--color-chart-2)` e `var(--color-chart-4)`, então a mudança é automática.

**Critério de aceite:**
- Faturamento = roxo, Comissões = teal/verde, Despesas = amber/laranja
- Distinção clara entre as 3 linhas em light e dark mode
- Nenhum accent theme é afetado

---

### Tarefa 4.4: Animação suave no tooltip e linhas do gráfico

**Arquivo:** `src/components/dashboard/monthly-revenue-chart.tsx`

**O que fazer:**
Adicionar props de animação ao Tooltip e às Lines do Recharts:

```tsx
// No <Tooltip>, adicionar:
<Tooltip
  animationDuration={200}
  animationEasing="ease-out"
  contentStyle={{
    background: "var(--color-card)",
    color: "var(--color-card-foreground)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
  }}
  // ... rest inalterado
/>

// Em cada <Line>, garantir que animação está ativa:
<Line
  type="monotone"
  dataKey="faturamento"
  name="Faturamento"
  stroke="var(--color-chart-1)"
  strokeWidth={3}
  dot={false}
  activeDot={{ r: 5 }}
  isAnimationActive={true}
  animationDuration={800}
  animationEasing="ease-out"
/>
// Repetir para as outras 2 linhas (comissoes e despesas)
```

**Critério de aceite:**
- Tooltip aparece/desaparece com transição de 200ms
- Linhas do gráfico "se desenham" ao carregar (800ms, ease-out)

---

## Regras gerais para todas as tarefas

1. **NÃO altere** lógica de negócio, data fetching, tipos TypeScript, ou services
2. **NÃO instale** novas dependências npm — use apenas o que já está no projeto
3. **Mantenha** todas as melhorias do Sprint 1+2 (aria-labels, tabular-nums, loading.tsx, lazy load)
4. **Mantenha** o idioma pt-BR em todo texto visível
5. **Use** as mesmas convenções: aspas duplas, ponto-e-vírgula, template literals, cn() utility
6. **O componente Sheet é o único componente UI novo** — tudo mais reutiliza os existentes
7. **Teste** que `npm run build` passa sem erros após as alterações
8. Se alguma API do `@base-ui/react` não funcionar exatamente como descrito, adapte para funcionar — o objetivo é o comportamento, não a implementação literal

---

## Checklist final de verificação

Após implementar tudo, verificar:

- [ ] `npm run build` completa sem erros
- [ ] Sheet component existe em `src/components/ui/sheet.tsx`
- [ ] Em mobile (< 768px): sidebar escondida, hamburger funciona, Sheet abre
- [ ] Em tablet (768-1023px): sidebar colapsada, ícones visíveis, tooltip com title
- [ ] Em desktop (≥ 1024px): sidebar expandida como antes
- [ ] Empty state aparece quando todos KPIs = 0
- [ ] KPI cards animam com stagger fade-in-up
- [ ] KPI cards são clicáveis com hover effect
- [ ] Gráfico tem 3 cores distintas (roxo, teal, amber) em light e dark
- [ ] Linhas do gráfico animam ao carregar
- [ ] Tooltip do gráfico tem transição suave
- [ ] `prefers-reduced-motion: reduce` desativa animações dos cards
- [ ] Todas as melhorias do Sprint 1+2 continuam funcionando
