# Redesign Atendente IA — "Ana Studio"

## Contexto compartilhado

Você está trabalhando no **Receps ERP**, um SaaS multitenant Next.js (App Router) pt-BR para negócios de beleza/saúde. Stack:

- **Next.js 16.2** (App Router, `src/proxy.ts` em vez de `middleware.ts`)
- **React 19**, **TypeScript strict**
- **Tailwind CSS v4** (inline `@theme` em `src/app/globals.css`, sem `tailwind.config`)
- **shadcn/ui** sobre `@base-ui/react` (não Radix). Components em `src/components/ui/`: `button`, `card`, `badge`, `input`, `label`, `textarea`, `select`, `tabs`, `separator`, `tooltip`, `scroll-area`, `avatar`, `dialog`, `sheet`, `alert-dialog`, `sonner`, `progress`, `animated-list`, `scroll-reveal`, `animated-dialog`
- **lucide-react** para ícones
- **sonner** para toasts
- **next-themes** (dark/light) + 5 accent themes (`RECEPS_SIGNATURE` default roxo, `ROSE_ELEGANCE`, `LAVENDER_PREMIUM`, `EXECUTIVE_BLUE`, `TITANIUM_GRAPHITE`)
- Tokens OKLch em `globals.css`; acessa via `var(--primary)`, `bg-primary`, `text-muted-foreground`, etc — **NUNCA hardcode cores**, sempre usa os tokens pra respeitar tenant theme
- Keyframes prontos (já no `globals.css`): `aurora-pan`, `twinkle`, `glow-breathe`, `highlight-pulse`, `fade-in-up`, `fade-in-down`, `scale-in`, `expand-from-trigger`, `pulse-ring`. Utility classes: `animate-aurora-pan`, `animate-twinkle`, `animate-glow-breathe`, `animate-highlight-pulse`, `animate-fade-in-up`, etc.
- Sem framer-motion — animações são CSS puro

Convenções:
- Server actions em `*.actions.ts` retornam `ActionResult<T>` (`{ success: true; data: T } | { success: false; error: string }`)
- Services tenant-scoped em `src/services/*.service.ts`
- Validators Zod em `src/lib/validators/`
- Páginas dashboard em `src/app/(dashboard)/`
- Componentes de feature em `src/components/<feature>/`

---

## Objetivo

Hoje a aba `/atendente-ia` renderiza um formulário comum dentro de um `Card` padrão, idêntico às outras páginas do ERP. Queremos que **a experiência da Atendente IA pareça uma área distinta** — o usuário deve sentir que entrou "no quarto da Ana", num ambiente com personalidade própria, sem quebrar o design system nem deixar de respeitar o accent theme do tenant.

**Princípios de direção:**
1. **Diferenciar sem destoar**: a página continua usando os tokens (`primary`, `card`, `muted`, `border`), mas compõe camadas visuais extras (aurora blur, glow, avatar animado, live preview) que não existem no resto do ERP.
2. **Mostrar, não só configurar**: o usuário precisa **ver a Ana em ação** enquanto edita — um WhatsApp mockup ao vivo que reflete as mensagens conforme ele digita.
3. **Progresso de setup visível**: um indicador de "o quanto a Ana está pronta" (0-100%) pra dar sensação de onboarding guiado dentro da própria página.
4. **Respeitar dark mode e os 5 accent themes** — toda cor extra deve ser derivada de `var(--primary)` com alpha, nunca hex fixo.

---

## Arquivos a modificar/criar

### Modificar
- `src/app/(dashboard)/atendente-ia/page.tsx` — nova composição da página (hero + layout)
- `src/components/settings/bot-settings-panel.tsx` — **NÃO apagar**. Vamos aposentar esse componente da rota `/atendente-ia` (ele continua só sendo referenciado internamente se necessário). A rota nova vai usar os novos componentes abaixo.

### Criar (todos em `src/components/atendente-ia/`)
- `ana-hero.tsx` — hero com aurora background, avatar animado, saudação, readiness progress
- `ana-avatar.tsx` — avatar circular da Ana com `animate-glow-breathe` e pulse ring quando ativo
- `ana-readiness-score.tsx` — barra de progresso 0-100% calculada a partir dos campos preenchidos (nome, prompt, boas-vindas, fallback, horário, WhatsApp conectado)
- `ana-personality-section.tsx` — seção "Personalidade" (nome + preview do prompt readonly + link CTA pra ajustar via WhatsApp do suporte)
- `ana-messages-section.tsx` — seção "Mensagens" (boas-vindas + fallback) com contador de caracteres e preview lateral
- `ana-hours-section.tsx` — seção "Expediente" com toggle 24h + visualizador de timeline 24h mostrando intervalo ativo preenchido em primary
- `ana-whatsapp-preview.tsx` — mockup de tela de WhatsApp (header verde discreto no estilo WA, bolhas cinza/verde, hora) renderizando a mensagem de boas-vindas em tempo real conforme o usuário digita
- `ana-status-panel.tsx` — substitui os dois `Card`s da direita. Um só painel empilhando: status WhatsApp + resumo operacional + 3 mini-stats (mensagens hoje / agendamentos / tempo médio — mock se não existirem ainda, com badge "em breve")
- `ana-section-card.tsx` — card base das seções com borda `ring-1 ring-primary/10`, fundo `bg-card/60 backdrop-blur-sm`, hover subtle glow

### Opcional (se der tempo)
- `ana-tip-banner.tsx` — banner rotativo com dicas ("Quer que a Ana ofereça combos?", "Lembre de configurar mensagem fora do expediente…") com dismiss

---

## Direção visual detalhada

### Hero da página (`ana-hero.tsx`)

- Wrapper com `relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-10`
- Atrás do conteúdo, um blob aurora absoluto, filtrado: `absolute -top-24 -right-24 h-[380px] w-[380px] rounded-full bg-primary/25 blur-3xl animate-aurora-pan`
- Dois ou três pontos `animate-twinkle` absolutos em posições aleatórias (`h-1 w-1 rounded-full bg-primary/60`)
- Conteúdo em grid: esquerda = avatar + texto; direita = readiness score + CTA "Testar no WhatsApp" (se conectado) ou badge "Aguardando ativação"
- Título: `<h1>` em duas linhas — "Olá, eu sou a <span>Ana.</span>" onde o nome usa `bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent`
- Subtítulo: "Sua atendente virtual para WhatsApp. Configure abaixo como quero atender seus clientes."
- Todo hero tem `animate-fade-in-down`

### Avatar (`ana-avatar.tsx`)

- Círculo de 80-96px com gradient radial de `primary` pra `primary/40`
- Ícone `Sparkles` ou `Bot` (lucide) centrado, `text-primary-foreground`
- Se `isActive`, aplica `animate-glow-breathe` + pulse ring externo usando `@keyframes pulse-ring`
- Se inativo, versão dessaturada (`opacity-70 grayscale-[0.3]`) sem glow
- Suporta tamanhos sm/md/lg via prop

### Readiness score (`ana-readiness-score.tsx`)

- Calcula porcentagem com base em 6 critérios (cada 1 vale ~16.6%):
  1. Nome preenchido e != "Ana" ou != default → +1 (se == "Ana" conta 0.5)
  2. Prompt de personalidade customizado (≠ default) → +1
  3. Mensagem de boas-vindas preenchida → +1
  4. Mensagem de fallback preenchida → +1
  5. Horário definido (24h ou start/end válido) → +1
  6. WhatsApp conectado (`phoneNumberId && isActive`) → +1
- Visual: `<Progress>` do shadcn com fill em `var(--primary)` + label "Ana está XX% pronta"
- Abaixo: lista checklist com 6 itens mostrando ✓ verde ou ○ outline + texto cinza. Usa `Check` e `Circle` do lucide.
- Quando 100%, renderiza celebração: confete simples via spans absolutos com `animate-twinkle` ou toast único on-mount

### Seções de configuração (`ana-*-section.tsx`)

- Cada seção usa `<AnaSectionCard>` como wrapper
- Header da seção: ícone colorido (dentro de `rounded-xl bg-primary/10 p-2`) + título + subtítulo. Ícones sugeridos:
  - Personality: `Sparkles`
  - Messages: `MessagesSquare`
  - Hours: `CalendarClock`
- Hover no card: `ring-primary/30` e `shadow-[0_12px_40px_-8px_rgba(var(--primary-rgb),0.15)]` — SE não der pra fazer rgb de var OKLch, usa apenas `hover:ring-primary/30 transition-all duration-300`
- Labels: `text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground`
- Inputs: padrão do shadcn, sem mudança
- Contador de caracteres abaixo dos textareas (`{value.length}/500` em `text-xs text-muted-foreground`)

### Timeline 24h em Hours Section

- Barra horizontal representando 24h, altura 10px, `rounded-full bg-muted`
- Range ativo preenchido em `bg-primary` com transição suave
- Dividida visualmente em 6 marcos (0h, 4h, 8h, 12h, 16h, 20h, 24h) com labels pequenos
- Se `botIsAlwaysActive`, a barra fica toda preenchida em `bg-primary` com shimmer sutil (reusar `animate-highlight-pulse`)

### WhatsApp Preview (`ana-whatsapp-preview.tsx`)

- Container com aspect ratio 9:16 simulando tela de celular (max altura 480px, largura ~280px)
- Header verde WhatsApp-like: `bg-emerald-600 text-white` com avatar da Ana + nome + "online"
- Background do chat: pattern claro (pode ser CSS `bg-[#ECE5DD] dark:bg-[#0B141A]` — exceção justificada pra manter realismo do WhatsApp, documentar no comentário)
- Bolha cinza "cliente": "Oi, quero marcar um horário 😊" — fixa pra demonstrar fluxo
- Bolha verde/branca "Ana": renderiza `greetingMessage` em tempo real (via prop controlada)
- Abaixo: timestamp fake + tick duplo azul
- Fora do container: caption "Assim seus clientes vão ver as mensagens da Ana"

### Status Panel (`ana-status-panel.tsx`)

- Um único card substitui os dois atuais (Status WhatsApp e Resumo Operacional)
- Topo: dot animado (`animate-pulse`) + "Ana está ativa / aguardando ativação"
- Grid de 3 mini-stats: "Mensagens hoje", "Agendamentos pela Ana", "Tempo médio de resposta" — se não houver dado real ainda, mostra "—" e badge "em breve" em cinza claro
- Footer: botão `variant="outline"` "Testar conversa" que futuramente vai abrir um playground (por enquanto `disabled` com tooltip "Em breve") + link discreto "Falar com suporte pra conectar WhatsApp" (wa.me do suporte)

---

## Layout geral da página nova

```
src/app/(dashboard)/atendente-ia/page.tsx
┌─────────────────────────────────────────────────────────┐
│  <AnaHero />                                            │  (full width)
└─────────────────────────────────────────────────────────┘
┌──────────────────────────────┬──────────────────────────┐
│  <AnaPersonalitySection />   │                          │
│  <AnaMessagesSection />      │  <AnaWhatsAppPreview />  │  (sticky top-6)
│  <AnaHoursSection />         │  <AnaStatusPanel />      │
│  <SaveBar />                 │                          │
└──────────────────────────────┴──────────────────────────┘
```

- Grid: `grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,380px)]`
- Coluna direita `xl:sticky xl:top-6 xl:self-start`
- `SaveBar` — barra fixa no bottom da coluna esquerda OU footer sticky. Usa um componente inline com botão "Salvar alterações" + indicador "Você tem X alterações não salvas" quando o form está dirty
- Animações staggered: hero `animate-fade-in-down`, cada section com delay (adicionar style `animationDelay: '100ms'`, `'200ms'`, etc)

---

## Estado e server action

- Continuar usando `updateBotConfigAction` de `src/actions/bot-config.actions.ts` (inalterado)
- A página virou **client component** em grande parte porque o preview e o readiness precisam de estado reativo. Mas a `page.tsx` continua server component, faz `getBotConfigByTenantId` e passa tudo pro `<AnaStudio settings={settings} />` (componente client).
- Renomear `BotSettingsPanel` pra um wrapper interno ou criar novo `ana-studio.tsx` em `src/components/atendente-ia/ana-studio.tsx` que orquestra o estado e renderiza todas as seções.
- Estado centralizado em `ana-studio.tsx` com um único `useReducer` ou múltiplos `useState`. As seções recebem valores + handlers via props.
- Campo "systemPrompt" continua readonly (só editável via suporte), mostra preview truncado com botão "Ver completo" → abre `<Dialog>` com o prompt inteiro.

---

## Acessibilidade e performance

- Todos os ícones decorativos com `aria-hidden="true"`
- Barra de readiness com `role="progressbar"` e `aria-valuenow/min/max`
- `@media (prefers-reduced-motion: reduce)` já neutraliza as animações globalmente — confirmar que nada nosso burla isso
- O WhatsApp preview usa `aria-label="Pré-visualização de como a Ana aparece no WhatsApp"` no wrapper
- Aurora e twinkle devem ter `pointer-events-none` pra não interferir com cliques
- Blur/glow só em `xl:` (desktop) se possível — mobile mantém o hero simples sem blobs gigantes pra não penalizar perf

---

## Critérios de aceitação

1. `npm run build` passa sem erros de TS
2. `/atendente-ia` renderiza com hero + duas colunas conforme layout acima
3. Readiness score atualiza em tempo real ao digitar nos campos
4. WhatsApp preview reflete `greetingMessage` em tempo real
5. Botão "Salvar configurações" só habilita quando o form está dirty e chama `updateBotConfigAction`
6. Toasts de sucesso/erro via `sonner`
7. Testar visualmente nos 5 accent themes (basta trocar `tenant.accentTheme` no banco e recarregar) — a cor primary acompanha em todos os elementos
8. Dark mode funcional (aurora, avatar, cards legíveis)
9. Mobile: hero simplifica, colunas viram uma só, WhatsApp preview vira seção abaixo (não sticky)
10. Nenhuma cor hex hardcoded fora do caso justificado do WhatsApp pattern (comentar no código quando for)
11. Página não regride em funcionalidade — todos os campos que o `BotSettingsPanel` atual salva continuam sendo salvos

---

## Detalhes de implementação que vão salvar tempo

- O ícone `Sparkles` do lucide é o símbolo mais "IA" e combina com o conceito — use-o no avatar e na seção Personalidade
- Pra cor primary com alpha em Tailwind v4 com tokens OKLch, use `bg-primary/10`, `ring-primary/20`, etc — isso funciona nativo
- Se precisar de um gradient radial, use `bg-[radial-gradient(circle_at_30%_20%,var(--primary)_0%,transparent_60%)]` inline
- Pra aurora blob animado, absoluto, atrás, sempre `pointer-events-none z-0`, conteúdo em `relative z-10`
- Contador de caracteres: `useMemo(() => value.length, [value])` — não é necessário, direto inline também serve
- Readiness: um único `useMemo` que recebe o estado atual e retorna `{ score: number, items: Array<{label, done}> }`
- Extraiu o valor default do `systemPrompt`, nome padrão "Ana", boas-vindas padrão "Olá! Sou a Ana..." de `src/lib/bot-config.ts` — use pra comparar no readiness (custom vs default)

---

## O que NÃO fazer

- Não criar tema novo nem nova paleta — usa só os tokens existentes com variações de alpha
- Não instalar framer-motion nem outras libs de animação — só CSS existente
- Não tocar no schema Prisma nem no service — só UI
- Não quebrar acessibilidade com efeitos que ignorem reduced-motion
- Não adicionar cores hex a menos que seja o pattern específico do WhatsApp preview (e comente no código)
- Não transformar a página num wizard multi-step — continua scrollável numa página só, com seções bem delimitadas

---

## Passo-a-passo sugerido de implementação

1. Criar pasta `src/components/atendente-ia/` e os arquivos stub
2. Implementar `ana-avatar.tsx` (componente mais simples)
3. Implementar `ana-hero.tsx` usando o avatar
4. Criar `ana-studio.tsx` (client component) com estado e layout de grid
5. Criar `ana-section-card.tsx` e implementar as 3 seções (personality, messages, hours)
6. Implementar `ana-whatsapp-preview.tsx`
7. Implementar `ana-readiness-score.tsx` e integrar no hero
8. Implementar `ana-status-panel.tsx`
9. Atualizar `page.tsx` pra renderizar `<AnaStudio settings={settings} />`
10. Rodar `npm run build`, corrigir tipagem
11. Smoke test visual nos 5 accent themes + dark mode
