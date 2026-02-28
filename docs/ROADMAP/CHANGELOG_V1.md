# Changelog v1

## [1.0.0] - 2026-02-27

### Added

- Suite de testes de integracao para APIs criticas:
  - `POST /api/checkout`
  - `GET /api/orders/session/[sessionId]`
  - `POST /api/webhooks/stripe`
  - `GET /api/test-stripe`
- Cobertura de cenarios P0 de seguranca e integridade:
  - payload adulterado rejeitado no checkout;
  - ownership de pedido por sessao;
  - rollback transacional em falhas de checkout;
  - separacao de identificadores Stripe (`checkoutSessionId` e `paymentIntentId`).
- Utilitario compartilhado para lookup de order-session (`src/lib/order-session.ts`).

### Changed

- Fluxo de sucesso/falha do checkout (`/orders/success` e `/orders/failure`) com validacao de sessao e ownership antes de redirecionar.
- Redirecionamento de usuario nao autenticado com preservacao de `session_id` no callback de login.
- Feedback seguro em casos nao acessiveis via rota de status (sem exposicao de erro tecnico bruto).
- Configuracao do Vitest de integracao ampliada para `src/app/**/__tests__/*.integration.test.ts`.

### Security

- Endurecimento de autorizacao no acesso a pedidos por sessao.
- Mitigacao de enumeracao de pedidos com resposta segura para casos nao autorizados/nao encontrados.
- Sanitizacao de logs em producao para fluxos sensiveis de order-session.

### Reliability

- Reforco de consistencia transacional no checkout com rollback de pedido/sessao Stripe em falhas.
- Validacao canonicamente server-side de preco, estoque e itens antes de criar sessao de pagamento.

### Verification

- `npm run test:integration`
- `npm run lint`
- `npm run build`

---

## Notas

- Este changelog consolida as entregas de fundacao e seguranca da Sprint 01 (checkout, orders/session e hardening Stripe).
- Logs tecnicos detalhados por task estao em `docs/ROADMAP/Logs/`.
