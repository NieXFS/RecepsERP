# Receps ERP

ERP multitenant em pt-BR para clínicas de estética, consultórios odontológicos,
barbearias, salões, centros estéticos e studios de beleza.

## Ambiente local

```bash
npm install
npm run dev
```

## Variáveis principais

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`

## Analytics

O projeto suporta Meta Pixel, Meta Conversions API e GA4.

### Variáveis

- `NEXT_PUBLIC_META_PIXEL_ID`
- `META_CONVERSIONS_API_TOKEN`
- `META_CONVERSIONS_API_DATASET_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `GA4_API_SECRET`
- `NEXT_PUBLIC_ANALYTICS_DEBUG`

### Como obter

#### Meta Pixel / Conversions API

1. No Meta Events Manager, crie ou selecione o dataset/pixel do projeto.
2. Copie o ID para `NEXT_PUBLIC_META_PIXEL_ID`.
3. Gere um token de Conversions API e salve em `META_CONVERSIONS_API_TOKEN`.
4. Copie o ID do dataset em `META_CONVERSIONS_API_DATASET_ID`.

#### Google Analytics 4

1. Crie uma propriedade GA4.
2. Copie o Measurement ID no formato `G-XXXXXXX` para `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
3. Em **Admin > Data Streams > Measurement Protocol API secrets**, gere um secret.
4. Salve esse valor em `GA4_API_SECRET`.

### Debug

Em ambiente local, defina `NEXT_PUBLIC_ANALYTICS_DEBUG=true` para testar eventos
sem depender de `NODE_ENV=production`.

## Stripe local

Para testar webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Seed

```bash
npx prisma generate
npm run db:seed
```
