# Seguranca - Auditoria Tecnica

## Metodologia
Analise estatica de codigo (rotas API, auth, middleware, checkout, webhook, scripts), execucao de `lint` e `build`.

## Achados (ordenados por severidade)

### 1) Critico - Preco confiado ao cliente no checkout
- Evidencia:
  - `src/app/api/checkout/route.ts:54-56` calcula subtotal usando `item.price` do request.
  - `src/app/api/checkout/route.ts:79-87` persiste item/preco vindo do cliente.
  - `src/app/api/checkout/route.ts:117-128` envia para Stripe `unit_amount` com preco do cliente.
  - `src/hooks/useCheckout.ts:54-62` monta payload de checkout diretamente do estado client-side.
- Risco: manipulacao de preco/quantidade no frontend.
- Acao recomendada: no backend, receber apenas `productId` + `quantity`, buscar produto no banco, validar estoque/loja e recalcular total de forma autoritativa.

### 2) Critico - Possivel exposicao de pedido sem sessao autenticada
- Evidencia:
  - `src/app/api/orders/session/[sessionId]/route.ts:29` so filtra `userId` se houver sessao.
- Risco: se um `sessionId` vazar, endpoint pode retornar dados do pedido sem login.
- Acao recomendada: exigir auth obrigatoria ou usar token assinado e expirar URL de consulta de pedido.

### 3) Alta - Endpoint de teste Stripe aberto
- Evidencia:
  - `src/app/api/test-stripe/route.ts:4` sem validacao de auth/role.
  - `:30-52` cria sessao de checkout real de teste.
- Risco: uso indevido do endpoint, ruido operacional e custo.
- Acao recomendada: remover em producao ou restringir para `ADMIN`.

### 4) Alta - Enumeracao de usuario/metodo de login
- Evidencia:
  - `src/app/api/auth/user-info/route.ts:4-54` retorna `hasPassword`, `oauthProviders` por email sem auth.
- Risco: recon de contas e engenharia social.
- Acao recomendada: remover endpoint publico, ou exigir sessao/autorizacao forte e resposta generica.

### 5) Alta - Token de verificacao fraco
- Evidencia:
  - `src/lib/email.ts:67-71` usa `Math.random` para token.
- Risco: previsibilidade maior que `crypto.randomBytes`.
- Acao recomendada: gerar token criptograficamente seguro e salvar hash (nao plaintext).

### 6) Alta - Configuracao TLS insegura em envio de email
- Evidencia:
  - `src/lib/email.ts:11-13` e `src/app/api/auth/forgot-password/route.ts:62-64` com `rejectUnauthorized: false`.
- Risco: downgrade/MITM em conexao SMTP.
- Acao recomendada: remover essa opcao e usar provedor SMTP com TLS valido.

### 7) Alta - Remove.bg com key no cliente + risco de SSRF
- Evidencia:
  - `src/app/api/remove-bg/route.ts:7` recebe `apiKey` no body.
  - `src/app/api/remove-bg/route.ts:24` baixa `imageUrl` sem allowlist.
  - `src/components/RemoveBgProcessor.tsx:26` e `:45` salva API key no localStorage.
- Risco: exposicao de chave de terceiros e acesso a URLs internas.
- Acao recomendada: usar somente chave server-side por env + allowlist de hosts + validacao de URL.

### 8) Alta - Inconsistencia de identificador Stripe no pedido
- Evidencia:
  - `src/app/api/checkout/route.ts:182` salva `stripeSession.id` em `stripePaymentId`.
  - `src/app/api/webhooks/stripe/route.ts:115` sobrescreve com `payment_intent`.
  - `src/app/api/orders/session/[sessionId]/route.ts:28` busca por `sessionId` em `stripePaymentId`.
- Risco: falha de reconciliacao e pedido nao encontrado em sucesso/falha.
- Acao recomendada: separar campos `stripeCheckoutSessionId` e `stripePaymentIntentId`.

### 9) Media - Politica de senha inconsistente
- Evidencia:
  - Registro forte: `src/app/api/auth/register/route.ts:15-39`.
  - Reset fraco: `src/app/api/auth/reset-password/route.ts:23-27` (>=6).
- Risco: downgrade de forca da senha por reset.
- Acao recomendada: extrair validador unico e aplicar em register + reset.

### 10) Media - Regra de ownership de pedido por email
- Evidencia:
  - `src/app/api/orders/[orderId]/route.ts:21-23` filtra por `customerEmail`.
  - `src/app/api/checkout/route.ts:69` `customerEmail` vem de `customerInfo` do request.
- Risco: inconsistencia de ownership e cenarios de spoof/erro de vinculacao.
- Acao recomendada: filtrar por `userId` da sessao para pedidos autenticados.

### 11) Media - Exposicao de email do dono da loja
- Evidencia:
  - `src/app/api/stores/[slug]/route.ts:35-40` retorna `owner.email`.
- Risco: vazamento de dado pessoal sem necessidade para cliente final.
- Acao recomendada: remover email do owner da resposta publica.

### 12) Media - Logging excessivo com dados sensiveis
- Evidencia:
  - Checkout loga `customerEmail` (`src/app/api/checkout/route.ts:97-104`).
  - Sessao de pedido loga dados de usuario/pedido (`src/app/api/orders/session/[sessionId]/route.ts:14-16`, `76-83`).
  - Stripe config loga prefixo de chave (`src/lib/stripe-config.ts:24-26`).
- Risco: exposicao de PII em logs.
- Acao recomendada: sanitizar logs e usar logger estruturado com redaction.

## Controles positivos ja existentes
- Middleware para auth/role em rotas de UI (`src/middleware.ts`).
- Callback URL normalizada contra open redirect (`src/lib/callback-url.ts`).
- Assinatura de webhook Stripe validada (`src/app/api/webhooks/stripe/route.ts:55`).
- Password hash com bcrypt (`register` e `reset-password`).

## Prioridade de remediacao
- **Sprint imediata**: Itens 1, 2, 3, 8.
- **Sprint seguinte**: Itens 4, 5, 6, 7, 9.
- **Sprint de consolidacao**: Itens 10, 11, 12 + suite de testes de seguranca.
