# Checklist E2E — Signup, Trial e Primeira Cobrança

Este checklist valida o funil crítico do Receps em Stripe Test Mode antes de abrir tráfego pago.

## Pré-requisitos gerais

- [ ] `.env` configurado com chaves Stripe de teste.
- [ ] Aplicação rodando localmente em `http://localhost:3000`.
- [ ] Stripe CLI autenticado.
- [ ] Webhook local ativo com:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

- [ ] Prisma Studio disponível para conferir `Tenant.lifecycleStatus` e `Subscription.status`.
- [ ] Caixa de entrada de teste acessível para validar emails transacionais.

## O que conferir em todos os cenários

- [ ] URL final esperada ao fim do fluxo.
- [ ] `Tenant.lifecycleStatus` no Prisma Studio.
- [ ] `Subscription.status`, `trialEnd` e `defaultPaymentMethod` no Prisma Studio.
- [ ] Assinatura, invoices e eventos no Stripe Dashboard.
- [ ] Emails recebidos na ordem correta.

---

## Cenário 1 — Happy path completo

### Pré-condição

- [ ] Email novo e CNPJ ainda não usados.
- [ ] Plano escolhido definido antes do teste (`somente-erp`, `somente-atendente-ia` ou `erp-atendente-ia`).

### Passos

- [ ] Acessar `/cadastro?plan=...`.
- [ ] Preencher signup completo.
- [ ] Confirmar redirect para `/bem-vindo`.
- [ ] Concluir wizard inicial.
- [ ] Acessar dashboard e verificar banner de trial.
- [ ] No D5 do trial, clicar em “Adicionar forma de pagamento”.
- [ ] No Billing Portal, cadastrar cartão `4242 4242 4242 4242`.
- [ ] Aguardar virada do trial para cobrança real.

### Asserts

- [ ] URL após signup: `/bem-vindo`.
- [ ] URL após setup: tela do dashboard esperada.
- [ ] `Tenant.lifecycleStatus = INCOMPLETE` durante trial e acesso liberado.
- [ ] `Subscription.status = TRIALING` após signup.
- [ ] `defaultPaymentMethod` preenchido após adicionar cartão.
- [ ] No D8, `Subscription.status = ACTIVE`.
- [ ] Invoice paga criada no Stripe.
- [ ] Email de boas-vindas recebido no signup.
- [ ] Email de cobrança/invoice recebido após ativação.

### Reset

- [ ] Apagar tenant, user, subscription, invoices e logs relacionados antes de rodar de novo.

---

## Cenário 2 — Trial expira sem cartão

### Pré-condição

- [ ] Conta nova sem forma de pagamento adicionada.

### Passos

- [ ] Fazer signup e concluir wizard.
- [ ] Não adicionar cartão durante os 7 dias de trial.
- [ ] Aguardar evento de fim de trial.

### Asserts

- [ ] Durante o trial, dashboard acessível.
- [ ] `customer.subscription.deleted` recebido ao fim do trial sem cartão.
- [ ] `Subscription.status = CANCELED` no Prisma/Stripe.
- [ ] Usuário redirecionado para `/assinatura/bloqueada`.
- [ ] Tela bloqueada oferece CTA para Billing Portal.

### Reativação

- [ ] Abrir Billing Portal.
- [ ] Adicionar cartão válido.
- [ ] Reativar assinatura conforme fluxo disponível.
- [ ] Confirmar retorno para acesso ativo.

### Reset

- [ ] Limpar tenant de teste e dados Stripe vinculados.

---

## Cenário 3 — Cartão rejeitado

### Pré-condição

- [ ] Conta em trial ativa.

### Passos

- [ ] Abrir Billing Portal.
- [ ] Tentar adicionar cartão `4000 0000 0000 9995`.
- [ ] Confirmar falha.
- [ ] Repetir com cartão `4242 4242 4242 4242`.

### Asserts

- [ ] Evento `invoice.payment_failed` ou falha de cobrança registrado.
- [ ] Email de falha de pagamento recebido apenas uma vez dentro da janela de debounce.
- [ ] Após novo cartão válido, assinatura volta a fluxo normal.

### Reset

- [ ] Limpar método de pagamento e assinatura de teste antes de nova execução.

---

## Cenário 4 — Cartão exige 3DS

### Pré-condição

- [ ] Conta em trial ativa.

### Passos

- [ ] Abrir Billing Portal.
- [ ] Adicionar cartão `4000 0027 6000 3184`.
- [ ] Completar autenticação 3DS no fluxo do Stripe.

### Asserts

- [ ] Método de pagamento salvo após autenticação.
- [ ] Sem bloqueio indevido do dashboard.
- [ ] Assinatura ativa ao fim do trial.

### Reset

- [ ] Remover cartão de teste e apagar tenant se necessário.

---

## Cenário 5 — Cancelamento dentro do trial

### Pré-condição

- [ ] Conta em trial com acesso ao Billing Portal.

### Passos

- [ ] Abrir Billing Portal.
- [ ] Cancelar assinatura antes do fim do trial.

### Asserts

- [ ] Stripe reflete cancelamento da assinatura.
- [ ] Prisma reflete status compatível com cancelamento.
- [ ] Tenant perde acesso quando o cancelamento efetivar.
- [ ] Email de confirmação de cancelamento, se existir no fluxo, é recebido.

### Reset

- [ ] Remover tenant e assinatura cancelada de teste.

---

## Cenário 6 — Mudança de plano dentro do trial

### Pré-condição

- [ ] Conta criada em um plano base, por exemplo `somente-erp`.

### Passos

- [ ] No D3 do trial, abrir Billing Portal.
- [ ] Trocar para o plano `erp-atendente-ia`.
- [ ] Confirmar mudança no Stripe.

### Asserts

- [ ] Stripe mostra o novo plano vinculado à subscription.
- [ ] Prisma reflete `planId` e/ou sincronização do novo plano.
- [ ] Próxima cobrança usa o valor do plano novo.
- [ ] Dashboard continua acessível durante a troca.

### Reset

- [ ] Excluir tenant de teste ou retornar a assinatura ao plano original antes de novo teste.

---

## Conferência rápida de status

### URL final esperada por etapa

- Signup concluído: `/bem-vindo`
- Setup concluído: dashboard ou rota inicial liberada
- Trial vencido sem cartão: `/assinatura/bloqueada`

### Status esperados

- Durante trial: `Subscription.status = TRIALING`
- Após cartão + primeira cobrança confirmada: `Subscription.status = ACTIVE`
- Trial encerrado sem cartão: `Subscription.status = CANCELED`

### Eventos Stripe críticos

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.trial_will_end`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

### Emails esperados

- Bem-vindo
- Trial terminando em 2 dias
- Falha no pagamento

