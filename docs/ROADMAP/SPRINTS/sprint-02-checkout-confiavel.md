# Sprint 02 - Checkout Confiavel e Integridade de Pedido

## Objetivo
Melhorar robustez do fluxo de pedido, pagamento e reconciliacao.

## Etapa 1 - Discovery
- Levantar cenarios de falha: pagamento expirado, webhook duplicado, timeout de rede.

## Etapa 2 - Design
- Tornar webhook idempotente.
- Definir maquina de estados de pedido/pagamento.
- Definir estrategia de retry segura para eventos Stripe.

## Etapa 3 - Implementacao
- Idempotencia por `event.id` do Stripe.
- Tabela/event-log para processamento de webhook.
- Ajuste de ownership por `userId` em `/api/orders/[orderId]`.

## Etapa 4 - Testes
- Testes de integracao com cenarios de eventos repetidos.
- Testes E2E de sucesso/falha com redirecionamento.
- Janela recomendada de homologacao: dias uteis, 10:00-12:00 (America/Sao_Paulo), com monitoramento por 60 minutos apos deploy.
- Responsaveis de go/no-go: engenharia backend, QA e produto.

### Checklist manual de homologacao (S02-QA-003)

| Cenario | Resultado esperado | Evidencia automatizada | Evidencia staging | Status |
| --- | --- | --- | --- | --- |
| Reentrega webhook (`event.id` duplicado) | Sem pagamento/historico duplicado e resposta estavel | `docs/ROADMAP/Logs/S02-QA-001.md`, `docs/ROADMAP/Logs/S02-QA-002.md` | `docs/ROADMAP/Logs/S02-QA-003.md` (secao "Checklist e evidencias", 2026-03-02) | ✅ |
| Checkout com pagamento aprovado | Pedido finaliza em `PAID` com historico coerente e redirecionamento de sucesso | `npm run test:integration` (suite `checkout` + `webhooks/stripe`) | `docs/ROADMAP/Logs/S02-QA-003.md` (secao "Checklist e evidencias", 2026-03-02) | ✅ |
| Checkout com falha/expiracao | Pedido muda para `CANCELLED`/`FAILED` sem regressao de estado | `npm run test:integration` (suite `webhooks/stripe`) | `docs/ROADMAP/Logs/S02-QA-003.md` (secao "Checklist e evidencias", 2026-03-02) | ✅ |
| Ownership de pedido (`/api/orders/[orderId]` e `/api/orders/session/[sessionId]`) | Usuario nao-owner recebe `404` e owner recebe dados consistentes | `docs/ROADMAP/Logs/S02-ORD-001.md`, `docs/ROADMAP/Logs/S02-QA-002.md` | `docs/ROADMAP/Logs/S02-QA-003.md` (secao "Checklist e evidencias", 2026-03-02) | ✅ |

### Plano de rollback (S02-QA-003)

- **Gatilhos:** aumento de `FAILED` em `stripeWebhookEvent`, divergencia entre `order.status` e `OrderStatusHistory`, ou regressao de ownership em endpoints de pedido.
- **Passos de rollback:**
  1. Pausar janela de deploy e bloquear novas alteracoes de release.
  2. Reverter para a release estavel anterior.
  3. Executar `npm run test:integration`, `npm run lint` e `npm run build` na release revertida.
  4. Rodar smoke manual dos fluxos de webhook (duplicado/sucesso/falha) e ownership.
  5. Registrar incidente e a decisao de rollback no log da sprint.
- **Responsaveis:** engenharia backend (execucao tecnica), QA (revalidacao), produto (comunicacao e decisao de janela).
- **Validacao:** plano revisado no checkpoint de go/no-go da Sprint 02 (2026-03-02) com engenharia backend, QA e produto; registro consolidado em `docs/ROADMAP/Logs/S02-QA-003.md`.
- **RTO alvo:** ate 15 minutos para restaurar operacao estavel.

## Criterios de aceite
- Webhook duplicado nao gera pagamento duplicado.
- Historico de status de pedido consistente.
- Endpoints de pedido retornam apenas dados do usuario correto.
- Checklist manual de homologacao e plano de rollback formalizados para go-live.
