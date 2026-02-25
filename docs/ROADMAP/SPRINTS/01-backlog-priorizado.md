# Backlog Priorizado

## P0 (imediato)
1. Checkout server-authoritative (preco e total no backend).
2. Auth obrigatoria para consulta de pedido por sessao.
3. Remocao/restricao de endpoint de teste Stripe.
4. Persistencia correta de IDs Stripe (session vs payment intent).

## P1 (alta)
1. Tokens de verificacao/reset seguros (crypto + hash).
2. Hardening do remove-bg (server key + allowlist).
3. Remocao de enumeracao em `/api/auth/user-info`.
4. Unificacao de politica de senha.

## P2 (media)
1. CRUD completo de endereco no perfil.
2. Ownership de pedidos por `userId`.
3. Correcao de navegacao `/cart` -> `/carrinho`.
4. Correcao do fluxo admin remove-bg com endpoint dedicado.

## P3 (maturidade)
1. Suite de testes automatizados (unit/integration/e2e).
2. Observabilidade estruturada (logs, metricas, traces).
3. Rate limiting e protecao anti abuso em auth.
