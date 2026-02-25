# Hardening Backlog

## P0 - Bloqueadores de producao
1. Reescrever `/api/checkout` para usar preco e dados de produto do banco.
2. Tornar `/api/orders/session/[sessionId]` estritamente autenticado.
3. Remover/restringir `/api/test-stripe` em producao.
4. Separar `stripeCheckoutSessionId` de `stripePaymentIntentId` em `Order`.

## P1 - Alta prioridade
1. Trocar token de verificacao/reset para `crypto.randomBytes` + hash no banco.
2. Remover `rejectUnauthorized:false` do fluxo de email.
3. Proteger ou eliminar `/api/auth/user-info` publico.
4. Remover envio de `apiKey` no body em `/api/remove-bg` e aplicar allowlist de URL.

## P2 - Consolidacao
1. Unificar politica de senha entre cadastro e reset.
2. Trocar ownership de pedidos para `userId`.
3. Reduzir dados sensiveis em logs.
4. Remover exposicao de `owner.email` em `/api/stores/[slug]`.

## P3 - Maturidade
1. Adicionar rate limit em endpoints criticos de auth.
2. Adicionar trilha de auditoria para alteracoes de pedido/pagamento.
3. Adicionar testes de seguranca automatizados no CI.
