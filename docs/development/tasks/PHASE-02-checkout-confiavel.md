# 🚀 Tasks - Fase 02: Checkout Confiável e Integridade de Pedido

**Status:** 🟢 ATIVA
**Última atualização:** 2026-03-01
**Sprint Atual:** Sprint 02
**Status Geral:** 🟡 50% (6/12 tarefas completas) - FASE ATIVA
**ETA:** 1 sprint (5-7 dias úteis)
**Pré-requisito:** Fase 01 - Fundação de Segurança (✅ concluída em 2026-02-28)

---

## 📊 Resumo de Progresso

| Categoria                              | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| -------------------------------------- | ------ | --------- | ------------ | -------- | --------- |
| Webhook idempotente e resiliente       | 3      | 3         | 0            | 0        | 0         |
| Máquina de estados e histórico         | 3      | 3         | 0            | 0        | 0         |
| Ownership de pedidos por `userId`      | 3      | 0         | 0            | 3        | 0         |
| Testes, rollout e governança           | 3      | 0         | 0            | 3        | 0         |
| **TOTAL**                              | **12** | **6**     | **0**        | **6**    | **0**     |

### 🎯 Principais Indicadores

- ✅ Escopo da Sprint 02 estruturado em 4 frentes técnicas.
- ✅ Dependências críticas da Sprint 01 já concluídas.
- ⚠️ Risco principal: endpoint `/api/orders/[orderId]` ainda com ownership por `customerEmail` (hardening em aberto na trilha ORD).

---

## 🎯 Objetivos da Fase

- Garantir idempotência real no processamento de webhook Stripe para eliminar pagamentos duplicados.
- Padronizar transições de status de pedido/pagamento com regras explícitas de máquina de estados.
- Persistir histórico de mudança de status com rastreabilidade mínima para auditoria.
- Endurecer ownership de leitura de pedido por `userId`, removendo confiança em `customerEmail`.
- Cobrir cenários de retry/duplicidade de webhook com testes de integração executáveis.
- Reduzir regressão de redirecionamento no fluxo sucesso/falha com validações E2E de pedido.
- Formalizar checklist operacional e plano de rollback para go-live seguro da Sprint 02.

---

## 📦 Estrutura de Categorias

### 📦 Webhook idempotente e resiliente - Processamento Stripe sem duplicidade

#### Objetivo

Tornar o webhook Stripe seguro para reentregas e falhas transitórias de rede. Esta categoria cobre deduplicação por `event.id`, execução atômica e proteção contra criação de pagamentos duplicados.

#### WHK.1 - Registro e deduplicação de eventos Stripe

- [x] **S02-WHK-001** - Introduzir persistência de eventos Stripe processados

  **Descrição curta:**
  - Registrar cada `event.id` recebido do Stripe para controle de idempotência.
  - Impedir reprocessamento de eventos já concluídos.

  **Implementação sugerida:**
  - Adicionar modelo de evento de webhook no schema Prisma com índice único em `eventId`.
  - Criar migration versionada para estrutura de deduplicação.
  - Persistir evento no início do fluxo e marcar estado de processamento/conclusão.

  **Arquivos/áreas afetadas:** `prisma/schema.prisma`, `prisma/migrations/*`, `src/app/api/webhooks/stripe/route.ts`

  **Critérios de aceitação:**
  - [x] Mesmo `event.id` recebido novamente não executa mutações de negócio pela segunda vez.
  - [x] Registro de evento processado fica rastreável no banco para auditoria técnica.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 4h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-WHK-002** - Tornar atualização de pedido/pagamento transacional no webhook

  **Descrição curta:**
  - Evitar estado parcial quando houver falha entre update de pedido e criação de pagamento.
  - Garantir comportamento consistente em retry.

  **Implementação sugerida:**
  - Envolver mutações de `order`, `payment` e controle de evento em transação única.
  - Tratar conflito por evento duplicado com resposta segura (`200` sem efeito colateral).
  - Normalizar retornos para cenários de erro transitório sem vazamento de dados internos.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/prisma.ts`

  **Critérios de aceitação:**
  - [x] Falha intermediária não deixa `order` atualizado sem registro coerente de pagamento.
  - [x] Reentrega após falha processa no máximo uma vez o efeito de negócio.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S02-WHK-001  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-WHK-003** - Cobrir eventos de falha/expiração com retry seguro

  **Descrição curta:**
  - Consolidar tratamento de `checkout.session.async_payment_failed`, `checkout.session.expired` e `charge.failed`.
  - Evitar múltiplos cancelamentos/reversões para o mesmo pedido.

  **Implementação sugerida:**
  - Aplicar mesma estratégia de deduplicação para eventos de falha.
  - Atualizar status somente quando transição for válida para o estado atual.
  - Garantir logs operacionais mínimos com contexto de evento e pedido.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [x] Eventos de falha duplicados não geram múltiplas mudanças de estado.
  - [x] Pedido não volta para estado anterior por reprocessamento indevido.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S02-WHK-001, S02-WHK-002  
  **Status:** ✅ Concluída (2026-03-01)

### 📦 Máquina de estados e histórico - Consistência de pedido e pagamento

#### Objetivo

Estabelecer regras explícitas de transição para `OrderStatus` e `PaymentStatus`, com persistência de histórico confiável. O foco é impedir saltos inválidos e melhorar rastreabilidade do ciclo de vida do pedido.

#### STM.1 - Definição e aplicação de transições válidas

- [x] **S02-STM-001** - Definir matriz de transição para `OrderStatus` e `PaymentStatus`

  **Descrição curta:**
  - Formalizar transições permitidas entre estados de pedido e pagamento.
  - Evitar mutações diretas sem validação de estado atual.

  **Implementação sugerida:**
  - Criar utilitário central para validar transições (`from` -> `to`).
  - Aplicar utilitário no webhook e nos pontos que alteram status em checkout/pós-checkout.
  - Rejeitar transições inválidas com resposta controlada.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/checkout/route.ts`, `src/lib/order-session.ts`, `src/lib/order-state-machine.ts` (novo)

  **Critérios de aceitação:**
  - [x] Transições inválidas são bloqueadas e não persistem no banco.
  - [x] Fluxos de sucesso/falha seguem sequência consistente de estados.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** S02-WHK-001  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-STM-002** - Persistir `OrderStatusHistory` nas mudanças de status

  **Descrição curta:**
  - Registrar toda mudança relevante de status para auditoria e depuração.
  - Associar origem da mudança (webhook, checkout, sistema).

  **Implementação sugerida:**
  - Inserir histórico junto com update de status em transação.
  - Definir `notes` mínimas por tipo de evento processado.
  - Garantir que rollback em falha preserve integridade entre pedido e histórico.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/route.ts`, `src/app/api/checkout/route.ts`, `prisma/schema.prisma` (se ajuste adicional for necessário)

  **Critérios de aceitação:**
  - [x] Toda mudança de status relevante gera registro em `OrderStatusHistory`.
  - [x] Histórico não contém entradas órfãs ou inconsistentes com o estado atual.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 5h  
  **Dependências:** S02-STM-001  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-STM-003** - Expor histórico e estado consistente nas APIs de pedido

  **Descrição curta:**
  - Tornar o histórico visível para diagnóstico e UI sem quebrar segurança.
  - Garantir leitura coerente do estado final e das transições.

  **Implementação sugerida:**
  - Incluir `statusHistory` na resposta de detalhes do pedido quando aplicável.
  - Normalizar ordenação temporal e shape de resposta para consumo frontend.
  - Cobrir fallback para pedidos legados sem histórico completo.

  **Arquivos/áreas afetadas:** `src/app/api/orders/[orderId]/route.ts`, `src/app/api/orders/session/[sessionId]/route.ts`, `src/app/api/orders/user/route.ts`, `src/lib/order-status-history.ts`, `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts`, `src/app/api/orders/session/[sessionId]/__tests__/route.integration.test.ts`, `src/app/api/orders/user/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [x] APIs retornam estado atual + histórico ordenado sem inconsistências.
  - [x] Estrutura de resposta permanece estável para consumidores atuais.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S02-STM-001, S02-STM-002  
  **Status:** ✅ Concluída (2026-03-01)

### 📦 Ownership de pedidos por `userId` - Proteção de dados pós-checkout

#### Objetivo

Remover dependência de `customerEmail` como critério de autorização em pedidos e consolidar ownership por `userId`. Esta categoria cobre API, dados legados e consumidores frontend afetados.

#### ORD.1 - Leitura segura de pedido com identidade canônica

- [x] **S02-ORD-001** - Ajustar `/api/orders/[orderId]` para ownership por `userId`

  **Descrição curta:**
  - Substituir filtro por `customerEmail` por validação com `userId` autenticado.
  - Evitar acesso indevido quando e-mails coincidirem ou forem alterados.

  **Implementação sugerida:**
  - Exigir sessão autenticada com `session.user.id`.
  - Consultar pedido por `{ id, userId }` com retorno 404 para não-owner.
  - Sanear parsing de `orderId` inválido para resposta 400 previsível.

  **Arquivos/áreas afetadas:** `src/app/api/orders/[orderId]/route.ts`, `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts` (novo)

  **Critérios de aceitação:**
  - [x] Usuário autenticado acessa apenas pedidos do próprio `userId`.
  - [x] Não-owner recebe 404 sem exposição de metadados sensíveis.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 4h  
  **Dependências:** S01-ORD-003  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-ORD-002** - Definir estratégia para pedidos legados sem `userId`

  **Descrição curta:**
  - Tratar pedidos antigos que ainda possam estar sem vínculo `userId`.
  - Evitar quebra de acesso do dono legítimo durante transição.

  **Implementação sugerida:**
  - Criar backfill controlado (`customerEmail` -> `userId`) para registros compatíveis.
  - Registrar casos ambíguos para tratamento manual.
  - Definir política de fallback temporária e prazo de remoção.

  **Arquivos/áreas afetadas:** `scripts/*` (novo, se necessário), `docs/ROADMAP/Logs/*`, `src/app/api/orders/[orderId]/route.ts`

  **Critérios de aceitação:**
  - [x] Pedidos legados elegíveis ficam vinculados ao `userId` correto.
  - [x] Casos sem correspondência não expõem dados e são rastreados para ação manual.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S02-ORD-001  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-ORD-003** - Ajustar consumidores frontend para novo contrato de ownership

  **Descrição curta:**
  - Garantir UX consistente quando pedido não pertence ao usuário atual.
  - Preservar fluxo de redirecionamento pós-checkout sem vazamento de informação.

  **Implementação sugerida:**
  - Revisar uso de `/api/orders/:orderId` em hooks e páginas de pedido.
  - Tratar 400/401/404 com mensagens neutras e ação de recuperação.
  - Atualizar testes de integração da página de pedidos para os novos cenários.

  **Arquivos/áreas afetadas:** `src/hooks/useCheckout.ts`, `src/components/orders/orders-page-content.tsx`, `src/app/orders/__tests__/page.integration.test.ts`

  **Critérios de aceitação:**
  - [x] Fluxo sucesso/falha mantém redirecionamento sem quebrar quando pedido não é acessível.
  - [x] Frontend não exibe dados de pedido para sessão sem ownership válido.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S02-ORD-001  
  **Status:** ✅ Concluída (2026-03-01)

### 📦 Testes, rollout e governança - Garantia de liberação da Sprint 02

#### Objetivo

Consolidar cobertura automatizada e validação operacional para liberar a Sprint 02 com segurança. A categoria fecha lacunas de integração para idempotência e ownership e formaliza plano de rollback.

#### QA.1 - Cobertura crítica e homologação controlada

- [x] **S02-QA-001** - Expandir integração de webhook para reentrega e duplicidade

  **Descrição curta:**
  - Cobrir cenário de evento Stripe repetido com mesmo `event.id`.
  - Garantir inexistência de efeitos colaterais duplicados.

  **Implementação sugerida:**
  - Adicionar testes de integração para webhook duplicado (`checkout.session.completed` e falhas).
  - Validar que `payment.create` não executa duas vezes para o mesmo evento.
  - Validar resposta HTTP estável para reentregas idempotentes.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [x] Evento duplicado não cria pagamento duplicado.
  - [x] Suite falha quando idempotência é quebrada.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 4h  
  **Dependências:** S02-WHK-002, S02-WHK-003  
  **Status:** ✅ Concluída (2026-03-01)

- [x] **S02-QA-002** - Cobrir máquina de estados e histórico em integração

  **Descrição curta:**
  - Validar coerência entre estado final e histórico persistido.
  - Impedir regressão em transições inválidas.

  **Implementação sugerida:**
  - Criar cenários de integração para transições válidas e inválidas.
  - Validar persistência de `OrderStatusHistory` por evento processado.
  - Garantir que estado final do pedido seja consistente com histórico retornado.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`, `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts` (novo), `src/app/api/orders/session/[sessionId]/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [x] Transição inválida é bloqueada e testada.
  - [x] Histórico retornado reflete mudanças aplicadas no backend.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S02-STM-002, S02-STM-003  
  **Status:** ✅ Concluída (2026-03-02)

- [ ] **S02-QA-003** - Checklist manual de homologação e plano de rollback da Sprint 02

  **Descrição curta:**
  - Formalizar validações manuais de staging antes de produção.
  - Definir rollback rápido para regressão em webhook/order ownership.

  **Implementação sugerida:**
  - Criar checklist de cenários (duplicidade webhook, sucesso/falha checkout, ownership de pedido).
  - Definir passos operacionais de rollback e responsáveis por janela de deploy.
  - Registrar evidências no log técnico da sprint.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-02-checkout-confiavel.md`, `docs/development/tasks/PHASE-02-checkout-confiavel.md`, `docs/ROADMAP/Logs/S02-QA-003.md` (novo)

  **Critérios de aceitação:**
  - [ ] Checklist executado com evidências de resultado.
  - [ ] Plano de rollback validado com time responsável.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S02-QA-001, S02-QA-002  
  **Status:** 🔴 Pendente

---

## 🧪 Testes e Validações

- **Suites necessárias:** Integração de API (`checkout`, `webhooks/stripe`, `orders/[orderId]`, `orders/session`), regressão de página de pedidos, homologação manual E2E.
- **Cobertura alvo:** 100% dos cenários P0/P1 da Sprint 02 cobertos (automatizado + manual).
- **Comandos de verificação:** `npm run test:integration`, `npm run lint`, `npm run build`.
- **Estado atual:** ⚠️ Cobertura parcial herdada da Sprint 01; cenários de deduplicação por `event.id` e ownership canônico por `userId` ainda pendentes.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/development/TASKS.md` com status da Fase 02 quando arquivo índice existir.
- Atualizar `docs/development/CHANGELOG.md` com entregas de idempotência e integridade de pedido (quando criado).
- Documentar mudanças de dados e migrações em `docs/01-analise-aplicacao/02-dados-e-banco.md`.
- Registrar evidências de execução por task em `docs/ROADMAP/Logs/S02-*.md`.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas da Fase 02 marcadas como concluídas.
- [ ] Migrations Prisma de webhook/ownership aplicadas e versionadas.
- [ ] Validações `npm run test:integration`, `npm run lint` e `npm run build` executadas com sucesso.
- [ ] Fluxos de webhook duplicado + sucesso/falha + ownership de pedido validados em homologação.
- [ ] Evidências e logs técnicos da Sprint 02 registrados em `docs/ROADMAP/Logs`.
- [ ] Aprovação final da Sprint 02 registrada pelo time responsável.
