# Sprint 03 - Experiencia de Conta e Pedido

## Objetivo

Evoluir a experiencia do usuario logado e reduzir friccao operacional em conta, pedido e operacao admin.

## Etapa 1 - Discovery

- Revisar lacunas no perfil (enderecos sem CRUD completo).
- Revisar consistencia entre rotas novas e legadas.
- Revisar gargalos de acompanhamento de pedido em ambiente de demonstracao (dependencia de webhook externo para concluir pagamento).

## Etapa 2 - Design

- Definir API de enderecos completa (`GET/POST/PUT/DELETE`).
- Definir estrategia para convergencia de rotas (`/products` vs `/${slug}/product`).
- Definir automacao DEMO de status de pedido para reduzir dependencia operacional de webhook em portfolio.

## Etapa 3 - Implementacao

- CRUD de endereco no perfil.
- Correcao de rotas inconsistentes (`/cart` -> `/carrinho`).
- Correcao do fluxo admin remove-bg com endpoint dedicado e protegido.
- Automacao DEMO de pedido:
  - pagamento pendente para aprovado apos janela configuravel;
  - simulacao de progresso logistico (`PAID -> PROCESSING -> SHIPPED -> DELIVERED`);
  - criacao de historico de status e codigo de rastreio demo.

## Etapa 4 - Testes e homologacao (S03-QA-003)

### Checklist manual de homologacao (S03-QA-003)

| Cenario                                                               | Resultado esperado                                                                                               | Evidencia tecnica                                                                                                                                        | Resultado |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| CRUD de enderecos no perfil (`/perfil`)                               | Usuario autenticado cria, edita, remove e define endereco padrao sem inconsistencia                              | `docs/ROADMAP/Logs/S03-QA-001.md` + suite `src/app/api/addresses/__tests__/route.integration.test.ts`                                                    | ✅        |
| Navegacao canonica de carrinho (`/cart` -> `/carrinho`)               | Redirecionamento estavel com preservacao de querystring                                                          | `docs/ROADMAP/Logs/S03-QA-002.md` + suite `src/app/cart/__tests__/page.integration.test.ts`                                                              | ✅        |
| Fluxo admin remove-bg (`POST/PUT /api/admin/remove-bg`)               | Endpoint bloqueia nao-admin e responde com contrato previsivel (`401/403/404`)                                   | `docs/ROADMAP/Logs/S03-QA-002.md` + suite `src/app/api/admin/remove-bg/__tests__/route.integration.test.ts`                                              | ✅        |
| Acompanhamento DEMO de pedido em pagamento pendente                   | Pedido em `PENDING/PAYMENT_PENDING` evolui para `PAID` apos ~2 min quando automacao demo esta habilitada         | Codigo em `src/lib/order-demo-automation.ts` + integracao em `GET /api/orders/user`, `GET /api/orders/[orderId]` e `GET /api/orders/session/[sessionId]` | ✅        |
| Simulacao de entrega (processamento, envio, entregue + tracking code) | Pedido evolui automaticamente para `PROCESSING`, `SHIPPED` e `DELIVERED` com historico e rastreio visiveis no UI | `src/lib/order-demo-automation.ts`, `src/components/orders/orders-page-content.tsx`, validacoes finais de build/lint/integration                         | ✅        |

### Plano de rollback (S03-QA-003)

- **RTO alvo:** ate 20 minutos apos decisao de rollback.
- **Gatilhos:**
  - regressao no CRUD de enderecos (quebra de ownership/default);
  - regressao em redirects canonicos de pedido/carrinho;
  - falha de autorizacao no endpoint admin remove-bg;
  - automacao DEMO provocando transicoes incorretas de pedido/pagamento.
- **Passos de rollback:**
  1. Desativar automacao DEMO imediatamente (`DEMO_ORDER_AUTOMATION_ENABLED=false`) e fazer novo deploy.
  2. Reverter deploy para commit estavel anterior da Sprint 03 se houver impacto alem da automacao.
  3. Executar smoke de API/UI (`/perfil`, `/orders`, `/cart`, `/api/admin/remove-bg`) para validar retorno ao baseline.
  4. Reexecutar suites criticas de integracao da sprint (`addresses`, `orders redirects`, `admin/remove-bg`).
  5. Registrar incidente, causa e decisao de rollback no log da sprint.
- **Criterio de saida de rollback:**
  - fluxo de checkout/pedido volta ao comportamento anterior sem automacao;
  - ownership de endereco e pedido permanece consistente;
  - endpoint admin remove-bg volta a responder com contrato esperado.

### Responsaveis e validacao

| Papel              | Escopo validado                                                            | Evidencia                                                                                        | Status |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| Engenharia backend | Gatilhos, sequencia de rollback, configuracao de feature flag de automacao | Secao "Plano de rollback (S03-QA-003)" neste documento + `docs/ROADMAP/Logs/S03-QA-003.md`       | ✅     |
| QA                 | Checklist manual de homologacao e smoke pos-rollback                       | Secao "Checklist manual de homologacao (S03-QA-003)" + execucao de suites de integracao          | ✅     |
| Produto            | Janela operacional de go/no-go e comunicacao de decisao                    | `docs/ROADMAP/Logs/S03-QA-003.md` (secao de comunicacao e encerramento operacional da Sprint 03) | ✅     |

## Criterios de aceite

- Usuario gerencia enderecos sem erro.
- Navegacao de carrinho funciona em todos os menus.
- Area admin remove-bg opera com endpoint correto e controle de acesso.
- Checklist operacional da sprint executado com evidencias e plano de rollback validado.
