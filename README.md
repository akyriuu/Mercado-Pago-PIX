# PIX-api

A minimal, reusable PIX payment API built with NestJS and TypeScript, integrated with Mercado Pago's Checkout API. The goal is simple: a clean HTTP layer for PIX that does one thing well and can be plugged into any project that needs payment processing — without carrying the weight of a full e-commerce application.

It handles charge creation, payment status queries, and webhook validation with HMAC signature verification. No database, no auth layer, no dashboard. Just PIX.

---

## Features

- Create PIX charges via Mercado Pago
- Returns `id`, `status`, `amount`, `description`, `qrCode` (copy & paste), `qrCodeBase64`, `ticketUrl`
- Query payment status by ID
- Receive and validate Mercado Pago webhooks (HMAC signature via `x-signature` / `x-request-id`)
- Webhook responds `{ received: true }` immediately and processes the payment lookup in background to avoid MP timeouts

---

## Requirements

- Node.js 18+
- Mercado Pago account with a PIX key registered on the seller account
- Mercado Pago Access Token (starts with `TEST-` for sandbox)
- Webhook secret (generated in the MP panel)

---

## Setup

```bash
git clone https://github.com/your-user/pix-api.git
cd pix-api
npm install
cp .env.example .env
# fill in your credentials in .env
npm run start:dev
```

---

## Environment Variables

| Variable                      | Description                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `PORT`                        | Server port (default: `3000`)                                               |
| `MERCADO_PAGO_ACCESS_TOKEN`   | MP Access Token — **not** the Public Key. Sandbox tokens start with `TEST-` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secret configured in the MP Webhooks panel                                  |

> Never commit `.env`. Use `.env.example` with empty values as reference.

---

## Endpoints

### `POST /pix/charges` — Create a PIX charge

**Body:**

```json
{
  "amount": 29.9,
  "description": "Product description",
  "payerEmail": "buyer@email.com",
  "payerDocument": "12345678909"
}
```

**curl:**

```bash
curl -X POST http://localhost:3000/pix/charges \
  -H "Content-Type: application/json" \
  -d '{"amount":29.90,"description":"Test","payerEmail":"test@test.com","payerDocument":"12345678909"}'
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/pix/charges -Method POST `
  -ContentType "application/json" `
  -Body '{"amount":29.90,"description":"Test","payerEmail":"test@test.com","payerDocument":"12345678909"}'
```

**Response:**

```json
{
  "id": 123456789,
  "status": "pending",
  "amount": 29.9,
  "description": "Test",
  "qrCode": "00020126...",
  "qrCodeBase64": "iVBORw0KGgo...",
  "ticketUrl": "https://www.mercadopago.com.br/..."
}
```

---

### `GET /pix/charges/:id` — Query payment status

**curl:**

```bash
curl http://localhost:3000/pix/charges/123456789
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/pix/charges/123456789
```

---

### `POST /pix/webhooks` — Mercado Pago webhook

Receives payment notifications from Mercado Pago (topic: `payment`). Validates HMAC signature using `x-signature` and `x-request-id` headers against `MERCADO_PAGO_WEBHOOK_SECRET`.

- Returns `{ received: true }` immediately
- Payment lookup runs in background to avoid timeout
- Returns `401` if signature headers are missing or invalid — expected behavior

---

## Webhooks Setup

1. In the Mercado Pago panel, go to **Your integrations → Webhooks**
2. Set the notification URL to your tunnel URL: `https://YOUR-TUNNEL/pix/webhooks`
3. Select topic: **Payments**
4. Copy the generated secret and set it as `MERCADO_PAGO_WEBHOOK_SECRET` in `.env`

**Local tunnel (pick one):**

```bash
ngrok http 3000
# or
cloudflared tunnel --url http://localhost:3000
```

> The MP panel simulator may send non-existent payment IDs — `Payment not found` is expected in that case. Test with a real ID from `POST /pix/charges`.

---

## Project Structure

```
src/
├── pix/
│   ├── pix.module.ts
│   ├── pix.controller.ts
│   ├── pix.service.ts
│   └── dto/
│       └── create-charge.dto.ts
├── app.module.ts
└── main.ts
```

---

## Sandbox Notes

- In sandbox, payments stay in `pending` status — that's expected
- QR code and ticket URL are returned normally and can be tested
- Full PIX end-to-end approval with test users may be limited by MP sandbox
- `POST /pix/webhooks` without valid signature headers returns `401` — correct behavior
- Access Token is **not** the Public Key — use the one from **Credentials → Access Token**

---

## Security

- Never commit `.env` or expose your Access Token
- `MERCADO_PAGO_WEBHOOK_SECRET` is used to validate that webhook requests actually come from Mercado Pago
- Webhook signature validation uses HMAC — do not skip it in production

---

## License

MIT

---

---

# pix-api

Uma API HTTP mínima e reutilizável para cobranças PIX, construída com NestJS e TypeScript e integrada ao Checkout API do Mercado Pago. O objetivo é simples: uma camada de PIX limpa que faz uma coisa bem feita e pode ser plugada em qualquer projeto que precise processar pagamentos — sem carregar o peso de um e-commerce completo.

Cria cobranças, consulta status de pagamentos e valida webhooks com verificação de assinatura HMAC. Sem banco de dados, sem autenticação de API key, sem dashboard. Só PIX.

---

## Funcionalidades

- Cria cobranças PIX via Mercado Pago
- Retorna `id`, `status`, `amount`, `description`, `qrCode` (copia e cola), `qrCodeBase64`, `ticketUrl`
- Consulta status de um pagamento pelo ID
- Recebe e valida webhooks do Mercado Pago (assinatura HMAC via `x-signature` / `x-request-id`)
- Webhook responde `{ received: true }` imediatamente e processa a consulta em background para não dar timeout no MP

---

## Requisitos

- Node.js 18+
- Conta no Mercado Pago com chave PIX cadastrada na conta vendedora
- Access Token do Mercado Pago (começa com `TEST-` no sandbox)
- Secret do webhook (gerado no painel do MP)

---

## Setup

```bash
git clone https://github.com/seu-usuario/pix-api.git
cd pix-api
npm install
cp .env.example .env
# preencha suas credenciais no .env
npm run start:dev
```

---

## Variáveis de Ambiente

| Variável                      | Descrição                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `PORT`                        | Porta do servidor (padrão: `3000`)                                                 |
| `MERCADO_PAGO_ACCESS_TOKEN`   | Access Token do MP — **não** é a Public Key. Tokens de sandbox começam com `TEST-` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Secret configurado no painel de Webhooks do MP                                     |

> Nunca commite o `.env`. Use `.env.example` com valores em branco como referência.

---

## Endpoints

### `POST /pix/charges` — Criar cobrança PIX

**Body:**

```json
{
  "amount": 29.9,
  "description": "Descrição do produto",
  "payerEmail": "comprador@email.com",
  "payerDocument": "12345678909"
}
```

**curl:**

```bash
curl -X POST http://localhost:3000/pix/charges \
  -H "Content-Type: application/json" \
  -d '{"amount":29.90,"description":"Teste","payerEmail":"teste@teste.com","payerDocument":"12345678909"}'
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/pix/charges -Method POST `
  -ContentType "application/json" `
  -Body '{"amount":29.90,"description":"Teste","payerEmail":"teste@teste.com","payerDocument":"12345678909"}'
```

**Resposta:**

```json
{
  "id": 123456789,
  "status": "pending",
  "amount": 29.9,
  "description": "Teste",
  "qrCode": "00020126...",
  "qrCodeBase64": "iVBORw0KGgo...",
  "ticketUrl": "https://www.mercadopago.com.br/..."
}
```

---

### `GET /pix/charges/:id` — Consultar status do pagamento

**curl:**

```bash
curl http://localhost:3000/pix/charges/123456789
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri http://localhost:3000/pix/charges/123456789
```

---

### `POST /pix/webhooks` — Webhook do Mercado Pago

Recebe notificações de pagamento do Mercado Pago (tópico: `payment`). Valida assinatura HMAC usando os headers `x-signature` e `x-request-id` contra o `MERCADO_PAGO_WEBHOOK_SECRET`.

- Responde `{ received: true }` imediatamente
- Consulta do pagamento roda em background para não dar timeout
- Retorna `401` se os headers de assinatura estiverem ausentes ou inválidos — comportamento esperado

---

## Configuração de Webhooks

1. No painel do Mercado Pago, acesse **Suas integrações → Webhooks**
2. Configure a URL de notificação com seu túnel: `https://SEU-TUNEL/pix/webhooks`
3. Selecione o tópico: **Pagamentos**
4. Copie o secret gerado e defina como `MERCADO_PAGO_WEBHOOK_SECRET` no `.env`

**Túnel local (escolha um):**

```bash
ngrok http 3000
# ou
cloudflared tunnel --url http://localhost:3000
```

> O simulador do painel do MP pode enviar IDs de pagamento inexistentes — `Payment not found` é esperado nesse caso. Teste com um ID real de um `POST /pix/charges`.

---

## Estrutura do Projeto

```
src/
├── pix/
│   ├── pix.module.ts
│   ├── pix.controller.ts
│   ├── pix.service.ts
│   └── dto/
│       └── create-charge.dto.ts
├── app.module.ts
└── main.ts
```

---

## Notas de Sandbox

- No sandbox, pagamentos ficam em `pending` — comportamento esperado
- QR code e ticket URL são retornados normalmente e podem ser testados
- Aprovação PIX de ponta a ponta com usuários de teste pode ser limitada pelo sandbox do MP
- `POST /pix/webhooks` sem headers de assinatura válidos retorna `401` — comportamento correto
- O Access Token **não** é a Public Key — use o da seção **Credenciais → Access Token**

---

## Segurança

- Nunca commite o `.env` nem exponha seu Access Token
- `MERCADO_PAGO_WEBHOOK_SECRET` é usado para validar que as requisições do webhook realmente vêm do Mercado Pago
- A validação de assinatura usa HMAC — não pule essa etapa em produção

---

## Licença

MIT
