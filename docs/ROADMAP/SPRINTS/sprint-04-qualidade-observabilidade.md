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

| Modulo critico                        | Superficie principal                                                                                                             | Severidade | Probabilidade | Risco | Dono tecnico sugerido                    | Risco principal observado                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------- | ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| Checkout (UI + API)                   | `src/app/checkout/page.tsx`, `src/hooks/useCheckout.ts`, `src/app/api/checkout/route.ts`                                        | Alta       | Media         | P0    | Engenharia Backend Checkout              | Divergencia entre pedido persistido e sessao Stripe em falhas de integracao/transacao.    |
| Webhook Stripe                        | `src/app/api/webhooks/stripe/route.ts`, `src/lib/order-state-machine.ts`                                                        | Alta       | Media         | P0    | Engenharia Backend Pagamentos            | Reentrega/concorrencia de eventos pode causar mutacao indevida sem idempotencia rigorosa. |
| Pedidos (ownership e leitura)         | `src/app/api/orders/session/[sessionId]/route.ts`, `src/app/api/orders/[orderId]/route.ts`, `src/app/api/orders/user/route.ts` | Alta       | Media         | P0    | Engenharia Backend Orders                | Exposicao indevida de pedido se ownership/session normalization regredir.                  |
| Carrinho (persistencia e migracao)    | `src/context/cart.tsx`, `src/app/api/cart/route.ts`, `src/app/api/cart/migrate/route.ts`                                        | Media      | Alta          | P1    | Engenharia Frontend Commerce + Backend   | Perda/inconsistencia de itens em migracao localStorage -> banco sem cobertura automatizada. |
| Autenticacao e middleware de acesso   | `src/lib/auth.ts`, `src/middleware.ts`, `src/app/api/auth/[...nextauth]/route.ts`                                               | Alta       | Baixa         | P1    | Engenharia Plataforma/Auth               | Bypass de rotas protegidas ou callback inseguro em mudancas de regras de redirect.         |
| Observabilidade operacional de compra | `console.*` em `checkout`, `webhook` e `orders`                                                                                  | Media      | Media         | P2    | Engenharia Plataforma/Observabilidade    | Telemetria heterogenea e com risco de ruído/PII, dificultando diagnostico em incidente.   |

#### Lista priorizada de cenarios P0/P1 para testes e CI gate

| Prioridade | Cenario                                                                                          | Modulos alvo               | Evidencia atual                                                                                                                 | Acao recomendada na Sprint 04                          |
| ---------- | ------------------------------------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| P0         | `POST /api/checkout` rejeita payload adulterado e recalcula totais server-authoritative         | Checkout                   | `src/app/api/checkout/__tests__/route.integration.test.ts`                                                                     | Reutilizar como smoke gate obrigatorio                 |
| P0         | Checkout executa rollback de pedido ao falhar criacao/persistencia de sessao Stripe             | Checkout + Stripe          | `src/app/api/checkout/__tests__/route.integration.test.ts`                                                                     | Promover para suite critica de regressao               |
| P0         | `POST /api/webhooks/stripe` deduplica `event.id` em redelivery e trata concorrencia de consumo  | Webhook                    | `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`                                                              | Tornar bloqueante no CI para regressao de idempotencia |
| P0         | Webhook bloqueia transicao invalida de estado sem mutacao indevida                              | Webhook + State machine    | `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts` + `src/lib/order-state-machine.ts`                          | Cobrir tambem com camada unit de matriz de transicao   |
| P0         | Owner autenticado acessa pedido e nao-owner recebe `404` em leitura por `orderId` e `sessionId` | Orders + Auth              | `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts`, `src/app/api/orders/session/[sessionId]/__tests__/route.integration.test.ts` | Incluir no gate minimo de APIs criticas                |
| P0         | Retorno de `orders/success` e `orders/failure` preserva fluxo seguro por `session_id`           | Orders + Auth              | `src/app/orders/__tests__/page.integration.test.ts`                                                                             | Executar em smoke de release                           |
| P1         | CRUD/migracao de carrinho preserva itens e ownership em cenarios de erro                         | Cart                       | Sem suite de integracao para `src/app/api/cart/route.ts` e `src/app/api/cart/migrate/route.ts`                               | Criar cobertura em `S04-TST-*`                         |
| P1         | Middleware protege `checkout/carrinho/pedido` e redirect de auth preserva callback               | Auth + Middleware          | Sem suite automatizada dedicada para `src/middleware.ts`                                                                        | Planejar testes de contrato de middleware              |
| P1         | Fallback legado de vinculo por email em pedido nao reabre exposicao indevida                    | Orders (legado/transicao)  | Coberto parcialmente em `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts`                                    | Monitorar ate remocao do fallback                       |

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
