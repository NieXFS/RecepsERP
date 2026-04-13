# CODEX-PROMPT: Migração do Bot WhatsApp para Multi-Tenant

## Contexto Geral

O Receps ERP é um SaaS multi-tenant para clínicas de beleza/saúde. Atualmente existe um bot WhatsApp
("Ana") que funciona como atendente virtual para agendamentos. O bot é duplicado manualmente
por cliente — cada cópia tem sua própria pasta e `.env` com credenciais distintas.

**Objetivo**: Transformar o bot em multi-tenant, permitindo que:
1. Um único processo sirva N clientes, roteando pelo `phoneNumberId` do webhook.
2. Cada tenant configure a "personalidade" da atendente (system prompt) diretamente no ERP.
3. Toda a config do bot (credenciais WhatsApp, chave OpenAI, prompt, modelo) venha do banco de dados.

**Localizações dos projetos no computador:**
- **ERP**: pasta atual do workspace (raiz do projeto Next.js)
- **Bot base (Ana)**: `~/Library/Mobile Documents/com~apple~CloudDocs/Documents/BOTs/Ana`

---

## PARTE 1 — Prisma Schema: Modelo BotConfig

**Arquivo**: `prisma/schema.prisma`

Adicionar o modelo `BotConfig` vinculado ao `Tenant`. Cada tenant terá no máximo um bot configurado.

```prisma
model BotConfig {
  id        String   @id @default(cuid())
  tenantId  String   @unique
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // ── WhatsApp Cloud API ──────────────────────────────────────
  wabaId          String?          // WhatsApp Business Account ID (Meta)
  phoneNumberId   String?  @unique // ID do número no Cloud API — usado para rotear webhooks
  waAccessToken   String?          // System User Token ou token do Embedded Signup
  waVerifyToken   String?          // Token de verificação do webhook (gerado pelo sistema)
  waApiVersion    String   @default("v21.0")

  // ── Personalidade / IA ──────────────────────────────────────
  botName         String   @default("Ana")       // Nome da atendente virtual
  systemPrompt    String   @db.Text              // Prompt de personalidade editável pelo cliente
  greetingMessage String?  @db.Text              // Mensagem de saudação (primeiro contato)
  fallbackMessage String?  @db.Text              // Mensagem quando a IA não consegue responder
  aiProvider      String   @default("openai")     // "openai" por enquanto, extensível
  aiModel         String   @default("gpt-4o-mini")
  aiTemperature   Float    @default(0.7)
  aiMaxTokens     Int      @default(500)
  openaiApiKey    String?                         // Chave OpenAI do tenant (ou usa a global)

  // ── Horário de funcionamento do bot ─────────────────────────
  botActiveStart  String   @default("08:00")  // HH:mm — bot responde a partir desse horário
  botActiveEnd    String   @default("20:00")  // HH:mm — depois disso, manda mensagem de fora do expediente
  timezone        String   @default("America/Sao_Paulo")

  // ── Status ──────────────────────────────────────────────────
  isActive        Boolean  @default(false)    // Só ativa após config completa
  activatedAt     DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("bot_configs")
}
```

**Também adicionar** a relação inversa no modelo `Tenant`:
```prisma
// No model Tenant, adicionar:
botConfig BotConfig?
```

**Valor default do `systemPrompt`** — usar exatamente o texto que está hardcoded em
`BOTs/Ana/src/services/brainService.ts` na função `buildSystemPrompt()`, MAS removendo a parte
de "CONTEXTO TEMPORAL" (que será injetada dinamicamente pelo código). Ou seja, salvar apenas a
parte da personalidade + regras de formatação + fluxo de agendamento + regras de comportamento.

Depois de editar o schema, rodar:
```bash
npx prisma migrate dev --name add-bot-config
```

---

## PARTE 2 — API: Endpoint para o Bot buscar sua config

**Criar**: `src/app/api/v1/bot/config/route.ts`

Endpoint que o bot chama ao receber um webhook para carregar a config do tenant correspondente.

```
GET /api/v1/bot/config?phoneNumberId=1075428132314639
Authorization: Bearer <AI_BOT_API_KEY>
```

**Lógica**:
1. Validar Bearer token usando `requireAiBotApiKey()` de `src/lib/api-auth.ts`.
2. Receber `phoneNumberId` como query param.
3. Buscar `BotConfig` pelo `phoneNumberId` (campo unique) com `include: { tenant: true }`.
4. Retornar JSON com:
   - `tenantSlug`: do `tenant.slug`
   - `botName`, `systemPrompt`, `greetingMessage`, `fallbackMessage`
   - `aiModel`, `aiTemperature`, `aiMaxTokens`, `openaiApiKey` (ou null se usa a global)
   - `botActiveStart`, `botActiveEnd`, `timezone`
   - `waAccessToken`, `waApiVersion`, `phoneNumberId`
   - `isActive`
5. Se não encontrar ou `isActive === false`, retornar 404.

**Criar também**: `src/services/bot-config.service.ts` com a query Prisma encapsulada.

---

## PARTE 3 — API: Endpoint de Webhook Unificado

**Criar**: `src/app/api/v1/bot/webhook/route.ts`

Este é o endpoint registrado na Meta para TODOS os números. A Meta envia as mensagens para cá.

```
GET  /api/v1/bot/webhook  → verificação do webhook (hub.verify_token)
POST /api/v1/bot/webhook  → mensagens recebidas
```

**GET (verificação)**:
- A Meta envia `hub.mode`, `hub.verify_token`, `hub.challenge`.
- Precisamos validar o `verify_token`. Como cada tenant pode ter um token diferente,
  aceitar se o token bater com QUALQUER `BotConfig.waVerifyToken` ativo, OU usar um
  token global do `.env` (`WA_GLOBAL_VERIFY_TOKEN`). Recomendo o token global por simplicidade.

**POST (mensagens)**:
1. Extrair `phone_number_id` de `entry[0].changes[0].value.metadata.phone_number_id`.
2. Buscar `BotConfig` pelo `phoneNumberId`.
3. Se não encontrar ou inativo → ignorar (return 200).
4. Extrair mensagens e contatos do payload.
5. Para cada mensagem, encaminhar para o serviço de processamento do bot (ver Parte 5).
6. Sempre retornar 200 imediatamente (Meta reenvia se demorar).

**Importante**: Este endpoint NÃO usa `requireAiBotApiKey()` — é chamado pela Meta sem Bearer token.
A validação é feita pelo `phone_number_id` + existência da config.

---

## PARTE 4 — Página de Configurações do Bot no ERP

### 4a. Navegação

**Arquivo**: `src/components/settings/settings-nav.tsx`

Adicionar nova tab na array `tabs`:
```ts
{
  href: "/configuracoes/bot",
  label: "Atendente IA",
  icon: Bot, // import { Bot } from "lucide-react"
  module: "CONFIGURACOES" as TenantModule,
  adminOnly: true,
},
```

### 4b. Página

**Criar**: `src/app/(dashboard)/configuracoes/bot/page.tsx`

Server Component que:
1. Busca o `BotConfig` do tenant atual (ou retorna defaults se não existir).
2. Renderiza o `<BotSettingsPanel />`.

### 4c. Componente BotSettingsPanel

**Criar**: `src/components/settings/bot-settings-panel.tsx`

Client Component com formulário dividido em seções (usar o mesmo padrão visual dos outros
painéis de configurações como `business-settings-panel.tsx`):

**Seção 1: Personalidade da Atendente**
- `botName` — input texto, label "Nome da atendente"
- `systemPrompt` — textarea grande (min 6 linhas), label "Prompt de personalidade",
  com placeholder explicativo tipo "Descreva como a atendente deve se comportar,
  seu tom de voz, regras especiais..."
- `greetingMessage` — textarea, label "Mensagem de boas-vindas (primeiro contato)"
- `fallbackMessage` — textarea, label "Mensagem quando não souber responder"

**Seção 2: Modelo de IA**
- `aiModel` — select com opções: `gpt-4o-mini`, `gpt-4o`, `gpt-4-turbo`
- `aiTemperature` — slider 0.0 a 1.0 (step 0.1), label "Criatividade"
  (mostrar "Mais precisa" à esquerda e "Mais criativa" à direita)
- `aiMaxTokens` — input number, label "Tamanho máximo da resposta (tokens)"

**Seção 3: Horário de Funcionamento do Bot**
- `botActiveStart` — input time, label "Início do atendimento"
- `botActiveEnd` — input time, label "Fim do atendimento"
- `timezone` — select com os timezones brasileiros principais

**Seção 4: Status do WhatsApp** (somente leitura / informativo)
- Mostrar se o WhatsApp está conectado (`phoneNumberId` existe e `isActive`).
- Se conectado: exibir badge verde "Conectado" + o phoneNumberId mascarado.
- Se não conectado: exibir badge amarelo "Não configurado" + texto explicativo:
  "A conexão do número WhatsApp é feita pela equipe Receps durante a ativação do seu plano."

**NÃO** expor campos de credenciais (waAccessToken, openaiApiKey) na interface por segurança.
Esses campos só serão preenchidos via admin ou API interna.

**Botão**: "Salvar configurações" — chama server action `updateBotConfigAction`.

### 4d. Server Action

**Criar**: `src/actions/bot-config.actions.ts`

- `updateBotConfigAction(formData)`:
  1. Validar sessão + role ADMIN.
  2. Validar dados com zod (botName min 2 chars, systemPrompt min 20 chars, etc.).
  3. Upsert no `BotConfig` (create se não existir, update se existir).
  4. Revalidar path.
  5. Retornar resultado com toast de sucesso/erro.

### 4e. Service

**Criar**: `src/services/bot-config.service.ts` (se não criado na Parte 2)

- `getBotConfigByTenantId(tenantId)` — para a página de settings.
- `getBotConfigByPhoneNumberId(phoneNumberId)` — para o endpoint da API.
- `upsertBotConfig(tenantId, data)` — para a server action.

---

## PARTE 5 — Refatorar o Bot para Multi-Tenant

O bot em `~/Library/Mobile Documents/com~apple~CloudDocs/Documents/BOTs/Ana` precisa ser refatorado.

### Estratégia

O bot deixa de ler `.env` para config de tenant e passa a buscar do ERP via API a cada mensagem
recebida (com cache em memória por 5 minutos para não sobrecarregar).

### 5a. Novo módulo: `src/configProvider.ts`

```ts
// Cache de config por phoneNumberId (TTL 5 min)
interface CachedConfig {
  data: TenantBotConfig;
  expiresAt: number;
}

const configCache = new Map<string, CachedConfig>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export interface TenantBotConfig {
  tenantSlug: string;
  botName: string;
  systemPrompt: string;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
  openaiApiKey: string | null; // null = usar a global
  botActiveStart: string;
  botActiveEnd: string;
  timezone: string;
  waAccessToken: string;
  waApiVersion: string;
  phoneNumberId: string;
}

export async function getTenantConfig(phoneNumberId: string): Promise<TenantBotConfig | null> {
  const cached = configCache.get(phoneNumberId);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  // Buscar do ERP
  const response = await fetch(
    `${ERP_BASE_URL}/api/v1/bot/config?phoneNumberId=${phoneNumberId}`,
    { headers: { Authorization: `Bearer ${ERP_API_TOKEN}` } }
  );

  if (!response.ok) return null;

  const data = await response.json() as TenantBotConfig;
  configCache.set(phoneNumberId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}
```

O `.env` do bot fica reduzido a apenas variáveis globais:
```env
# Conexão com o ERP
ERP_BASE_URL=https://app.receps.com.br
ERP_API_TOKEN=<token-global-de-comunicacao>

# OpenAI fallback (usado quando tenant não tem chave própria)
OPENAI_API_KEY=sk-proj-...

# Servidor
PORT=5001
```

### 5b. Refatorar `webhookServer.ts`

O POST `/webhook` agora:
1. Extrai `phone_number_id` de `entry[0].changes[0].value.metadata.phone_number_id`.
2. Chama `getTenantConfig(phoneNumberId)`.
3. Se null → ignora.
4. Passa a config para `handleIncomingMessage(message, contact, config)`.

**NOTA**: Se o webhook for movido para o ERP (Parte 3), este servidor Express pode ser mantido
como alternativa standalone ou removido. A decisão depende se Victor quer hospedar o bot como
processo separado (recomendado) ou como parte do Next.js. Recomendo manter separado por questões
de performance (o bot precisa responder 200 imediatamente, e o processamento da IA pode demorar).

### 5c. Refatorar `brainService.ts`

`getReply()` agora recebe a config do tenant:

```ts
export async function getReply(
  phone: string,
  userMessage: string,
  userName: string,
  config: TenantBotConfig
): Promise<string>
```

Mudanças:
- `buildSystemPrompt()` → `buildSystemPrompt(config)`:
  - Injeta o CONTEXTO TEMPORAL dinamicamente (data/hora atual no timezone do config).
  - Concatena com `config.systemPrompt` (a personalidade editável).
  - O nome da atendente vem de `config.botName`.
- `openai.chat.completions.create()` usa:
  - `model: config.aiModel`
  - `temperature: config.aiTemperature`
  - `max_tokens: config.aiMaxTokens`
- Se `config.openaiApiKey` existe, criar instância OpenAI com ela; senão, usar a global do `.env`.

### 5d. Refatorar `calendarService.ts`

Todas as funções recebem `config: TenantBotConfig` em vez de ler do `.env`:
- `ERP_BASE_URL` → `config` não precisa (vem do .env global, é o mesmo ERP).
- `ERP_TENANT_SLUG` → `config.tenantSlug`
- `TIMEZONE` → `config.timezone`

O axios instance é criado por request (ou cacheado por tenantSlug) usando o token global.

### 5e. Refatorar `whatsappCloudService.ts`

Todas as funções recebem as credenciais WhatsApp do config:

```ts
export async function sendFreeformMessage(
  to: string,
  text: string,
  waConfig: { phoneNumberId: string; waAccessToken: string; waApiVersion: string }
): Promise<void>
```

A URL da API é construída com `waConfig.phoneNumberId` e o token do `waConfig.waAccessToken`.

### 5f. Refatorar `contextManager.ts`

O histórico de conversas precisa ser isolado por tenant. Mudar a chave do Map de
`phone` para `${tenantSlug}:${phone}` (ou `${phoneNumberId}:${phone}`).

Manter o arquivo JSON por enquanto, mas a estrutura deve suportar múltiplos tenants.
Futuramente migrar para Redis ou banco.

### 5g. Refatorar `messageHandler.ts`

- `handleIncomingMessage()` recebe `config: TenantBotConfig` como terceiro parâmetro.
- O buffer key muda de `from` para `${config.phoneNumberId}:${from}` (isola por tenant).
- `flushBuffer()` passa `config` para `getReply()` e `sendFreeformMessage()`.

### 5h. Horário de Funcionamento

Adicionar check em `handleIncomingMessage()`:
```ts
function isBotActive(config: TenantBotConfig): boolean {
  const now = new Date().toLocaleTimeString('pt-BR', { timeZone: config.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return now >= config.botActiveStart && now < config.botActiveEnd;
}
```

Se fora do horário, responder com mensagem automática:
"Nosso atendimento funciona das {start} às {end}. Envie sua mensagem e responderemos assim que possível!"

---

## PARTE 6 — Fluxo de Vinculação do Número WhatsApp

### Como funciona a vinculação (contexto para o Codex)

A vinculação do número WhatsApp ao tenant acontece pelo **Meta Embedded Signup**, que é um fluxo
OAuth feito no lado da Meta. O processo é:

1. O **admin do Receps** (Victor) acessa o painel admin interno (ou faz manualmente).
2. O cliente (dono da clínica) passa pelo fluxo do Embedded Signup na Meta, que retorna:
   - `waba_id` (WhatsApp Business Account ID)
   - `phone_number_id` (ID do número no Cloud API)
   - Um `access_token` de sistema
3. Esses dados são salvos no `BotConfig` do tenant correspondente.
4. O webhook da Meta é configurado para apontar para a URL unificada do bot
   (`https://bot.receps.com.br/webhook` ou `/api/v1/bot/webhook`).
5. O campo `isActive` é marcado como `true`.

**POR ENQUANTO**, como o Embedded Signup é um fluxo complexo que envolve aprovação da Meta como BSP,
a vinculação será feita **manualmente pelo admin** (Victor) via:

### 6a. Script/Endpoint admin para vincular número

**Criar**: `src/app/api/v1/admin/bot/link/route.ts`

Endpoint protegido (só admin do sistema, não admin do tenant) para vincular um número:

```
POST /api/v1/admin/bot/link
Authorization: Bearer <ADMIN_SECRET_KEY>
{
  "tenantSlug": "clinica-bella",
  "wabaId": "885963267804070",
  "phoneNumberId": "1075428132314639",
  "waAccessToken": "EAARvU8...",
  "waVerifyToken": "token-aleatorio-gerado"
}
```

Lógica:
1. Buscar tenant pelo slug.
2. Upsert no `BotConfig`: preencher os campos WhatsApp e marcar `isActive: true`.
3. Retornar sucesso.

Isso permite que Victor vincule manualmente os números dos clientes novos enquanto
o Embedded Signup não estiver implementado.

---

## PARTE 7 — Seed e Migração de Dados

### 7a. Seed do BotConfig para o tenant de teste

**Arquivo**: `prisma/seed.ts` (ou o arquivo de seed existente)

Adicionar seed do `BotConfig` para o tenant de desenvolvimento/teste:

```ts
await prisma.botConfig.upsert({
  where: { tenantId: tenant.id },
  update: {},
  create: {
    tenantId: tenant.id,
    wabaId: "885963267804070",
    phoneNumberId: "1075428132314639",
    waAccessToken: process.env.WA_ACCESS_TOKEN_SEED || "token-de-teste",
    waVerifyToken: "111104VHps",
    botName: "Ana",
    systemPrompt: `Você se chama Ana. Você é a atendente virtual do estabelecimento...`,
    // ^ Copiar o system prompt completo do brainService.ts (sem a parte temporal)
    greetingMessage: "Olá! Sou a Ana, atendente virtual. Como posso te ajudar hoje?",
    fallbackMessage: "Desculpa, tive um probleminha aqui. Pode tentar de novo?",
    aiModel: "gpt-4o-mini",
    aiTemperature: 0.7,
    aiMaxTokens: 500,
    botActiveStart: "08:00",
    botActiveEnd: "20:00",
    timezone: "America/Sao_Paulo",
    isActive: true,
  },
});
```

---

## Checklist de Execução

Ordem recomendada:

1. [ ] **Prisma**: Adicionar `BotConfig` ao schema + relação no Tenant
2. [ ] **Migration**: `npx prisma migrate dev --name add-bot-config`
3. [ ] **Service**: Criar `src/services/bot-config.service.ts`
4. [ ] **API Config**: Criar `GET /api/v1/bot/config` (bot busca sua config)
5. [ ] **API Webhook**: Criar `GET+POST /api/v1/bot/webhook` (Meta envia mensagens)
6. [ ] **API Admin Link**: Criar `POST /api/v1/admin/bot/link` (vincular número)
7. [ ] **Settings Nav**: Adicionar tab "Atendente IA" na navegação
8. [ ] **Settings Page**: Criar página + componente `BotSettingsPanel`
9. [ ] **Server Action**: Criar `updateBotConfigAction`
10. [ ] **Seed**: Adicionar BotConfig ao seed
11. [ ] **Bot - configProvider**: Criar módulo de cache/fetch de config
12. [ ] **Bot - webhookServer**: Refatorar para extrair phoneNumberId e carregar config
13. [ ] **Bot - brainService**: Refatorar para receber config (prompt, model, etc.)
14. [ ] **Bot - calendarService**: Refatorar para usar tenantSlug do config
15. [ ] **Bot - whatsappCloudService**: Refatorar para usar credenciais do config
16. [ ] **Bot - messageHandler**: Refatorar para isolar buffers por tenant
17. [ ] **Bot - contextManager**: Isolar histórico por tenant
18. [ ] **Bot - horário**: Implementar check de horário de funcionamento
19. [ ] **Testar**: Verificar que o bot carrega config do ERP e responde corretamente

## Notas Importantes

- **NÃO alterar** os endpoints existentes em `src/app/api/v1/agenda/` — eles continuam
  funcionando com Bearer token + tenantSlug como antes. O bot apenas precisa saber o
  tenantSlug correto (que vem do BotConfig).

- **Segurança**: Os campos `waAccessToken` e `openaiApiKey` NÃO devem ser expostos na
  interface do cliente. Só admin do sistema pode alterá-los.

- **Manter compatibilidade**: O bot refatorado deve continuar funcionando com o `.env`
  como fallback durante a transição. Se `getTenantConfig()` retornar null E existirem
  variáveis de ambiente, usar o .env (modo legado).

- **Padrão visual**: Seguir exatamente o mesmo padrão de UI dos outros painéis de
  configurações do ERP (mesmos componentes, espaçamentos, labels, toasts).

- **Arquivo de histórico**: O `historico_conversas.json` do bot deve ser mantido por enquanto,
  mas a chave passa a ser `{phoneNumberId}:{phone}` em vez de apenas `{phone}`.
