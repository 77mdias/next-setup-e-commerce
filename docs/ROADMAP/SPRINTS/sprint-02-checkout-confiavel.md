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

## Criterios de aceite
- Webhook duplicado nao gera pagamento duplicado.
- Historico de status de pedido consistente.
- Endpoints de pedido retornam apenas dados do usuario correto.
