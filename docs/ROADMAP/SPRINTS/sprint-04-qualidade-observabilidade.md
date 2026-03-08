# Sprint 04 - Qualidade, Testes e Observabilidade

## Objetivo

Criar base de confiabilidade continua para releases.

## Etapa 1 - Discovery

- Definir modulos criticos para cobertura inicial.
- Definir metricas minimas de saude (erro, latencia, falha de pagamento).

### Baseline de risco do fluxo de compra (S04-QLT-001)

#### Fluxo ponta a ponta mapeado

1. Carrinho no cliente (`src/context/cart.tsx`) e persistencia em API (`src/app/api/cart/route.ts`, `src/app/api/cart/migrate/route.ts`).
2. Checkout UI (`src/app/checkout/page.tsx`, `src/hooks/useCheckout.ts`) inicia `POST /api/checkout`.
3. Checkout backend (`src/app/api/checkout/route.ts`) valida payload/estoque, cria pedido inicial e abre sessao Stripe.
4. Webhook Stripe (`src/app/api/webhooks/stripe/route.ts`) deduplica evento, aplica transicao de estado e confirma/cancela pedido.
5. Leitura de pedido por owner (`src/app/api/orders/session/[sessionId]/route.ts`, `src/app/api/orders/[orderId]/route.ts`, `src/app/api/orders/user/route.ts`) fecha o ciclo de confirmacao para UX.
6. Autenticacao e guards de rota (`src/lib/auth.ts`, `src/middleware.ts`) controlam acesso a checkout/pedido e redirecionamentos.

#### Matriz de risco por modulo critico

| Modulo critico                        | Superficie principal                                                                                                           | Severidade | Probabilidade | Risco | Dono tecnico sugerido                  | Risco principal observado                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------- | ----- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Checkout (UI + API)                   | `src/app/checkout/page.tsx`, `src/hooks/useCheckout.ts`, `src/app/api/checkout/route.ts`                                       | Alta       | Media         | P0    | Engenharia Backend Checkout            | Divergencia entre pedido persistido e sessao Stripe em falhas de integracao/transacao.      |
| Webhook Stripe                        | `src/app/api/webhooks/stripe/route.ts`, `src/lib/order-state-machine.ts`                                                       | Alta       | Media         | P0    | Engenharia Backend Pagamentos          | Reentrega/concorrencia de eventos pode causar mutacao indevida sem idempotencia rigorosa.   |
| Pedidos (ownership e leitura)         | `src/app/api/orders/session/[sessionId]/route.ts`, `src/app/api/orders/[orderId]/route.ts`, `src/app/api/orders/user/route.ts` | Alta       | Media         | P0    | Engenharia Backend Orders              | Exposicao indevida de pedido se ownership/session normalization regredir.                   |
| Carrinho (persistencia e migracao)    | `src/context/cart.tsx`, `src/app/api/cart/route.ts`, `src/app/api/cart/migrate/route.ts`                                       | Media      | Alta          | P1    | Engenharia Frontend Commerce + Backend | Perda/inconsistencia de itens em migracao localStorage -> banco sem cobertura automatizada. |
| Autenticacao e middleware de acesso   | `src/lib/auth.ts`, `src/middleware.ts`, `src/app/api/auth/[...nextauth]/route.ts`                                              | Alta       | Baixa         | P1    | Engenharia Plataforma/Auth             | Bypass de rotas protegidas ou callback inseguro em mudancas de regras de redirect.          |
| Observabilidade operacional de compra | `console.*` em `checkout`, `webhook` e `orders`                                                                                | Media      | Media         | P2    | Engenharia Plataforma/Observabilidade  | Telemetria heterogenea e com risco de ruído/PII, dificultando diagnostico em incidente.     |

#### Lista priorizada de cenarios P0/P1 para testes e CI gate

| Prioridade | Cenario                                                                                         | Modulos alvo              | Evidencia atual                                                                                                                                  | Acao recomendada na Sprint 04                          |
| ---------- | ----------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| P0         | `POST /api/checkout` rejeita payload adulterado e recalcula totais server-authoritative         | Checkout                  | `src/app/api/checkout/__tests__/route.integration.test.ts`                                                                                       | Reutilizar como smoke gate obrigatorio                 |
| P0         | Checkout executa rollback de pedido ao falhar criacao/persistencia de sessao Stripe             | Checkout + Stripe         | `src/app/api/checkout/__tests__/route.integration.test.ts`                                                                                       | Promover para suite critica de regressao               |
| P0         | `POST /api/webhooks/stripe` deduplica `event.id` em redelivery e trata concorrencia de consumo  | Webhook                   | `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`                                                                                | Tornar bloqueante no CI para regressao de idempotencia |
| P0         | Webhook bloqueia transicao invalida de estado sem mutacao indevida                              | Webhook + State machine   | `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts` + `src/lib/order-state-machine.ts`                                             | Cobrir tambem com camada unit de matriz de transicao   |
| P0         | Owner autenticado acessa pedido e nao-owner recebe `404` em leitura por `orderId` e `sessionId` | Orders + Auth             | `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts`, `src/app/api/orders/session/[sessionId]/__tests__/route.integration.test.ts` | Incluir no gate minimo de APIs criticas                |
| P0         | Retorno de `orders/success` e `orders/failure` preserva fluxo seguro por `session_id`           | Orders + Auth             | `src/app/orders/__tests__/page.integration.test.ts`                                                                                              | Executar em smoke de release                           |
| P1         | CRUD/migracao de carrinho preserva itens e ownership em cenarios de erro                        | Cart                      | Sem suite de integracao para `src/app/api/cart/route.ts` e `src/app/api/cart/migrate/route.ts`                                                   | Criar cobertura em `S04-TST-*`                         |
| P1         | Middleware protege `checkout/carrinho/pedido` e redirect de auth preserva callback              | Auth + Middleware         | Sem suite automatizada dedicada para `src/middleware.ts`                                                                                         | Planejar testes de contrato de middleware              |
| P1         | Fallback legado de vinculo por email em pedido nao reabre exposicao indevida                    | Orders (legado/transicao) | Coberto parcialmente em `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts`                                                       | Monitorar ate remocao do fallback                      |

### Baseline de metricas minimas e thresholds de alerta (S04-QLT-002)

#### SLI/SLO iniciais por API critica

| Metrica                             | Escopo                                                                                     | SLI (definicao)                                                                   | SLO inicial | Janela de observacao                    | Threshold de alerta                                              | Fonte de coleta                                                                                                      | Responsavel operacional                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ----------- | --------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `api.checkout.5xx_rate`             | `POST /api/checkout`                                                                       | `% 5xx = respostas HTTP 5xx / total de requests`                                  | <= `0.5%`   | rolling `15m` e consolidado `24h`       | warn `>1.0%` (15m), crit `>2.0%` (15m)                           | metricas HTTP por rota + logs runtime de API                                                                         | Engenharia Backend Checkout (on-call commerce)      |
| `api.checkout.p95_latency_ms`       | `POST /api/checkout`                                                                       | `p95` da latencia de resposta em ms                                               | <= `1200ms` | rolling `5m` e consolidado `1h`         | warn `>1800ms` (3 janelas), crit `>2500ms` (2 janelas)           | metricas HTTP por rota + logs runtime de API                                                                         | Engenharia Backend Checkout (on-call commerce)      |
| `api.webhook_stripe.5xx_rate`       | `POST /api/webhooks/stripe`                                                                | `% 5xx = respostas HTTP 5xx / total de requests`                                  | <= `0.5%`   | rolling `15m` e consolidado `24h`       | warn `>1.0%` (15m), crit `>2.0%` (15m)                           | metricas HTTP por rota + logs runtime de API                                                                         | Engenharia Backend Pagamentos (on-call pagamentos)  |
| `api.webhook_stripe.p95_latency_ms` | `POST /api/webhooks/stripe`                                                                | `p95` da latencia de resposta em ms                                               | <= `1500ms` | rolling `5m` e consolidado `1h`         | warn `>2500ms` (3 janelas), crit `>3500ms` (2 janelas)           | metricas HTTP por rota + logs runtime de API                                                                         | Engenharia Backend Pagamentos (on-call pagamentos)  |
| `webhook.failed_processing_rate`    | `stripe_webhook_events`                                                                    | `% failed = status FAILED / (COMPLETED + FAILED)`                                 | <= `1.0%`   | rolling `15m` e consolidado `24h`       | warn `>2.0%` (15m), crit `>4.0%` (15m)                           | tabela `stripe_webhook_events.status` (`PROCESSING/COMPLETED/FAILED`)                                                | Engenharia Backend Pagamentos (on-call pagamentos)  |
| `api.orders.5xx_rate`               | `GET /api/orders/user`, `GET /api/orders/[orderId]`, `GET /api/orders/session/[sessionId]` | `% 5xx = respostas HTTP 5xx / total de requests`                                  | <= `0.5%`   | rolling `15m` e consolidado `24h`       | warn `>1.0%` (15m), crit `>2.0%` (15m)                           | metricas HTTP por rota + logs runtime de API                                                                         | Engenharia Backend Orders (on-call orders)          |
| `api.orders.p95_latency_ms`         | `GET /api/orders/*`                                                                        | `p95` da latencia de resposta em ms                                               | <= `900ms`  | rolling `5m` e consolidado `1h`         | warn `>1400ms` (3 janelas), crit `>2000ms` (2 janelas)           | metricas HTTP por rota + logs runtime de API                                                                         | Engenharia Backend Orders (on-call orders)          |
| `payment.failed_rate`               | Fluxo de pagamento apos tentativa de cobranca                                              | `% failed = pedidos com paymentStatus FAILED / pedidos com tentativa de cobranca` | <= `3.0%`   | rolling `15m`, consolidado `1h` e `24h` | warn `>5.0%` (15m, volume >=20), crit `>8.0%` (15m, volume >=20) | tabela `orders.paymentStatus`, `orders.cancelledAt`, eventos `charge.failed`/`checkout.session.async_payment_failed` | Engenharia Backend Pagamentos + Produto de Checkout |

#### Regras objetivas de alerta (operacao diaria e go/no-go)

- `ALR-PAY-001` (falha de pagamento): acionar alerta quando `payment.failed_rate` ultrapassar `5.0%` em `15m` com volume minimo de `20` tentativas; escalar para severidade critica acima de `8.0%` na mesma janela.
- `ALR-LAT-001` (degradacao de latencia): acionar alerta quando `p95` ultrapassar o threshold de warning por `3` janelas consecutivas de `5m`; escalar para critico quando ultrapassar threshold critico por `2` janelas.
- `ALR-ERR-001` (erro de API critica): acionar alerta quando `5xx_rate` exceder `1.0%` em `15m`; bloquear go/no-go de release quando qualquer rota critica exceder `2.0%`.

#### Criterio minimo de go/no-go para release

- `Go`: ultimas `24h` com `5xx_rate <= 0.5%` em `checkout`, `webhooks/stripe` e `orders`; `payment.failed_rate <= 3.0%`; sem alerta critico ativo por `>=30m`.
- `No-Go`: qualquer alerta critico ativo (`ALR-PAY-001`, `ALR-LAT-001`, `ALR-ERR-001`) ou violacao de SLO em duas janelas consecutivas de decisao de release.

## Etapa 2 - Design

- Estruturar suite de testes (unit + integration + e2e).
- Definir logger estruturado com redacao de PII.

## Etapa 3 - Implementacao

- Adicionar framework de testes e primeiros cenarios.
- Adicionar logs estruturados e alertas basicos.
- Revisar warnings de hooks e imagens para reduzir ruido.

## Etapa 4 - Rollout

- Gate de CI com lint + build + testes criticos.
- Monitoramento pos-deploy com checklist de validacao.

## Criterios de aceite

- Fluxo critico de compra coberto por testes automatizados.
- Logs sem dados sensiveis expostos.
- Pipeline bloqueia merge quando teste critico falha.
