# Redesign Assinatura — "Central de Assinatura"

## Contexto compartilhado

Mesmo contexto do Receps ERP já estabelecido (Next.js 16.2 App Router, React 19, TS strict, Tailwind v4 com tokens OKLch em `globals.css`, shadcn/ui sobre `@base-ui/react`, lucide-react, sonner, next-themes, 5 accent themes dinâmicos por tenant, keyframes globais `aurora-pan`/`twinkle`/`glow-breathe`/`highlight-pulse`/`fade-in-up`/`fade-in-down`, sem framer-motion). **Nunca hardcode cores** — sempre via `var(--primary)` ou classes `bg-primary/x`, `text-primary`, `border-primary/x`, etc.

Se precisar relembrar convenções (ActionResult, services tenant-scoped, Zod validators), veja o `codex-prompt-redesign-atendente-ia.md` na raiz do projeto.

---

## Estado atual

A rota `/configuracoes/assinatura` hoje renderiza 3 cards empilhados num layout genérico:
1. Banner verde pálido com aviso de trial + botão "Adicionar forma de pagamento"
2. "Resumo da assinatura" — 6 pares label/valor (Plano, Preço mensal, Status TRIALING em caps, Acesso, Origem, Próxima cobrança, Método padrão)
3. "Gerenciamento" — card só pra botão "Abrir portal de cobrança"
4. "Invoices recentes" — lista com header de tabela mal alinhado

Problemas:
- Hierarquia plana — o aviso mais importante (trial acabando) está num banner discreto no topo
- "TRIALING" / "PAID" em caps lock — jargão técnico, não humano
- "Método padrão: -" é um vazio visual sem CTA
- Nenhum caminho claro pra upgrade quando o tenant tem só 1 produto (Atendente IA ou ERP avulso) e poderia virar Combo
- Invoices com colunas mal alinhadas, sem status colorido, sem hover
- Falta visualização temporal do trial (countdown visual)
- Nenhum "o que está incluso" no plano atual — o usuário não vê o que está pagando

---

## Objetivo

Transformar a página numa **Central de Assinatura** que (a) deixe o usuário entender em 3 segundos em que pé está, (b) mostre o trial countdown visualmente quando aplicável, (c) exiba o que está incluso no plano atual, (d) ofereça upgrade path quando existir, (e) exiba invoices em tabela funcional. Manter coerência visual com o resto do ERP (tokens, accent theme, dark mode) sem cair no formalismo atual — usar a mesma linguagem que foi aplicada na Atendente IA (ring sutil, gradient de fundo em hero, status com dot, micro-animações de entrada).

---

## Arquivos a modificar/criar

### Modificar
- `src/app/(dashboard)/configuracoes/assinatura/page.tsx` — rewrite da composição da página (continua server component, faz a query via `getTenantBillingDashboardData` e passa dados pros novos componentes)

### Criar (todos em `src/components/billing/`)
- `subscription-hero.tsx` — hero com nome do plano, preço grande, status com dot colorido, próxima cobrança ou countdown de trial
- `subscription-status-badge.tsx` — badge inline com cor e rótulo amigável baseado em `SubscriptionStatus` (evita o "TRIALING" cru em caps lock)
- `trial-countdown-card.tsx` — card condicional (só renderiza se status=TRIALING) com barra visual de dias restantes, CTA "Adicionar forma de pagamento" ou "Cartão cadastrado"
- `plan-benefits-grid.tsx` — grid de benefícios do plano atual lendo `plan.features` (JSON)
- `upgrade-path-card.tsx` — card condicional: mostra se tenant tem só `somente-atendente-ia` ou `somente-erp` → sugere upgrade pro `erp-atendente-ia` com economia calculada
- `billing-management-card.tsx` — card reorganizado com próxima cobrança, método de pagamento com ícone de bandeira/bandeirinha, e o botão do portal Stripe (reusar `BillingPortalButton`)
- `invoices-table.tsx` — tabela real de invoices com status badge, datas formatadas, valores, link "Ver fatura" (hostedInvoiceUrl) e download PDF (pdfUrl)
- `subscription-notice-banner.tsx` — banner contextual topo da página pra erros/avisos (`?notice=already-active|billing-in-progress|checkout-error`) — pode reaproveitar lógica atual que já existe na page.tsx

### Deletar/aposentar
- Nada — o componente antigo inteiro era inline na `page.tsx`, então sumir com ele é apenas não referenciar mais

---

## Layout proposto

```
┌──────────────────────────────────────────────────────────────┐
│  <SubscriptionNoticeBanner />  (só se houver ?notice=...)    │
├──────────────────────────────────────────────────────────────┤
│  <SubscriptionHero />                                         │
│  ─ nome do plano grande com gradient                          │
│  ─ preço + ciclo                                              │
│  ─ status dot + label + próxima cobrança ou trial countdown   │
│  ─ aurora blur sutil atrás (reusar animate-aurora-pan)       │
├──────────────────────────────────────────────────────────────┤
│  <TrialCountdownCard />  (condicional: status=TRIALING)      │
├──────────────────────────────────────────────────────────────┤
│  <PlanBenefitsGrid />    │  <BillingManagementCard />        │
│  (o que está incluso)    │  (próxima cobrança, método, portal)│
├──────────────────────────────────────────────────────────────┤
│  <UpgradePathCard />  (condicional: não tem ambos produtos)  │
├──────────────────────────────────────────────────────────────┤
│  <InvoicesTable />                                            │
└──────────────────────────────────────────────────────────────┘
```

Grid da linha benefícios + billing: `grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]`. Em mobile vira coluna única, tudo empilhado.

---

## Direção visual detalhada

### 1. Subscription Hero (`subscription-hero.tsx`)

Wrapper: `relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-background to-background p-8 md:p-10`

Atrás: blob aurora absoluto `-top-24 -right-24 h-[380px] w-[380px] rounded-full bg-primary/20 blur-3xl animate-aurora-pan pointer-events-none`

Conteúdo em 2 colunas (`md:grid md:grid-cols-2 md:gap-8 md:items-end relative z-10`):

**Esquerda:**
- Eyebrow: `<Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">Sua assinatura</Badge>`
- Nome do plano: `<h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">` com gradient text na última palavra do nome (split em espaço, última palavra com `bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent`)
- Subtítulo: 1 linha de descrição do plano (vem do `plan.description` ou hardcoded "Ferramentas da Ana pra seu WhatsApp" por plan slug)

**Direita (alinhada na base em md+):**
- Preço grande: `<p className="text-5xl font-bold tabular-nums">R$ 149,99</p>` + `<span className="text-base text-muted-foreground">/mês</span>`
- Linha com `<SubscriptionStatusBadge status={...} />` + separador · + "Próxima cobrança: 24 abr 2026" OU se TRIALING + sem cartão: "Trial até 24 abr · 7 dias restantes" com cor amber

Tudo com `animate-fade-in-down`.

### 2. Subscription Status Badge (`subscription-status-badge.tsx`)

Props: `status: SubscriptionStatus`

Mapeamento de tokens:
```
TRIALING           → dot amber + "Em período de teste"
ACTIVE             → dot emerald + "Assinatura ativa"
PAST_DUE           → dot orange + "Pagamento pendente"
CANCELED           → dot neutral + "Cancelada"
INCOMPLETE         → dot amber + "Aguardando pagamento"
INCOMPLETE_EXPIRED → dot destructive + "Pagamento não concluído"
UNPAID             → dot destructive + "Não paga"
PAUSED             → dot neutral + "Pausada"
```

Cores: usar `bg-emerald-500`, `bg-amber-500`, `bg-orange-500`, `bg-neutral-400`, `bg-destructive` — essas são exceções justificadas pra status semântico universal (igual já se faz no `BotSettingsPanel` com emerald/amber). Dark mode: `dark:bg-emerald-400`, etc.

Layout: `inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-sm font-medium`
Dot: `<span className="h-2 w-2 rounded-full bg-emerald-500" /> `. Se ACTIVE, adiciona `animate-pulse` no dot.

### 3. Trial Countdown Card (`trial-countdown-card.tsx`)

Só renderiza se `subscription.status === "TRIALING"`. Lê `trialEnd` e calcula dias restantes.

Layout:
- Se ainda não tem `defaultPaymentMethod`: card com fundo `bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30`
- Se já tem cartão salvo: card com fundo `bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30`

Conteúdo:
- Topo em flex: ícone (`Clock` se sem cartão, `ShieldCheck` se com cartão) + título ("Seu período de teste termina em X dias" / "Tudo pronto — cobrança automática em X dias")
- Barra de progresso visual: `<div className="h-2 w-full rounded-full bg-background/60"><div className="h-full rounded-full bg-amber-500/80 dark:bg-amber-400 transition-all" style={{ width: \`${pctUsed}%\` }} /></div>` — pct = `(7 - diasRestantes) / 7 * 100`
- Linha abaixo: data exata "Encerra em 24 abr 2026"
- Se sem cartão: botão principal `<Button>Adicionar forma de pagamento</Button>` que chama o billing portal
- Se com cartão: badge discreto "Cartão •••• 4242 cadastrado" sem CTA

### 4. Plan Benefits Grid (`plan-benefits-grid.tsx`)

Card com header "O que está incluso no seu plano" + subtítulo do plan name.

Grid de benefícios `grid gap-3 md:grid-cols-2`. Cada benefício é uma linha com:
- Círculo `h-8 w-8 rounded-full bg-primary/10` com `<Check className="h-4 w-4 text-primary" />`
- Texto à direita

Pra obter os benefícios, ler `plan.features` (JSON no Prisma). Se não tiver formato definido ainda, mapear por slug como fallback:

```
somente-atendente-ia:
  - Ana IA atendendo 24/7 no WhatsApp
  - Agendamentos automáticos pela Ana
  - Personalização de personalidade
  - Suporte humano via WhatsApp
  - Número WhatsApp configurado pela nossa equipe

somente-erp:
  - Agenda completa com lembretes
  - Gestão de clientes e prontuários
  - Profissionais e comissões
  - Serviços, pacotes e produtos
  - Controle financeiro e relatórios

erp-atendente-ia:
  - Tudo do ERP + tudo da Atendente IA
  - Ana agenda direto no seu calendário
  - Dashboards unificados
  - Suporte prioritário
```

### 5. Upgrade Path Card (`upgrade-path-card.tsx`)

Renderiza só se `planSlug === "somente-atendente-ia"` OR `planSlug === "somente-erp"`.

Card com fundo `relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-background p-6` + aurora blur sutil no canto oposto.

Conteúdo:
- Eyebrow: "Upgrade disponível"
- Título: "Combine tudo no Combo e economize R$ XX/mês"
- Cálculo: se tem `somente-atendente-ia` (R$149,99), o ERP avulso custa R$219,99 → somados = R$369,98. Combo custa R$299,99 → economia = R$69,99/mês. Fazer esse cálculo baseado nos preços reais do `Plan` table, não hardcode.
- Lista horizontal (chips) com "Adicione: Agenda · Clientes · Financeiro · Prontuários"
- CTA: `<Button>Fazer upgrade pro Combo</Button>` → chama `/api/billing/checkout` com `planId=erp-atendente-ia` (ou redireciona pro portal se a Stripe suportar swap direto; se não, redireciona pra `/assinar?plan=erp-atendente-ia&upgrade=1`)
- Linha fininha "Sem perder seus dados. Mudança na próxima cobrança."

### 6. Billing Management Card (`billing-management-card.tsx`)

Card com duas seções empilhadas internamente:

**Próxima cobrança:**
- Label `text-xs uppercase tracking-wider text-muted-foreground` "Próxima cobrança"
- Valor grande `text-2xl font-bold tabular-nums` com data em subtítulo

**Método de pagamento:**
- Label "Forma de pagamento"
- Se tem `defaultPaymentMethod`: ícone de bandeira (pode ser lucide `CreditCard`) + "Cartão •••• 4242"
- Se não tem: estado vazio "Nenhum cartão cadastrado" + link inline `<Button variant="link" className="p-0 h-auto">Adicionar</Button>`

Footer: botão `<BillingPortalButton variant="outline" className="w-full" label="Gerenciar no Stripe" />` (reusar componente existente) + linha fininha explicando "Atualizar cartão, baixar faturas ou cancelar."

### 7. Invoices Table (`invoices-table.tsx`)

Card com header "Faturas" + subtítulo "Últimas 12 cobranças".

Se `invoices.length === 0`: estado vazio centralizado com ícone `Receipt` cinza + "Ainda não há faturas. A primeira aparece após sua primeira cobrança."

Senão: tabela real (usar elementos HTML `<table>` mas estilada com Tailwind, ou shadcn Table se existir no projeto — se não existir, criar com divs):

Colunas: Status | Período | Valor | Ações

Cada linha:
- Status: badge colorido (`PAID` emerald, `OPEN` amber, `DRAFT` neutral, `VOID` neutral outline, `UNCOLLECTIBLE` destructive)
- Período: `"17–24 abr 2026"` (formato compacto `date-fns`)
- Valor: `tabular-nums` em bold `"R$ 149,99"`
- Ações: 2 ícones clicáveis — `ExternalLink` (abre `hostedInvoiceUrl`) e `Download` (abre `pdfUrl`). Tooltip em cada.

Hover na row: `hover:bg-muted/40 transition-colors`
Separador: `<tr className="border-b border-border/40">`

### 8. Subscription Notice Banner (`subscription-notice-banner.tsx`)

Props: `notice: "already-active" | "billing-in-progress" | "checkout-error" | undefined`

Renderiza banner topo da página com ícone + mensagem + botão fechar (só visual — na prática recarrega sem query param ou usa `router.replace`).

Mensagens:
- `already-active`: verde, "Você já tem uma assinatura ativa."
- `billing-in-progress`: âmbar, "Sua assinatura está sendo processada. Atualize em alguns segundos."
- `checkout-error`: destructive, "Não conseguimos completar o checkout. Tente novamente ou fale com o suporte."

Usa `animate-fade-in-down`.

---

## Comportamento da page.tsx

Pseudocódigo:

```tsx
export default async function AssinaturaPage({ searchParams }) {
  const user = await getAuthUserWithAccess();
  if (user.role !== "ADMIN") redirect("/dashboard");

  const { tenant, access, defaultPaymentMethod } = 
    await getTenantBillingDashboardData(user.tenantId);
  
  const subscription = tenant.subscription;
  const plan = subscription?.plan;
  const invoices = subscription?.invoices ?? [];
  const planSlug = plan?.slug;
  const allPlans = await listActivePlans(); // pra calcular upgrade price
  const notice = searchParams.notice;

  return (
    <div className="flex flex-col gap-6">
      {notice && <SubscriptionNoticeBanner notice={notice} />}
      
      <SubscriptionHero plan={plan} subscription={subscription} />
      
      {subscription?.status === "TRIALING" && (
        <TrialCountdownCard 
          trialEnd={subscription.trialEnd}
          hasPaymentMethod={!!defaultPaymentMethod}
          defaultPaymentMethod={defaultPaymentMethod}
        />
      )}
      
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <PlanBenefitsGrid plan={plan} />
        <BillingManagementCard 
          subscription={subscription}
          defaultPaymentMethod={defaultPaymentMethod}
        />
      </div>
      
      {planSlug !== "erp-atendente-ia" && (
        <UpgradePathCard currentSlug={planSlug} allPlans={allPlans} />
      )}
      
      <InvoicesTable invoices={invoices} />
    </div>
  );
}
```

---

## Edge cases

1. **Tenant com billing bypass ativo** (`access.accessSource === "BILLING_BYPASS"`): mostrar banner neutral no topo "Acesso liberado internamente pela equipe Receps" + esconder Trial countdown, upgrade path, invoices. Hero mostra "Acesso interno" em vez de preço.
2. **Tenant sem assinatura** (`!subscription`): redirecionar pra `/assinar` (já era assim — verificar).
3. **Assinatura CANCELED com `cancelAtPeriodEnd=true`**: mostrar banner destructive "Sua assinatura termina em {currentPeriodEnd}. Você pode reativar até lá." com CTA "Reativar" que abre billing portal.
4. **Status `PAST_DUE` ou `UNPAID`**: mostrar banner destructive topo "Última cobrança falhou. Atualize sua forma de pagamento pra manter o acesso." + CTA.
5. **Plano descontinuado** (Plan existe mas `isActive=false`): não quebrar, só mostrar nota discreta "Este plano não está mais disponível pra novas contratações."

---

## Acessibilidade

- Barra de progresso do trial: `role="progressbar"` + `aria-valuenow` + `aria-valuemin=0` + `aria-valuemax=7`
- Cada ícone decorativo com `aria-hidden="true"`
- Tabela de invoices: `<table>` + `<caption className="sr-only">Histórico de faturas</caption>` + scope nas `<th>`
- Dot de status: `sr-only` com o label textual completo pra leitor de tela
- Aurora e blurs: `pointer-events-none` + `aria-hidden`

---

## Critérios de aceitação

1. `npm run build` passa sem erros TS
2. `/configuracoes/assinatura` renderiza o layout proposto completo
3. Trial countdown mostra barra + dias restantes corretos (testar com `trialEnd` 3 dias no futuro e 1 dia no futuro)
4. Status badge mostra rótulo humano em vez de `TRIALING`/`PAID` cru
5. Invoice table tem status colorido, datas formatadas pt-BR, valores `R$ X,XX`
6. Upgrade card só aparece pra `somente-atendente-ia` ou `somente-erp`, e calcula economia real a partir dos preços da tabela `Plan`
7. Respeita os 5 accent themes (trocar `tenant.accentTheme` no banco e revalidar)
8. Dark mode funcional em todos os componentes
9. Mobile: colunas viram única, tabela ganha scroll horizontal se necessário
10. Aurora e animações respeitam `prefers-reduced-motion`
11. `BillingPortalButton` continua funcionando (não foi reescrito, só reposicionado)
12. Banner de notice (`?notice=`) continua funcionando

---

## O que NÃO fazer

- Não criar rota nova — continua em `/configuracoes/assinatura`
- Não tocar em `billing.service.ts`, `stripe.ts`, webhooks ou Prisma — só UI
- Não adicionar biblioteca de charts (o que precisa é barra simples CSS)
- Não hardcode preços — sempre ler da tabela `Plan`
- Não hardcode cores fora dos status semânticos universais (emerald/amber/destructive)
- Não duplicar o billing portal button — reusa o existente
- Não remover a lógica de `notice` query param que já existia

---

## Passo-a-passo sugerido

1. Criar `subscription-status-badge.tsx` (componente mais simples, reutilizado em vários lugares)
2. Criar `subscription-hero.tsx` usando o badge
3. Criar `trial-countdown-card.tsx`
4. Criar `plan-benefits-grid.tsx` com mapeamento por slug como fallback
5. Criar `billing-management-card.tsx` reusando `BillingPortalButton`
6. Criar `upgrade-path-card.tsx` com cálculo de economia
7. Criar `invoices-table.tsx`
8. Criar `subscription-notice-banner.tsx`
9. Reescrever `src/app/(dashboard)/configuracoes/assinatura/page.tsx` orquestrando tudo
10. `npm run build`, corrigir tipagem
11. Testar visualmente: trial com 7, 3, 1 dia restante; active; past_due; canceled com cancelAtPeriodEnd; bypass
12. Dark mode + 5 accent themes

---

## Hints pra salvar tempo

- `date-fns` já está instalado — use `format(date, "d MMM yyyy", { locale: ptBR })` e `differenceInDays` pro countdown
- Formato monetário: `new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(149.99)` → "R$ 149,99"
- Pra gradient text no nome do plano, split por espaço, aplica gradient na última palavra; fallback: aplica no nome inteiro se só tem 1 palavra
- Se `plan.features` no Prisma tá como JSON qualquer, faça uma função `normalizePlanFeatures(plan)` que retorna `string[]` a partir de 3 formatos possíveis: array de strings, array de objetos `{ label }`, ou vazio (cai no fallback por slug)
- O `Plan` catalog pode ser carregado uma vez via `listActivePlans()` e passado pro Upgrade card pra calcular economia; não fazer N+1
- Tooltip nos ícones de ação da invoice: reusar o `Tooltip` do shadcn (já existe)
