# Billing Setup

## 1. Configurar a Stripe

Adicione as variáveis abaixo no `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://app.receps.com.br
NEXT_PUBLIC_LANDING_URL=https://receps.com.br
```

Opcionalmente, para controlar os meios de pagamento do Checkout hosted:

```env
STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES=card
```

No primeiro corte o fluxo principal usa `card`. A estrutura já aceita ampliar os tipos depois, quando a conta e o fluxo escolhido suportarem boleto e Pix com segurança.

## 2. Criar Products e Prices recorrentes

No Dashboard da Stripe:

1. Crie um `Product` para cada plano.
2. Dentro de cada product, crie um `Price` recorrente mensal em `BRL`.
3. Guarde os IDs `prod_...` e `price_...`.

Os planos locais podem existir antes disso. O seed cria placeholders com `stripeProductId` e `stripePriceId` nulos.

## 3. Colar IDs via super-admin

Acesse:

`/painel-receps/planos`

Para cada plano:

1. Preencha `Stripe Product ID`.
2. Preencha `Stripe Price ID`.
3. Salve.

Enquanto esses IDs estiverem nulos, o plano continua existindo localmente, mas não poderá abrir checkout.

## 4. Configurar webhook

Crie um endpoint na Stripe apontando para:

`https://app.receps.com.br/api/webhooks/stripe`

Eventos obrigatórios:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.created`
- `invoice.finalized`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.voided`
- `invoice.marked_uncollectible`

Cole o secret gerado em `STRIPE_WEBHOOK_SECRET`.

O webhook usa:

- `runtime = "nodejs"`
- `dynamic = "force-dynamic"`
- validação com `stripe.webhooks.constructEvent(...)`
- idempotência em `StripeEvent`

Se o mesmo `stripeEventId` chegar de novo e já estiver `processed = true`, o evento é ignorado.

## 5. Testar localmente

Fluxo sugerido:

1. Rode as migrations.
2. Rode o seed.
3. Preencha as chaves Stripe no `.env`.
4. Configure preços reais ou de teste no painel `/painel-receps/planos`.
5. Abra `/assinar`.
6. Finalize o Checkout hosted.
7. Confirme a sincronização em `/onboarding`.
8. Abra `/configuracoes/assinatura` para validar status, trial e invoices.

Comandos úteis:

```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run build
```

## 6. Fluxo do programa de indicação

### Convidado

- Cada tenant pode ter um código próprio em `/configuracoes/indicacoes`.
- Quando um novo cliente entra por esse código, ele ganha `15% OFF` na primeira cobrança real.
- Esse desconto é criado na Stripe como coupon `once` + promotion code.

### Indicador

- O indicador não ganha o reward no momento do cadastro.
- O reward só vira efetivo quando o indicado paga a primeira cobrança real pós-trial.
- Nesse momento é criado um `ReferralReward` com status `PENDING`.

## 7. Regra da fila mensal de rewards

Esta é a regra mais importante da implementação:

- rewards de indicação do indicador **não acumulam na mesma fatura**
- existe **no máximo 1 reward por invoice/ciclo**
- rewards extras ficam **pendentes em fila FIFO** para os meses seguintes

Exemplo:

1. Em abril entram 2 indicados.
2. Os 2 pagam a primeira cobrança real.
3. O tenant indicador ganha 2 rewards `PENDING`.
4. Na próxima invoice elegível, somente o reward mais antigo é reservado e aplicado.
5. O reward seguinte continua `PENDING`.
6. Na invoice elegível do mês seguinte, o próximo reward é aplicado.

Resultado esperado:

- abril: `-40%`
- maio: `-40%`
- nunca abril: `-80%`

Estados locais da fila:

- `PENDING`: aguardando um próximo ciclo elegível
- `RESERVED`: reservado para uma invoice específica
- `APPLIED`: invoice paga com reward consumido
- `EXPIRED` / `REVOKED`: reservados para cenários administrativos futuros

Se uma invoice reservada falhar, for anulada ou marcada como incobrável:

- o reward volta para `PENDING`
- `reservedInvoiceId` e `reservedAt` são limpos
- ele volta para a fila para o próximo ciclo elegível

## Resumo técnico

- Checkout hosted: `/api/billing/checkout`
- Billing Portal hosted: `/api/billing/portal`
- Guard de acesso: `TRIALING` e `ACTIVE` liberam o ERP
- Bloqueio: `PAST_DUE`, `UNPAID`, `CANCELED`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, `PAUSED`
- Eventos Stripe processados localmente com `StripeEvent`
- Rewards do indicador aplicados em fila mensal, sem empilhamento na mesma invoice
