# Prompt para Codex — UI/UX Audit Implementation (Sprint 1 + Sprint 2)

## Contexto do Projeto

Este é o **Receps ERP**, um SaaS multitenant para estabelecimentos de saúde e beleza.

- **Stack**: Next.js 16.2 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/base-ui (baseado em @base-ui/react), Prisma 7, Recharts, Sonner, Lucide React
- **Idioma da UI**: Português brasileiro (pt-BR)
- **Design tokens**: OKLch no globals.css, tokens semânticos (--primary, --muted-foreground, etc.)
- **Tema**: Dark/light mode via next-themes + 5 accent themes de tenant via data-attribute

Uma auditoria UI/UX completa foi feita na tela de Dashboard. As tarefas abaixo são as correções priorizadas. **Implemente todas na ordem listada.**

---

## SPRINT 1 — Quick Wins de Acessibilidade (~2h)

### Tarefa 1.1: Adicionar `aria-hidden="true"` em todos os ícones decorativos

**Arquivos:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/dashboard/monthly-summary-section.tsx`

**O que fazer:**
Todos os ícones Lucide que são puramente decorativos (aparecem ao lado de um texto que já descreve a função) precisam receber `aria-hidden="true"`. Isso evita que leitores de tela anunciem o SVG como ruído.

**Ícones decorativos a corrigir em `page.tsx`:**
```tsx
// ANTES (cada um dos 4 KPI cards):
<DollarSign className="h-4 w-4 text-muted-foreground" />
<TrendingUp className="h-4 w-4 text-muted-foreground" />
<Calendar className="h-4 w-4 text-muted-foreground" />
<UserPlus className="h-4 w-4 text-muted-foreground" />

// DEPOIS:
<DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
<TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
<Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
<UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
```

**Ícones decorativos a corrigir em `monthly-summary-section.tsx`:**
```tsx
// Nos 4 cards mensais — mesma lógica: adicionar aria-hidden="true"
<TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
<Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
<ReceiptText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
// O ícone do card "Resultado" (TrendingUp/TrendingDown condicional) também:
<TrendingUp className="h-4 w-4 text-emerald-600" aria-hidden="true" />
<TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />
```

**Ícones dentro de botões de navegação (ChevronLeft/Right):**
Estes já estão dentro de `<Link>` com `aria-label`, então o ícone também fica `aria-hidden`:
```tsx
<ChevronLeft className="h-4 w-4" aria-hidden="true" />
<ChevronRight className="h-4 w-4" aria-hidden="true" />
```

**Critério de aceite:** Nenhum ícone Lucide no dashboard é anunciado por leitores de tela. Todos têm `aria-hidden="true"`.

---

### Tarefa 1.2: Adicionar `role="region"` e `aria-labelledby` nos 4 KPI cards

**Arquivo:** `src/app/(dashboard)/dashboard/page.tsx`

**O que fazer:**
Cada KPI card precisa ser identificável como região semântica para leitores de tela. Adicionar um `id` único no `<CardTitle>` e conectar via `aria-labelledby` no `<Card>`.

**Padrão para cada card:**
```tsx
// Card 1: Faturamento
<Card role="region" aria-labelledby="kpi-revenue-title">
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle id="kpi-revenue-title" className="text-sm font-medium text-muted-foreground">
      Faturamento Hoje
    </CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold tabular-nums">
      R$ {kpis.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
    </p>
  </CardContent>
</Card>

// Card 2: Ticket Médio → id="kpi-ticket-title"
// Card 3: Agendamentos → id="kpi-appointments-title"
// Card 4: Novos Clientes → id="kpi-customers-title"
```

**Aplicar o mesmo padrão nos 4 cards mensais** em `src/components/dashboard/monthly-summary-section.tsx`:
- Faturamento do Mês → `id="monthly-revenue-title"`
- Comissões do Mês → `id="monthly-commissions-title"`
- Despesas do Mês → `id="monthly-expenses-title"`
- Resultado do Mês → `id="monthly-result-title"`

**Critério de aceite:** Cada card tem `role="region"` e `aria-labelledby` apontando para seu título.

---

### Tarefa 1.3: Adicionar `tabular-nums` nos valores monetários e numéricos

**Arquivos:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/dashboard/monthly-summary-section.tsx`

**O que fazer:**
Adicionar a classe Tailwind `tabular-nums` em todos os `<p>` que exibem valores numéricos (moeda e contagem). Isso garante que os dígitos tenham largura fixa e não causem layout shift quando mudam.

**Em `page.tsx`, nos 4 KPI cards:**
```tsx
// Todos os valores em text-2xl font-bold ganham tabular-nums:
<p className="text-2xl font-bold tabular-nums">
  R$ {kpis.revenue.toLocaleString(...)}
</p>
// Repetir para: kpis.averageTicket, kpis.totalAppointments, kpis.newCustomers
```

**Em `monthly-summary-section.tsx`, nos 4 cards mensais:**
```tsx
<p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.faturamentoMes)}</p>
<p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalComissoes)}</p>
<p className="text-2xl font-bold tabular-nums">{formatCurrency(stats.totalDespesas)}</p>
<p className={`text-2xl font-bold tabular-nums ${...}`}>{formatCurrency(stats.resultadoMes)}</p>
```

Também no ticket médio dentro do gráfico header:
```tsx
<p className="text-xs text-muted-foreground tabular-nums">
  Ticket médio do mês: {formatCurrency(stats.ticketMedio)}
</p>
```

**Critério de aceite:** Todos os valores numéricos no dashboard usam `tabular-nums`.

---

### Tarefa 1.4: Adicionar texto acessível no card "Resultado do Mês"

**Arquivo:** `src/components/dashboard/monthly-summary-section.tsx`

**Problema:** O card de resultado usa apenas cor (verde/vermelho) para indicar lucro vs. prejuízo. Isso viola a regra WCAG "cor não pode ser o único indicador".

**O que fazer:** Adicionar um `<span className="sr-only">` depois do valor para anunciar o estado ao leitor de tela.

```tsx
// No CardContent do card "Resultado do Mês", após o <p> do valor:
<CardContent>
  <p
    className={`text-2xl font-bold tabular-nums ${
      stats.resultadoMes >= 0 ? "text-emerald-600" : "text-red-600"
    }`}
  >
    {formatCurrency(stats.resultadoMes)}
  </p>
  <span className="sr-only">
    {stats.resultadoMes >= 0 ? "Resultado positivo" : "Resultado negativo"}
  </span>
  <p className="mt-1 text-xs text-muted-foreground">
    Faturamento − comissões − despesas pagas
  </p>
</CardContent>
```

**Critério de aceite:** Leitores de tela anunciam "Resultado positivo" ou "Resultado negativo" junto com o valor.

---

### Tarefa 1.5: Adicionar acessibilidade no gráfico

**Arquivo:** `src/components/dashboard/monthly-revenue-chart.tsx`

**O que fazer:**
1. Envolver o `<ResponsiveContainer>` com um `<div>` com `role="img"` e `aria-label` descritivo.
2. Adicionar uma tabela visually-hidden como alternativa para leitores de tela.

```tsx
export function MonthlyRevenueChart({ data }: { data: DailyRevenuePoint[] }) {
  // Calcular resumo para o aria-label
  const totalFaturamento = data.reduce((sum, d) => sum + (d.faturamento ?? 0), 0);
  const currFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  if (data.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-muted-foreground">
        <p>Nenhum dado disponível para este período.</p>
      </div>
    );
  }

  return (
    <>
      <div
        role="img"
        aria-label={`Gráfico de evolução mensal: faturamento total de ${currFmt.format(totalFaturamento)} no período`}
        className="h-[320px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          {/* ... LineChart existente sem alterações ... */}
        </ResponsiveContainer>
      </div>

      {/* Tabela acessível oculta visualmente */}
      <table className="sr-only">
        <caption>Evolução diária de faturamento, comissões e despesas</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Faturamento</th>
            <th scope="col">Comissões</th>
            <th scope="col">Despesas</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{currFmt.format(point.faturamento ?? 0)}</td>
              <td>{currFmt.format(point.comissoes ?? 0)}</td>
              <td>{currFmt.format(point.despesas ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

**IMPORTANTE:** O componente já é `"use client"`. Manter assim. Não alterar o LineChart/Recharts interno — apenas envolver com o div e adicionar a tabela ao lado.

**Critério de aceite:**
- Gráfico tem `role="img"` com aria-label descritivo
- Tabela sr-only com os dados está presente
- Se `data.length === 0`, mostra mensagem de "Nenhum dado disponível"

---

## SPRINT 2 — Loading States & Performance (~4h)

### Tarefa 2.1: Criar `loading.tsx` com skeleton screens

**Arquivo a CRIAR:** `src/app/(dashboard)/dashboard/loading.tsx`

**O que fazer:**
Criar um componente de loading que o Next.js App Router exibe automaticamente enquanto o Server Component `page.tsx` resolve suas promises.

```tsx
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between px-4">
              <div className="h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </div>
            <div className="px-4">
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* Monthly summary skeleton */}
      <div className="flex flex-col gap-4">
        {/* Month selector skeleton */}
        <div className="flex items-center justify-between rounded-2xl border bg-card p-5 shadow-sm">
          <div>
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-6 w-32 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
            <div className="h-7 w-7 animate-pulse rounded-md bg-muted" />
          </div>
        </div>

        {/* Monthly cards skeleton */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-center justify-between px-4">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </div>
              <div className="px-4">
                <div className="h-8 w-28 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-40 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="flex flex-col gap-4 rounded-xl bg-card py-4 ring-1 ring-foreground/10">
          <div className="px-4">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
          </div>
          <div className="px-4">
            <div className="h-[320px] animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Critério de aceite:**
- O arquivo `loading.tsx` existe em `src/app/(dashboard)/dashboard/`
- Ao navegar para /dashboard, o skeleton aparece enquanto os dados carregam
- O skeleton reproduz fielmente o layout dos KPI cards + seção mensal + gráfico
- Usa `animate-pulse` para a animação de shimmer
- Usa os mesmos tokens de design (bg-card, ring-foreground/10, bg-muted, rounded-xl)

---

### Tarefa 2.2: Lazy load do Recharts com dynamic import

**Arquivo:** `src/components/dashboard/monthly-summary-section.tsx`

**O que fazer:**
O Recharts é uma biblioteca pesada (~250KB). Como o gráfico fica abaixo do fold (depois dos KPI cards), ele deve ser carregado via dynamic import do Next.js.

```tsx
// REMOVER esta importação estática:
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";

// ADICIONAR no topo do arquivo:
import dynamic from "next/dynamic";

const MonthlyRevenueChart = dynamic(
  () =>
    import("@/components/dashboard/monthly-revenue-chart").then(
      (mod) => mod.MonthlyRevenueChart
    ),
  {
    loading: () => (
      <div className="h-[320px] animate-pulse rounded-lg bg-muted" />
    ),
    ssr: false,
  }
);
```

**IMPORTANTE:**
- `ssr: false` porque Recharts depende do DOM (window/document)
- O `loading` mostra um placeholder com as mesmas dimensões do gráfico (h-[320px])
- O restante do arquivo NÃO muda — o componente é usado da mesma forma: `<MonthlyRevenueChart data={series} />`

**Critério de aceite:**
- O chunk do Recharts é carregado separadamente (verificável no Network tab do DevTools)
- Enquanto carrega, aparece o placeholder animado
- O gráfico funciona normalmente após o carregamento

---

### Tarefa 2.3: Aumentar touch targets dos botões de navegação de mês

**Arquivo:** `src/components/dashboard/monthly-summary-section.tsx`

**Problema:** Os botões de mês anterior/próximo usam `size="icon-sm"` que resulta em 28×28px. O mínimo recomendado é 44×44px.

**O que fazer:**
Trocar `size="icon-sm"` por `size="icon"` e garantir `min-w-[44px] min-h-[44px]`:

```tsx
// Botão mês anterior — Link:
<Link
  href={buildMonthHref(previousMonth)}
  aria-label="Ver mês anterior"
  className={cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "min-h-[44px] min-w-[44px]"
  )}
>
  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
</Link>

// Botão "Mês Atual" — manter size="sm" mas adicionar min-height:
<Link
  href={buildMonthHref(getTodayCivilMonth())}
  className={cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "min-h-[44px]"
  )}
>
  Mês Atual
</Link>

// Botão mês seguinte (ativo) — Link:
<Link
  href={buildMonthHref(nextMonth)}
  aria-label="Ver próximo mês"
  className={cn(
    buttonVariants({ variant: "outline", size: "icon" }),
    "min-h-[44px] min-w-[44px]"
  )}
>
  <ChevronRight className="h-4 w-4" aria-hidden="true" />
</Link>

// Botão mês seguinte (desabilitado) — Button:
<Button
  variant="outline"
  size="icon"
  disabled
  aria-label="Próximo mês indisponível"
  className="min-h-[44px] min-w-[44px]"
>
  <ChevronRight className="h-4 w-4" aria-hidden="true" />
</Button>
```

**Critério de aceite:** Todos os botões de navegação de mês têm no mínimo 44×44px de área clicável/tocável.

---

## Regras gerais para todas as tarefas

1. **NÃO altere** a lógica de negócio, data fetching, ou tipos TypeScript existentes
2. **NÃO instale** novas dependências — tudo usa o que já está no projeto
3. **NÃO crie** componentes novos além do `loading.tsx` explicitamente pedido
4. **Mantenha** todos os imports existentes que ainda são usados
5. **Mantenha** o idioma pt-BR em todo texto visível
6. **Use** as mesmas convenções de código do projeto: aspas duplas, ponto-e-vírgula, template literals
7. **Teste** que `npm run build` (ou equivalente) passa sem erros após as alterações
8. O projeto usa **Tailwind v4** — classes como `tabular-nums`, `animate-pulse`, `sr-only` são nativas
9. Componentes base ficam em `src/components/ui/` — **não modifique esses arquivos**
10. O `cn()` utility em `src/lib/utils.ts` combina clsx + tailwind-merge — use-o quando necessário

---

## Checklist final de verificação

Após implementar tudo, verificar:

- [ ] `npm run build` completa sem erros
- [ ] Nenhum ícone Lucide no dashboard está sem `aria-hidden="true"`
- [ ] Todos os KPI cards (8 total: 4 diários + 4 mensais) têm `role="region"` + `aria-labelledby`
- [ ] Todos os valores monetários têm `tabular-nums`
- [ ] Card "Resultado do Mês" tem `sr-only` com "positivo"/"negativo"
- [ ] Gráfico tem `role="img"` + aria-label + tabela sr-only + empty state
- [ ] `loading.tsx` existe e renderiza skeletons
- [ ] Recharts é importado via `dynamic()` com `ssr: false`
- [ ] Botões de mês têm min 44×44px
- [ ] Sem regressões visuais (comparar light e dark mode)
