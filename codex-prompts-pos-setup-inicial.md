# Prompts pro Codex — bloqueadores pós setup-inicial

Cada seção é um prompt independente. Cole **todo o bloco** (incluindo o "Contexto compartilhado" no topo) ao iniciar uma tarefa nova com o Codex, ou cole só a seção do prompt se a sessão já tem o contexto.

---

## Contexto compartilhado — cole no início de QUALQUER tarefa

Você está trabalhando no **Receps ERP**, um SaaS multitenant em pt-BR para clínicas estéticas, barbearias, salões, odontologia, centros estéticos e studios de beleza.

**Stack obrigatória:**
- Next.js **16.2** (App Router) — IMPORTANTE: a v16 tem breaking changes em relação ao que você foi treinado. SEMPRE leia `node_modules/next/dist/docs/` antes de usar APIs do Next. Note também que o middleware do projeto fica em `src/proxy.ts` (convenção nova da v16), não em `middleware.ts`.
- React 19, TypeScript estrito.
- Tailwind CSS **v4** (config no `postcss.config.mjs`, sem `tailwind.config.js`).
- shadcn/ui sobre **base-ui** (não Radix). Componentes em `src/components/ui/`.
- Prisma **7** + PostgreSQL. Cliente gerado em `src/generated/prisma/client.ts`. Enums em `src/generated/prisma/enums.ts`.
- NextAuth (Credentials provider). Helpers em `src/lib/session.ts`: `getAuthUser`, `getOptionalSession`, `getAuthUserWithAccess`, `requireSuperAdmin`. Middleware do auth em `src/proxy.ts` usando `withAuth`.
- Recharts, Sonner (`toast.success/.error`), Zod (validators em `src/lib/validators/`).
- next-themes pra dark/light mode. Tokens OKLch + 5 accent themes (`TenantAccentTheme`).

**Convenções do projeto:**
- Toda copy é em **pt-BR** ("Cadastrar", "Salvar", "Voltar", "Continuar"). Sem inglês na UI.
- Server Actions ficam em `src/actions/*.actions.ts`, retornam `ActionResult<T>` (`{ success: true; data: T } | { success: false; error: string }`) definido em `src/types/index.ts`.
- Lógica de banco fica em `src/services/*.service.ts`, sempre escopada por `tenantId`.
- Validators Zod ficam em `src/lib/validators/`.
- Páginas de marketing ficam em `src/app/(marketing)/`. Dashboard em `src/app/(dashboard)/`. Auth em `src/app/(auth)/`.
- Toast: `import { toast } from "sonner"`.
- Dinheiro sempre `Prisma.Decimal` no banco; `BRL` no display.

**Estado atual (16/04/2026):**
- Setup inicial implementado em `/bem-vindo` (4 passos: segmento+serviços, profissional, horário, tudo pronto). Componentes em `src/components/setup/`. Actions em `src/actions/setup.actions.ts`. Helper de gate em `src/lib/setup-guard.ts`.
- Tenant tem 3 novos campos: `businessSegment` (`TenantBusinessSegment`), `setupCompletedAt`, `setupSkippedAt`. Migration `20260416150000_add_tenant_business_segment_and_setup`.
- Signup redireciona pra `/bem-vindo` (antes ia pra `/onboarding` — que é a tela de status pós-Stripe checkout).
- Trial 7 dias sem cartão. 3 planos (`somente-erp`, `somente-atendente-ia`, `erp-atendente-ia`). Webhook em `/api/webhooks/stripe`.
- Stripe Billing Portal pra adicionar cartão. Bloqueio em `/assinatura/bloqueada` quando trial expira sem pagamento.
- Páginas de marketing: `/`, `/atendentes-ia`, `/erp`, `/erp-atendente-ia`, `/cadastro`, `/assinar`. Footer ainda placeholder.

**Antes de codar QUALQUER coisa:**
1. Leia o(s) arquivo(s) que você vai modificar.
2. Veja como features parecidas foram implementadas no projeto (ex: outra Server Action, outra rota de marketing).
3. Não invente convenções — copie as existentes.
4. Se precisar de migration Prisma, gere o SQL manualmente em `prisma/migrations/<timestamp>_<nome>/migration.sql` seguindo o padrão dos arquivos vizinhos.

---

## Prompt 1 — Páginas legais (`/termos` e `/privacidade`)

**Objetivo:** publicar os Termos de Uso e a Política de Privacidade compatíveis com LGPD, linkadas no signup, no footer e no aviso de cookies.

**Escopo de arquivos a criar/modificar:**
- `src/app/(marketing)/termos/page.tsx` — página estática server component.
- `src/app/(marketing)/privacidade/page.tsx` — idem.
- `src/components/marketing/legal-document.tsx` — wrapper visual reutilizável (header com data de atualização, sumário com âncoras, prose styles).
- `src/components/marketing/site-footer.tsx` — checar se existe; se sim, adicionar links pra `/termos` e `/privacidade`. Se não, criar o componente e usar nas páginas marketing.
- `src/components/auth/signup-form.tsx` — adicionar checkbox "Li e aceito os Termos e a Política de Privacidade" (validação obrigatória) com links pras duas páginas abrindo em nova aba.
- `src/components/marketing/cookie-consent-banner.tsx` — banner LGPD discreto bottom-fixed que aparece na primeira visita. Salva consentimento em cookie `receps_cookie_consent` (1 ano). Inclua botão "Aceitar" e link pra "Saiba mais" (→ `/privacidade#cookies`).

**Conteúdo dos termos (mínimo):**
1. Identificação do Receps (CNPJ, contato).
2. Descrição do serviço (SaaS de gestão pra estabelecimentos de atendimento).
3. Cadastro e conta (responsabilidades do titular, idade mínima 18, veracidade de dados, CNPJ obrigatório).
4. Trial e cobrança (7 dias gratuitos, conversão automática se cartão for adicionado, política de cancelamento, reembolso pro-rata em até 7 dias da primeira cobrança).
5. Uso aceitável (proibições: spam, conteúdo ilegal, engenharia reversa, revenda).
6. Propriedade intelectual (Receps detém o software; cliente detém seus dados).
7. Suspensão e encerramento.
8. Limitação de responsabilidade (uptime alvo 99.5%, sem garantia de receita do cliente).
9. Foro: comarca da sede do Receps; lei brasileira.

**Conteúdo da política de privacidade (LGPD — mínimo):**
1. Quem somos (controlador) + DPO/contato `privacidade@receps.com.br`.
2. Quais dados coletamos: cadastro (nome, email, telefone, CNPJ), uso (logs, IP, device), pagamento (Stripe é processador, não armazenamos cartão), dados de clientes-finais inseridos pelo tenant (papel: operador).
3. Bases legais (execução de contrato, legítimo interesse, consentimento pra marketing).
4. Finalidades por categoria.
5. Compartilhamento (Stripe, AWS/Vercel, ferramenta de email transacional, Meta/Google só com consentimento de cookies).
6. Cookies: necessários, analíticos (com consentimento), marketing (com consentimento). Tabela com nome, propósito, retenção.
7. Direitos do titular (art. 18 LGPD): acesso, correção, anonimização, portabilidade, eliminação, revogação. Como exercer (email).
8. Retenção (dados de conta enquanto ativa + 5 anos após encerramento; dados fiscais 5 anos).
9. Segurança (criptografia em trânsito e repouso, controle de acesso por tenant).
10. Transferência internacional (Stripe — EUA, com cláusulas-padrão).
11. Encarregado, alterações da política, data de última atualização.

**Visual:** layout limpo tipo "documento", largura máxima `max-w-3xl`, prose tailwind, sumário lateral em `lg:` com âncoras suaves, header sticky com título e data de atualização, breadcrumb voltando pra `/`.

**Acceptance criteria:**
- `npm run build` passa.
- Signup com checkbox desmarcado bloqueia submit (validar com zod, msg "Você precisa aceitar os termos").
- Banner de cookies não aparece após aceitar (cookie persistido).
- Footer aparece em todas as páginas de `/`, `/erp`, `/atendentes-ia`, `/erp-atendente-ia`, `/cadastro`, `/assinar`, `/termos`, `/privacidade`.
- Lighthouse SEO ≥ 95 nas duas páginas legais.

---

## Prompt 2 — Emails transacionais com Resend

**Objetivo:** disparar 3 emails-chave do funil pra reduzir churn e aumentar ativação. Usar Resend porque tem API simples + react-email + bom free tier.

**Escopo de arquivos a criar/modificar:**
- `package.json` — adicionar `resend@^4`, `@react-email/components@^0.0.25`, `@react-email/render@^1`.
- `.env.example` — adicionar `RESEND_API_KEY=`, `EMAIL_FROM="Receps <oi@receps.com.br>"`, `EMAIL_REPLY_TO=suporte@receps.com.br`.
- `src/lib/email/client.ts` — singleton do Resend client com check de env var.
- `src/lib/email/templates/welcome.tsx` — template react-email "Bem-vindo, vamos configurar sua conta" (CTA → `/bem-vindo`).
- `src/lib/email/templates/trial-ending.tsx` — "Seu trial termina em 2 dias" (CTA → `/configuracoes/assinatura`).
- `src/lib/email/templates/payment-failed.tsx` — "Não conseguimos processar seu pagamento" (CTA → Stripe Billing Portal via `/api/billing/portal`).
- `src/lib/email/templates/components.tsx` — header, footer, button compartilhados.
- `src/services/email.service.ts` — funções `sendWelcomeEmail`, `sendTrialEndingEmail`, `sendPaymentFailedEmail`. Cada uma recebe `tenantId` e busca dados.
- `src/actions/signup.actions.ts` — disparar `sendWelcomeEmail` ao final do signup bem-sucedido (não bloquear o fluxo se o email falhar; só logar).
- `src/app/api/webhooks/stripe/route.ts` — adicionar handlers pra eventos `customer.subscription.trial_will_end` (D-3, mas filtre pra disparar só uma vez por subscription) e `invoice.payment_failed` (chamando os respectivos email senders).
- `prisma/schema.prisma` — adicionar tabela `EmailLog` (`id`, `tenantId`, `template`, `recipient`, `status`, `providerId`, `error`, `sentAt`) pra auditoria. Criar migration.

**Detalhes dos templates (cada um):**
- Header com logo (texto "Receps" estilizado, sem imagem por enquanto).
- Saudação personalizada com `tenantName` ou `userName`.
- Corpo curto (3-5 frases).
- 1 botão CTA principal.
- Footer com endereço fictício, link pra cancelar assinatura, link pra `/privacidade`.
- Use `@react-email/components` (Container, Section, Text, Button, Hr, Link).

**Critérios de retry/idempotência:**
- Antes de mandar `trial-ending`, checar `EmailLog` se já não foi enviado pra essa subscription nos últimos 7 dias.
- Antes de mandar `payment-failed`, debounce de 24h (não spammar a cada retry do Stripe).
- Welcome só roda 1 vez (na criação do tenant).

**Acceptance criteria:**
- Signup novo → email "welcome" cai na caixa de entrada de teste em <30s.
- `stripe trigger customer.subscription.trial_will_end` no Stripe CLI dispara email de trial-ending (ou só uma vez por subscription).
- `stripe trigger invoice.payment_failed` dispara email de payment-failed.
- Falha no Resend não derruba o webhook (response 200 + log).
- Tabela `EmailLog` registra status de cada envio.

---

## Prompt 3 — Botão flutuante de suporte WhatsApp

**Objetivo:** botão fixo bottom-right que abre o WhatsApp da equipe Receps pré-preenchido. Visível em todas as páginas de marketing e dentro do dashboard.

**Escopo de arquivos a criar/modificar:**
- `.env.example` — adicionar `NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER=5511999999999` (formato E.164 sem +).
- `src/components/support/whatsapp-fab.tsx` — Floating Action Button. Posicionado `fixed bottom-4 right-4 z-40`, ícone do WhatsApp (usar SVG inline, não dependência), tooltip "Falar com a gente" no hover, animação sutil de pulse no primeiro carregamento, suporte a tema claro/escuro.
- `src/components/support/whatsapp-fab.tsx` recebe prop opcional `prefilledMessage` e gera URL `https://wa.me/<numero>?text=<encoded>`.
- `src/app/(marketing)/layout.tsx` — incluir `<WhatsAppFab prefilledMessage="Oi! Vim do site do Receps..." />`.
- `src/app/(dashboard)/layout.tsx` — incluir `<WhatsAppFab prefilledMessage="Oi! Sou usuário do Receps (tenant: <slug>) e..." />` — recebe `tenantSlug` por prop pra personalizar.

**Comportamento:**
- Se `NEXT_PUBLIC_WHATSAPP_SUPPORT_NUMBER` não estiver setado, NÃO renderizar (evitar botão quebrado em PR/preview).
- Em mobile, deslocar pra `bottom-20 right-4` em rotas com bottom-nav (verificar se o dashboard tem bottom-nav mobile).
- Em `/bem-vindo`, esconder o FAB pra não poluir o wizard.
- Acessibilidade: `aria-label="Falar com o suporte do Receps no WhatsApp"`, foco visível, abre em nova aba (`target="_blank" rel="noopener"`).

**Acceptance criteria:**
- Botão aparece em `/`, `/erp`, `/atendentes-ia`, `/dashboard`, `/agenda`, etc.
- Botão NÃO aparece em `/bem-vindo`, `/login`, `/cadastro`, `/assinatura/bloqueada`.
- Click abre WhatsApp Web/app com mensagem pré-preenchida correta.
- Sem warning de hydration.

---

## Prompt 4 — Centro de ajuda `/ajuda` com FAQ

**Objetivo:** página pública com 18-25 perguntas frequentes pra reduzir suporte 1:1, melhorar SEO long-tail e ser destino do botão "Ajuda" do header.

**Escopo de arquivos a criar/modificar:**
- `src/app/(marketing)/ajuda/page.tsx` — página principal.
- `src/app/(marketing)/ajuda/[slug]/page.tsx` — página individual de cada artigo (SEO, link compartilhável).
- `src/lib/help/articles.ts` — fonte única de verdade. Array tipado de `{ slug, category, question, answerMarkdown, updatedAt, relatedSlugs }`.
- `src/components/help/help-search.tsx` — input de busca client com filtro fuzzy simples (sem dependência — string matching) por pergunta + tags.
- `src/components/help/help-category-grid.tsx` — grid de cards por categoria.
- `src/components/help/help-article-card.tsx` — card compacto na listagem.
- `src/components/help/help-article-renderer.tsx` — renderiza Markdown (use `react-markdown` + `remark-gfm`; adicionar deps).
- `src/components/layout/header.tsx` — adicionar item "Ajuda" linkando pra `/ajuda` (header do dashboard).
- Atualizar footer marketing pra incluir "Ajuda" e "Contato (WhatsApp)".

**Categorias e artigos mínimos (escreva os 20 com pelo menos 3 parágrafos cada):**

**Primeiros passos (5):**
1. Como configurar minha conta pela primeira vez?
2. O que é o trial de 7 dias e como funciona?
3. Quando preciso adicionar um cartão de crédito?
4. Posso testar sem CNPJ?
5. Como cadastrar meu primeiro serviço?

**Agenda e atendimentos (5):**
6. Como criar um agendamento?
7. Como bloquear horários (folga, almoço, feriado)?
8. Como reagendar ou cancelar um atendimento?
9. O cliente pode agendar sozinho?
10. Como funciona o lembrete pro cliente?

**Equipe e comissões (3):**
11. Como adicionar outro profissional na equipe?
12. Como funciona o cálculo de comissões?
13. Como dar acesso restrito (recepcionista vs admin)?

**Financeiro (3):**
14. Como abrir e fechar caixa?
15. Como registrar uma despesa?
16. De onde vem o número de faturamento do dashboard?

**Cobrança e plano (3):**
17. Como mudar de plano?
18. Como cancelar minha assinatura?
19. Como atualizar meu cartão de crédito?

**Atendente IA / WhatsApp (1):**
20. Como conectar meu WhatsApp na Ana?

**Visual e UX:**
- Hero com search bar centralizada e tagline "Tire suas dúvidas sobre o Receps".
- Abaixo, grid de categorias clicáveis (vai pra âncora ou filtra).
- Lista de artigos por categoria.
- Página de artigo: breadcrumb (Ajuda → Categoria → Artigo), título, data, conteúdo prose, "Artigos relacionados" no fim, "Não achou o que procurava? Fala com a gente no WhatsApp" com link.
- Link "Voltar pra Ajuda" no topo do artigo.

**Acceptance criteria:**
- Busca client filtra em < 100ms.
- Cada artigo tem URL própria (`/ajuda/como-criar-um-agendamento`) com sitemap.
- `<head>` de cada artigo tem `<title>`, `<meta description>` e Open Graph.
- Páginas geradas estaticamente (`generateStaticParams`).
- Lighthouse SEO ≥ 95.

---

## Prompt 5 — Analytics: Meta Pixel + GA4 + 9 eventos de conversão

**Objetivo:** instrumentar o funil de marketing e ativação pra rodar campanhas de tráfego pago com mensuração confiável.

**Escopo de arquivos a criar/modificar:**
- `.env.example` — adicionar `NEXT_PUBLIC_META_PIXEL_ID=`, `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXX`, `META_CONVERSIONS_API_TOKEN=` (server-side), `META_CONVERSIONS_API_DATASET_ID=`.
- `src/components/analytics/analytics-scripts.tsx` — componente client que injeta os scripts do Meta Pixel e GA4 no `<head>`. Respeita `cookie consent` (não carrega se o usuário ainda não aceitou cookies analíticos).
- `src/app/layout.tsx` — incluir `<AnalyticsScripts />` no body, depois do conteúdo.
- `src/lib/analytics/events.ts` — definir 9 event types com payload tipado. Funções: `trackEvent(name, payload)` que dispara em ambos (Pixel + GA4).
- `src/lib/analytics/server-events.ts` — funções server-side que postam no Conversions API do Meta (mais confiável que client). Payload inclui `event_id` (deduplica com client), `event_source_url`, `user_data` (email hashed sha256), `custom_data`.
- Pontos de instrumentação:
  - `src/components/auth/signup-form.tsx` → `signup_started` ao primeiro keystroke; `signup_completed` no submit success.
  - `src/app/(marketing)/cadastro/page.tsx` ou nas páginas `/erp` e `/atendentes-ia` → `plan_selected` quando o usuário clica num CTA com `?plan=xxx`.
  - `src/services/billing.service.ts` (`createTrialSubscription`) → server-side `trial_started` via Conversions API.
  - Webhook Stripe `customer.subscription.updated` (transição pra ACTIVE) → server-side `subscription_active`.
  - `src/app/api/billing/portal` ou onde o cartão é confirmado → `payment_method_added`.
  - `src/actions/setup.actions.ts:saveSetupSegmentAndServicesAction` → `first_service_created`.
  - `src/services/appointment.service.ts:createAppointment` (na primeira vez do tenant) → `first_appointment_created`.
  - Layout root → `page_view` em mudança de rota.

**9 eventos canônicos (use exatamente estes nomes):**
1. `page_view`
2. `signup_started`
3. `signup_completed`
4. `plan_selected` ({ plan_slug })
5. `trial_started` ({ plan_slug, value, currency: "BRL" })
6. `payment_method_added` ({ plan_slug })
7. `first_service_created` ({ segment })
8. `first_appointment_created`
9. `subscription_active` ({ plan_slug, value, currency: "BRL" })

**Critérios:**
- Sem `console.error` nem warning de hydration.
- Eventos só disparam em produção (`process.env.NODE_ENV === "production"`) ou se `NEXT_PUBLIC_ANALYTICS_DEBUG=true`.
- Conversions API usa `event_id` igual ao client pra deduplicar no Meta.
- Documentar no README como obter os IDs.

**Acceptance criteria:**
- Aba "Test Events" do Meta Events Manager mostra `signup_started` ao começar a digitar no signup.
- GA4 Realtime mostra `signup_completed` após criar conta de teste.
- Webhook Stripe local (`stripe listen`) gera evento `subscription_active` no GA4.

---

## Prompt 6 — Checklist E2E: signup → trial → primeira cobrança

**Objetivo:** validar manualmente os 6 cenários críticos do funil em Stripe Test Mode antes de abrir tráfego pago. Não é tarefa de código — é doc + roteiro de teste.

**Escopo:**
- `docs/qa/funil-signup-checklist.md` — checklist em formato markdown, marcação `[ ]` por step. Inclua o que esperar em cada momento (URL, status do tenant, status da subscription no Stripe Dashboard, emails recebidos).

**6 cenários a documentar (cada um com pré-condição, passos, asserts):**

1. **Happy path completo:** signup → wizard → adiciona cartão (4242…) no D5 → trial vira ACTIVE no D8 → cobrança debitada → email de invoice.
2. **Trial expira sem cartão:** signup → wizard → não adiciona cartão → no D8 webhook `customer.subscription.deleted` → tenant vai pra `/assinatura/bloqueada` → reativa via Billing Portal → volta pra ACTIVE.
3. **Cartão rejeitado:** signup → adiciona cartão `4000 0000 0000 9995` (decline) → trial não converte → email `payment-failed` → tenta de novo com 4242 → sucesso.
4. **Cartão exige 3DS:** adiciona `4000 0027 6000 3184` → fluxo de autenticação → confirma → ACTIVE.
5. **Cancelamento dentro do trial:** Billing Portal → cancelar → status SUSPENDED → tenant não acessa dashboard → email de confirmação de cancelamento.
6. **Mudança de plano dentro do trial:** ERP → upgrade pra COMBO no D3 → confirma proration → próxima cobrança reflete novo valor.

**Para cada cenário, documentar:**
- Pré-requisitos (Stripe CLI rodando, `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, .env de test mode).
- Passos numerados.
- O que conferir: URL final, valor de `tenant.lifecycleStatus` e `subscription.status` no Prisma Studio, eventos no Stripe Dashboard, emails na caixa de entrada.
- Como resetar pra rodar de novo (script SQL ou comando).

**Bonus (opcional):** criar `scripts/qa/reset-test-tenant.ts` que recebe um email e apaga o tenant + user + subscription correspondentes (só funciona em `NODE_ENV !== "production"`).

---

## Prompt 7 (opcional) — Banner de "X dias de trial" no dashboard

**Objetivo:** lembrar o usuário do trial sem ser irritante. Hoje existe `TrialStatusBanner` em `src/components/billing/trial-status-banner.tsx` — verifique se ele já cobre os requisitos abaixo, e ajuste o que faltar.

**Requisitos:**
- Mostrar banner colorido no topo do dashboard nos últimos 3 dias do trial (D-3 amarelo, D-1 vermelho).
- CTA "Adicionar cartão" → abre Stripe Billing Portal via `/api/billing/portal`.
- Botão de fechar (dispensa por 24h via cookie `trial_banner_dismissed`).
- Sumir uma vez que o cartão foi adicionado (status = ACTIVE com `default_payment_method`).
- Mostrar variação verde "Trial ativo, cartão cadastrado, X dias até a primeira cobrança" quando cartão estiver salvo.

---

## Ordem sugerida de execução

Pra entrar em paid ads o mais rápido possível, sugiro:

1. **Prompt 1 (Páginas legais)** — bloqueador legal e LGPD; sem isso, qualquer ad é risco.
2. **Prompt 6 (Checklist E2E)** — antes de qualquer mudança grande, validar que o funil hoje funciona ponta a ponta.
3. **Prompt 3 (Botão WhatsApp)** — 30 minutos de trabalho, alto impacto em ativação e suporte.
4. **Prompt 4 (`/ajuda`)** — destino do botão "Ajuda" e SEO de cauda longa.
5. **Prompt 2 (Emails transacionais)** — captura usuários no momento de churn (D-2 trial, payment failed).
6. **Prompt 5 (Analytics)** — necessário pra rodar ads, mas só funciona se o funil já está estável.
7. **Prompt 7 (Banner trial)** — ajuste fino, pode ir depois.

Tempo estimado total (Codex + revisão sua): 5-7 dias se sequencial, 3-4 dias se você revisa os PRs em paralelo.
