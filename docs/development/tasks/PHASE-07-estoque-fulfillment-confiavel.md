# 🚀 Tasks - Fase 07: Estoque e Fulfillment Confiável

**Status:** 🟢 ATIVA
**Última atualização:** 2026-03-19
**Sprint Atual:** Sprint 07
**Status Geral:** 🟡 17% (2/12 tarefas concluídas) - FASE ATIVA
**ETA:** 2 semanas após kickoff da Sprint 07
**Pré-requisito:** Fase 06 - Painel Admin e Operação (✅ concluída em 2026-03-18)

---

> **📌 NOTA:** Planejamento inicial derivado de `docs/ROADMAP/SPRINTS/sprint-07-estoque-fulfillment-confiavel.md`, do backlog priorizado e da base entregue até a Fase 06. A sprint deve preservar simplicidade operacional de demo/portfolio: priorizar transações Prisma, invariantes explícitos e rotinas locais/auditáveis, sem introduzir Redis, filas ou locks distribuídos sem requisito real.

---

## 📊 Resumo de Progresso

| Categoria                              | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| -------------------------------------- | ------ | --------- | ------------ | -------- | --------- |
| Reserva transacional e anti-oversell   | 3      | 2         | 0            | 1        | 0         |
| Confirmação de pagamento e compensação | 3      | 0         | 0            | 3        | 0         |
| Operação de estoque e reconciliação    | 3      | 0         | 0            | 3        | 0         |
| Testes, homologação e governança       | 3      | 0         | 0            | 3        | 0         |
| **TOTAL**                              | **12** | **2**     | **0**        | **10**   | **0**     |

### 🎯 Principais Indicadores

- ✅ Escopo da Sprint 07 estruturado em 4 frentes com 12 tarefas rastreáveis.
- ✅ Dependências críticas já existem no código: checkout, webhook Stripe, painel admin, ajuste de estoque e trilha de auditoria.
- ⚠️ Risco principal da fase: concorrência entre checkout, webhook e ajuste manual sobre o mesmo inventário.
- ⚠️ Reservas sem expiração/reconciliação podem prender estoque e distorcer disponibilidade operacional.

---

## 🎯 Objetivos da Fase

- Eliminar risco de oversell no checkout com reserva de estoque transacional por item.
- Garantir que estoque reservado, disponível e baixado definitivo sigam o estado real do pagamento.
- Converter reservas em baixa definitiva apenas após confirmação válida de pagamento.
- Liberar reservas de forma idempotente em cancelamento, expiração e falha de pagamento.
- Proteger ajustes manuais e mutações administrativas contra violações de invariantes de inventário.
- Expor visão operacional de estoque total, reservado e disponível no painel admin.
- Criar rotina de reconciliação para detectar e corrigir divergências entre pedido, pagamento e inventário.
- Fechar a sprint com testes de concorrência, homologação manual e plano de rollback validado.

---

## 📦 Estrutura de Categorias

### 📦 Reserva transacional e anti-oversell - Garantia de disponibilidade real no checkout

#### Objetivo

Estabelecer a base de reserva de estoque da Sprint 07 para impedir venda acima do saldo real. A implementação deve reutilizar o stack atual com transações Prisma, invariantes simples e rastreabilidade por pedido/item.

#### RES.1 - Reserva de estoque no início do checkout

- [x] **S07-RES-001** - Modelar persistência de reserva de estoque com TTL e vínculo por pedido/item

  **Descrição curta:**
  - O projeto já possui `Inventory.quantity` e `Inventory.reserved`, mas ainda não existe uma entidade canônica para rastrear ciclo de vida da reserva.
  - A Sprint 07 precisa de uma estrutura explícita para expiração, auditoria e reconciliação por item reservado.

  **Implementação sugerida:**
  - Adicionar modelo versionado para reserva de estoque (`StockReservation` ou equivalente) com `status`, `expiresAt`, `orderId`, `productId`, `variantId`, `storeId` e quantidade.
  - Criar índices para busca por `status`, expiração e vínculos de pedido/item.
  - Centralizar invariantes e operações de reserva em um módulo compartilhado (`src/lib/stock-reservation.ts`).

  **Arquivos/áreas afetadas:** `prisma/schema.prisma`, `prisma/migrations/*`, `src/lib/stock-reservation.ts` (novo), `src/lib/prisma.ts`

  **Critérios de aceitação:**
  - [x] Estrutura de reserva versionada em migration e validada com Prisma.
  - [x] Cada reserva fica rastreável por pedido, item, expiração e status operacional.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** nenhuma  
  **Status:** 🟢 Concluída (2026-03-19)
  **Notas adicionais (opcional):**
  - Preservar o invariante `quantity >= reserved >= 0`.
  - Se novos estados forem introduzidos, manter nomenclatura explícita para facilitar reconciliação e auditoria.

- [x] **S07-RES-002** - Introduzir reserva atômica de estoque no início do checkout

  **Descrição curta:**
  - Hoje o checkout valida saldo, mas a Sprint 07 precisa impedir que dois compradores reservem o último item ao mesmo tempo.
  - A reserva deve acontecer antes da criação definitiva da sessão Stripe, sem deixar estado parcial silencioso.

  **Implementação sugerida:**
  - Reaproveitar a normalização de itens em `/api/checkout` para consolidar reserva por `productId`/`variantId`.
  - Buscar inventário e aplicar mutação atômica dentro de transação única, considerando disponibilidade como `quantity - reserved`.
  - Retornar conflito previsível (`409`) quando o saldo disponível não suportar a reserva integral.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/route.ts`, `src/lib/stock-reservation.ts`, `src/lib/order-state-machine.ts`, `src/app/api/checkout/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [x] Checkout com saldo disponível cria reserva consistente antes de avançar para pagamento.
  - [x] Compras concorrentes para o último item resultam em no máximo uma reserva bem-sucedida.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S07-RES-001  
  **Status:** 🟢 Concluída (2026-03-19)
  **Notas adicionais (opcional):**
  - `AIDEV-CRITICAL` no ponto central de reserva/consumo do inventário.
  - Evitar solução distribuída; usar transação, contadores e checagens determinísticas.

- [x] **S07-RES-003** - Expirar e liberar reservas abandonadas ou falhas sem prender estoque

  **Descrição curta:**
  - Reservas que não chegam a pagamento confirmado não podem permanecer indefinidamente no inventário reservado.
  - A fase exige cleanup determinístico on-read/on-write e uma rotina operacional simples para cenários expirados.

  **Implementação sugerida:**
  - Liberar reservas expiradas ou órfãs durante pontos críticos do fluxo (`checkout`, `webhook` e rotinas operacionais).
  - Criar script operacional para limpeza de reservas expiradas com opção de `dry-run`.
  - Integrar expiração com o ciclo de vida da sessão de checkout e razões de cancelamento conhecidas.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/route.ts`, `src/lib/stock-reservation.ts`, `scripts/inventory-reservations-cleanup.ts` (novo), `package.json`, `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md`

  **Critérios de aceitação:**
  - [x] Reservas expiradas ou abandonadas são liberadas sem deixar `reserved` preso.
  - [x] Existe comando operacional repetível para limpeza e diagnóstico de reservas vencidas.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S07-RES-001, S07-RES-002  
  **Status:** 🟢 Concluída

### 📦 Confirmação de pagamento e compensação - Estoque consistente do webhook ao pós-pagamento

#### Objetivo

Garantir que os eventos de pagamento convertam ou liberem reservas exatamente uma vez. Esta categoria cobre integração entre webhook Stripe, máquina de estados e mutações de inventário, sem regressão da idempotência da Sprint 02.

#### FUL.1 - Consumo definitivo e liberação idempotente

- [ ] **S07-FUL-001** - Converter reserva em baixa definitiva somente após confirmação válida de pagamento

  **Descrição curta:**
  - A baixa definitiva do inventário não deve ocorrer no início do checkout.
  - A reserva precisa ser consumida apenas quando o pedido/pagamento atingir transição válida de sucesso.

  **Implementação sugerida:**
  - Integrar o módulo de reserva ao webhook Stripe para converter `reserved` em baixa real na confirmação de pagamento.
  - Persistir movimento de estoque e histórico de status com contexto de origem (`source:webhook`, `reason:reservation_commit`).
  - Garantir transação única entre atualização de pedido, pagamento, histórico e inventário.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/stock-reservation.ts`, `src/lib/order-state-machine.ts`, `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [ ] Pagamento confirmado converte reserva em baixa definitiva sem duplicidade.
  - [ ] Pedido, pagamento e estoque permanecem coerentes após a transação de sucesso.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S07-RES-002  
  **Status:** 🔴 Pendente
  **Notas adicionais (opcional):**
  - Preservar compatibilidade com deduplicação por `event.id` já entregue na Sprint 02.

- [ ] **S07-FUL-002** - Liberar reserva em cancelamento, expiração e falha com idempotência

  **Descrição curta:**
  - Eventos como `checkout.session.expired` e falhas de pagamento precisam devolver saldo ao estoque reservado.
  - Retries ou webhooks duplicados não podem liberar duas vezes a mesma reserva.

  **Implementação sugerida:**
  - Reaproveitar o fluxo de falha do webhook para localizar pedido/reserva e executar compensação única.
  - Registrar status final da reserva (`released`, `expired`, `cancelled` ou equivalente) junto com motivo operacional.
  - Cobrir eventos de falha/expiração já suportados em `src/app/api/webhooks/stripe/route.ts`.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/route.ts`, `src/lib/stock-reservation.ts`, `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`, `src/lib/logger.ts`

  **Critérios de aceitação:**
  - [ ] Pagamento falho, expirado ou cancelado libera reserva exatamente uma vez.
  - [ ] Reentrega de webhook não provoca dupla liberação nem estado inválido de inventário.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S07-RES-003, S07-FUL-001  
  **Status:** 🔴 Pendente

- [ ] **S07-FUL-003** - Proteger ajustes manuais e mutações administrativas contra violação de reserva

  **Descrição curta:**
  - A Sprint 06 já impede ajuste abaixo do volume reservado, mas a Sprint 07 precisa alinhar isso ao novo modelo de reserva.
  - Admin, webhook e checkout não podem divergir sobre o significado de `reserved` e `available`.

  **Implementação sugerida:**
  - Revisar `POST /api/admin/products/[productId]/stock` para consumir o novo contrato de reserva.
  - Centralizar cálculo de estoque disponível e mensagens de erro operacionais.
  - Garantir que mutações manuais preservem o invariante do inventário mesmo sob concorrência com checkout/webhook.

  **Arquivos/áreas afetadas:** `src/app/api/admin/products/[productId]/stock/route.ts`, `src/app/api/admin/products/[productId]/stock/__tests__/route.integration.test.ts`, `src/lib/stock-reservation.ts`, `src/lib/admin/dashboard-metrics.ts`

  **Critérios de aceitação:**
  - [ ] Ajuste manual não reduz saldo abaixo do volume efetivamente reservado.
  - [ ] Checkout, webhook e painel compartilham o mesmo cálculo canônico de disponibilidade.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 5h  
  **Dependências:** S07-RES-001, S07-FUL-001  
  **Status:** 🔴 Pendente
  **Notas adicionais (opcional):**
  - `AIDEV-GOTCHA`: evitar drift entre `Inventory.reserved`, registros de reserva e KPIs do painel.

### 📦 Operação de estoque e reconciliação - Visibilidade e correção segura de divergências

#### Objetivo

Dar visibilidade operacional ao novo ciclo de estoque e criar uma rota segura para tratar inconsistências. O foco é permitir diagnóstico claro sem aumentar complexidade além do necessário para o contexto de demo/portfolio.

#### OPS.1 - Painel operacional e reconciliador de inventário

- [ ] **S07-OPS-001** - Expor estoque total, reservado e disponível no painel admin e nas APIs

  **Descrição curta:**
  - O painel da Sprint 06 já mostra catálogo e KPIs, mas ainda não separa claramente saldo total, reservado e disponível.
  - Operação precisa enxergar o impacto de reservas ativas e baixo estoque real.

  **Implementação sugerida:**
  - Expandir endpoints admin de produtos/detalhe/dashboard para retornar métricas de inventário com campos explícitos.
  - Ajustar o cálculo de “estoque baixo” para usar disponibilidade real e não apenas quantidade bruta.
  - Atualizar hooks e componentes admin para comunicar reservas, disponibilidade e possíveis bloqueios operacionais.

  **Arquivos/áreas afetadas:** `src/app/api/admin/products/route.ts`, `src/app/api/admin/products/[productId]/route.ts`, `src/app/api/admin/dashboard/route.ts`, `src/lib/admin/dashboard-metrics.ts`, `src/hooks/useAdminCatalog.ts`, `src/components/admin/catalog/*`, `src/components/admin/dashboard/*`

  **Critérios de aceitação:**
  - [ ] Painel admin exibe estoque total, reservado e disponível por item relevante.
  - [ ] KPI/alerta de estoque baixo passa a refletir saldo realmente vendável.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 6h  
  **Dependências:** S07-FUL-003  
  **Status:** 🔴 Pendente

- [ ] **S07-OPS-002** - Criar rotina de reconciliação de inventário com relatório de anomalias

  **Descrição curta:**
  - Mesmo com reserva e webhook idempotente, falhas parciais e dados legados ainda podem gerar divergência.
  - A sprint exige uma rotina auditável para detectar reservas expiradas, consumo não consolidado e invariantes quebrados.

  **Implementação sugerida:**
  - Criar serviço/script de reconciliação com modo `dry-run` e modo de correção controlada.
  - Detectar ao menos: `reserved > quantity`, estoque negativo, reserva vencida ativa e pedido pago sem baixa definitiva.
  - Produzir relatório técnico para operação com resumo por severidade e ação recomendada.

  **Arquivos/áreas afetadas:** `src/lib/inventory-reconciliation.ts` (novo), `scripts/inventory-reconciliation.ts` (novo), `package.json`, `docs/ROADMAP/Logs/S07-OPS-002.md` (novo)

  **Critérios de aceitação:**
  - [ ] Rotina identifica anomalias centrais da Sprint 07 com saída reproduzível.
  - [ ] Existe caminho seguro para correção manual ou assistida sem mutação cega.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 7h  
  **Dependências:** S07-RES-003, S07-FUL-002  
  **Status:** 🔴 Pendente
  **Notas adicionais (opcional):**
  - Preferir comando operacional local/manual antes de automatizar cron dedicado.

- [ ] **S07-OPS-003** - Formalizar runbook operacional de reserva, reconciliação e rollback

  **Descrição curta:**
  - Operação precisa de passos claros para lidar com oversell evitado, reserva presa ou divergência detectada.
  - A documentação da sprint deve refletir comandos, gatilhos e responsáveis.

  **Implementação sugerida:**
  - Consolidar no roadmap da Sprint 07 o fluxo de reserva, consumo, liberação e reconciliação.
  - Documentar env vars novas, parâmetros de TTL e comandos de limpeza/reconciliação.
  - Registrar riscos residuais, tradeoffs e limites conhecidos do modelo adotado.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-07-estoque-fulfillment-confiavel.md`, `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md`, `docs/03-seguranca-governanca/01-hardening-backlog.md`, `docs/ROADMAP/Logs/S07-OPS-003.md` (novo)

  **Critérios de aceitação:**
  - [ ] Runbook descreve gatilhos, comandos, rollback e papéis de resposta.
  - [ ] Variáveis de ambiente e decisões técnicas da sprint ficam documentadas de forma rastreável.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S07-OPS-002  
  **Status:** 🔴 Pendente

### 📦 Testes, homologação e governança - Evidência prática contra oversell e drift operacional

#### Objetivo

Fechar a Sprint 07 com evidência automatizada e manual dos cenários críticos. O foco é provar concorrência segura, idempotência entre webhook e inventário, além de um plano de rollback utilizável.

#### INV.1 - Qualidade e go/no-go da Sprint 07

- [ ] **S07-INV-001** - Cobrir integração de reserva e checkout em cenários concorrentes

  **Descrição curta:**
  - O principal risco desta sprint é a corrida entre dois checkouts para o mesmo saldo.
  - A cobertura precisa validar tanto sucesso único quanto falha previsível para o competidor perdedor.

  **Implementação sugerida:**
  - Expandir suites de integração do checkout para cenários de disputa pelo último item.
  - Cobrir reserva parcial inválida, estoque insuficiente após concorrência e limpeza de reserva expirada.
  - Garantir mocks determinísticos para transações e contadores de inventário.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/__tests__/route.integration.test.ts`, `src/lib/stock-reservation.test.ts` (novo), `package.json`

  **Critérios de aceitação:**
  - [ ] Cenário “dois compradores para o último item” tem resultado determinístico e testado.
  - [ ] Regressão de reserva/checkout bloqueia pipeline da Sprint 07.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S07-RES-002, S07-RES-003  
  **Status:** 🔴 Pendente

- [ ] **S07-INV-002** - Cobrir webhook, admin e fluxo crítico ponta a ponta de estoque reservado

  **Descrição curta:**
  - A sprint precisa validar commit/liberação de reserva e reflexo no painel admin.
  - O fluxo crítico deve cobrir reserva, pagamento, webhook duplicado e leitura operacional do inventário.

  **Implementação sugerida:**
  - Expandir testes de integração do webhook para sucesso, falha, expiração e deduplicação com mutação de estoque.
  - Ajustar suites admin para validar campos `reserved` e `available` no catálogo/dashboard.
  - Criar ou estender cenário E2E crítico do checkout para incluir validação operacional no painel.

  **Arquivos/áreas afetadas:** `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`, `src/app/api/admin/dashboard/__tests__/route.integration.test.ts`, `src/app/api/admin/products/[productId]/__tests__/route.integration.test.ts`, `e2e/checkout-critical-flow.spec.ts`, `playwright.config.ts`

  **Critérios de aceitação:**
  - [ ] Webhook duplicado não gera baixa dupla nem liberação dupla de estoque.
  - [ ] Painel admin reflete corretamente a transição entre reservado, disponível e baixado definitivo.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 7h  
  **Dependências:** S07-FUL-002, S07-OPS-001  
  **Status:** 🔴 Pendente

- [ ] **S07-INV-003** - Executar checklist de homologação e validar plano de rollback da Sprint 07

  **Descrição curta:**
  - A entrega da sprint exige evidência formal dos cenários listados no roadmap: concorrência, falha, duplicidade e reconciliação.
  - O rollback precisa ser testável e alinhado ao RTO definido para a fase.

  **Implementação sugerida:**
  - Executar o checklist manual definido em `docs/ROADMAP/SPRINTS/sprint-07-estoque-fulfillment-confiavel.md`.
  - Consolidar evidências técnicas, decisão de go/no-go e responsáveis em log dedicado da sprint.
  - Validar os gatilhos de rollback: estoque negativo, baixa duplicada e bloqueio indevido de checkout em massa.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-07-estoque-fulfillment-confiavel.md`, `docs/ROADMAP/Logs/S07-INV-003.md` (novo), `docs/development/tasks/PHASE-07-estoque-fulfillment-confiavel.md`

  **Critérios de aceitação:**
  - [ ] Checklist manual da sprint executado com evidência rastreável por cenário.
  - [ ] Plano de rollback validado com decisão formal de go/no-go.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S07-INV-001, S07-INV-002, S07-OPS-002  
  **Status:** 🔴 Pendente

---

## 🧪 Testes e Validações

- **Suites necessárias:** Unitário (Vitest) para serviço de reserva/reconciliação; integração (Vitest) para `/api/checkout`, `/api/webhooks/stripe`, `/api/admin/products` e `/api/admin/dashboard`; E2E crítico (Playwright) para jornada de checkout com reflexo operacional no admin.
- **Cobertura alvo:** 100% dos cenários P0 de oversell/idempotência e >=80% dos ramos críticos dos módulos de inventário alterados.
- **Comandos de verificação:** `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:unit:critical`, `npm run test:integration:critical`, `npm run test:e2e:critical:ci` e, quando criados na sprint, comandos operacionais como `npm run inventory:cleanup-expired -- --dry-run` e `npm run inventory:reconcile -- --dry-run`.
- **Estado atual:** 🟡 Planejado; execução técnica da Sprint 07 ainda não iniciada. A homologação deve seguir a checklist e o plano de rollback definidos no roadmap da sprint.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/ROADMAP/SPRINTS/sprint-07-estoque-fulfillment-confiavel.md` com progresso por etapa, evidências e status de homologação.
- Registrar evidências técnicas por task em `docs/ROADMAP/Logs/S07-*.md`.
- Atualizar `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md` se a sprint introduzir TTL, batch size ou flags operacionais de reconciliação.
- Atualizar `docs/03-seguranca-governanca/01-hardening-backlog.md` para refletir riscos residuais de inventário, oversell e reconciliação.
- Revisar `AIDEV-*` anchors em módulos críticos de checkout, webhook e estoque antes de encerrar a fase.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas da Fase 07 marcadas como concluídas.
- [ ] Reserva de estoque implementada com expiração, consumo e liberação determinísticos.
- [ ] Checkout bloqueia oversell em cenário concorrente sem regressão funcional.
- [ ] Webhook Stripe mantém idempotência e não provoca mutação dupla de inventário.
- [ ] Painel admin exibe estoque total, reservado e disponível com contrato estável.
- [ ] Rotina de reconciliação identifica e trata anomalias centrais da sprint.
- [ ] Migrações de schema aplicadas, validadas e versionadas.
- [ ] Testes unitários, integração, E2E crítico e checklist manual executados.
- [ ] Plano de rollback validado com decisão formal de go/no-go.
