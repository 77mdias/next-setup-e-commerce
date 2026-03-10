# 🚀 Tasks - Fase 04: Qualidade, Testes e Observabilidade

**Status:** 🟢 ATIVA
**Última atualização:** 2026-03-10
**Sprint Atual:** Sprint 04
**Status Geral:** 🟡 25% (3/12 tarefas completas) - FASE ATIVA
**ETA:** 1 sprint (10 dias úteis)
**Pré-requisito:** Fase 03 - Experiência de Conta e Pedido (✅ concluída em 2026-03-08)

---

## 📊 Resumo de Progresso

| Categoria                               | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| --------------------------------------- | ------ | --------- | ------------ | -------- | --------- |
| Estratégia de qualidade e critérios     | 3      | 3         | 0            | 0        | 0         |
| Cobertura automatizada do fluxo crítico | 3      | 0         | 0            | 3        | 0         |
| Observabilidade e logs seguros          | 3      | 0         | 0            | 3        | 0         |
| CI gate e rollout monitorado            | 3      | 0         | 0            | 3        | 0         |
| **TOTAL**                               | **12** | **3**     | **0**        | **9**    | **0**     |

### 🎯 Principais Indicadores

- ✅ Baseline inicial de risco do fluxo de compra publicada na Sprint 04 (`S04-QLT-001`).
- ✅ Baseline de metricas minimas com SLI/SLO e thresholds de alerta publicada (`S04-QLT-002`).
- ✅ Estrategia de cobertura por camada e DoD de merge publicados com gate minimo no CI (`S04-QLT-003`).
- ⚠️ Logging operacional ainda depende de `console.*` em rotas críticas e precisa padronização com redaction de PII.

---

## 🎯 Objetivos da Fase

- Definir baseline de confiabilidade para releases com foco no fluxo crítico de compra.
- Mapear módulos críticos e formalizar critérios de priorização de cobertura.
- Estabelecer métricas mínimas de saúde operacional (erro, latência e falha de pagamento).
- Estruturar suíte de testes por camadas (unitário, integração e E2E) com execução consistente.
- Implementar logging estruturado com correlação de contexto e remoção de dados sensíveis.
- Reduzir ruído operacional (warnings recorrentes de hooks/imagens) para melhorar sinal de incidente.
- Tornar o pipeline de CI bloqueante para regressões críticas e formalizar checklist de monitoramento pós-deploy.

---

## 📦 Estrutura de Categorias

### 📦 Estratégia de qualidade e critérios - Baseline de confiabilidade da Sprint 04

#### Objetivo

Definir o que será medido e testado antes de ampliar cobertura de forma indiscriminada. Esta categoria cobre discovery técnico, definição de métricas mínimas e desenho de estratégia de qualidade para os fluxos de maior risco.

#### QLT.1 - Discovery e design de cobertura

- [x] **S04-QLT-001** - Mapear módulos críticos e riscos do fluxo de compra

  **Descrição curta:**
  - Identificar módulos com maior impacto em receita/experiência (checkout, webhook, pedidos, autenticação e carrinho).
  - Priorizar cenários por severidade e probabilidade para orientar cobertura inicial.

  **Implementação sugerida:**
  - Levantar fluxo ponta a ponta de compra e pontos de falha críticos.
  - Criar matriz de risco (P0/P1/P2) com donos técnicos por módulo.
  - Registrar baseline em log técnico da sprint com decisões de priorização.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-04-qualidade-observabilidade.md`, `docs/ROADMAP/Logs/S04-QLT-001.md` (novo)

  **Critérios de aceitação:**
  - [x] Matriz de risco dos módulos críticos publicada e validada por engenharia.
  - [x] Lista de cenários P0/P1 definida para uso nas tasks de teste e CI gate.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 3h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída (2026-03-08)

- [x] **S04-QLT-002** - Definir métricas mínimas de saúde e thresholds de alerta

  **Descrição curta:**
  - Formalizar métricas de confiabilidade para operação diária e go/no-go de release.
  - Cobrir taxa de erro, latência e falha de pagamento com limites objetivos.

  **Implementação sugerida:**
  - Definir SLI/SLO iniciais para APIs críticas (`checkout`, `webhooks/stripe`, `orders`).
  - Especificar limites e janelas de observação (ex.: `p95`, taxa de `5xx`, taxa de `FAILED`).
  - Amarrar cada métrica a fonte de coleta e responsável operacional.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-04-qualidade-observabilidade.md`, `docs/ROADMAP/Logs/S04-QLT-002.md` (novo)

  **Critérios de aceitação:**
  - [x] Métricas críticas com thresholds e responsáveis documentados.
  - [x] Critério objetivo de alerta definido para falha de pagamento e degradação de latência.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 3h  
  **Dependências:** S04-QLT-001  
  **Status:** ✅ Concluída (2026-03-08)

- [x] **S04-QLT-003** - Definir estratégia de cobertura por camada (unit + integration + e2e)

  **Descrição curta:**
  - Converter critérios de risco em plano de testes executável e incremental.
  - Garantir que cada cenário crítico tenha camada de teste apropriada.

  **Implementação sugerida:**
  - Mapear cenários P0/P1 para camadas de teste e prioridade de execução no CI.
  - Definir stack e contrato mínimo para testes E2E sem flakiness excessiva.
  - Publicar Definition of Done de qualidade para merge em branches protegidas.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-04-qualidade-observabilidade.md`, `vitest.integration.config.ts`, `playwright.config.ts` (novo), `package.json`

  **Critérios de aceitação:**
  - [x] Matriz cenário x camada de teste publicada e versionada.
  - [x] Critérios de execução mínima para merge definidos e referenciados no CI.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S04-QLT-001, S04-QLT-002  
  **Status:** ✅ Concluída (2026-03-10)

### 📦 Cobertura automatizada do fluxo crítico - Testes executáveis por camada

#### Objetivo

Implementar cobertura automatizada para reduzir regressões nos caminhos de maior impacto de negócio. O foco é validar regras de domínio, integração de APIs críticas e jornada de compra em execução contínua.

#### TST.1 - Suíte de testes críticos

- [x] **S04-TST-001** - Expandir suíte unitária para regras críticas de domínio

  **Descrição curta:**
  - Cobrir regras determinísticas que não dependem de infraestrutura externa.
  - Garantir regressão rápida para cálculo/validação de estados e helpers de checkout.

  **Implementação sugerida:**
  - Criar configuração de testes unitários dedicada e script de execução rápida.
  - Adicionar casos para matriz de transição de pedidos e utilitários críticos.
  - Incluir testes para utilitários de sanitização/redaction introduzidos na sprint.

  **Arquivos/áreas afetadas:** `package.json`, `vitest.unit.config.ts` (novo), `src/lib/order-state-machine.ts`, `src/lib/order-state-machine.test.ts` (novo), `src/hooks/useCheckout.helpers.test.ts`

  **Critérios de aceitação:**
  - [x] Regras críticas de domínio com cobertura unitária executável em pipeline.
  - [x] Script `test:unit` disponível e estável em execução local/CI.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 5h  
  **Dependências:** S04-QLT-003  
  **Status:** ✅ Concluída (2026-03-10)

- [ ] **S04-TST-002** - Cobrir fluxo crítico de compra em integração backend

  **Descrição curta:**
  - Validar contrato entre checkout, webhook e leitura de pedido em cenários reais de API.
  - Reduzir regressão de comportamento entre sucesso, falha e reentrega de eventos.

  **Implementação sugerida:**
  - Expandir suites de integração de `checkout`, `webhooks/stripe` e `orders` com cenários P0.
  - Cobrir eventos duplicados, falha de pagamento e consulta de pedido por owner.
  - Garantir fixtures determinísticas para execução repetível sem flaky.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/__tests__/route.integration.test.ts`, `src/app/api/webhooks/stripe/__tests__/route.integration.test.ts`, `src/app/api/orders/session/[sessionId]/__tests__/route.integration.test.ts`, `src/app/api/orders/[orderId]/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [ ] Fluxo crítico de compra coberto por testes de integração automatizados.
  - [ ] Cenários de duplicidade/falha de pagamento bloqueiam regressão no CI.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S04-TST-001  
  **Status:** 🔴 Pendente

- [ ] **S04-TST-003** - Introduzir cenário E2E de compra para validação de release

  **Descrição curta:**
  - Validar jornada do usuário em nível de aplicação para detectar quebras de integração UI/API.
  - Cobrir caminho mínimo de add-to-cart, checkout e retorno de status de pedido.

  **Implementação sugerida:**
  - Introduzir setup E2E com Playwright e ambiente controlado para CI.
  - Criar cenário crítico de compra e fallback de falha de pagamento.
  - Publicar artefatos de execução (trace/screenshot/video) para diagnóstico.

  **Arquivos/áreas afetadas:** `playwright.config.ts` (novo), `e2e/checkout-critical-flow.spec.ts` (novo), `.github/workflows/ci.yml`, `package.json`

  **Critérios de aceitação:**
  - [ ] Cenário E2E crítico executa automaticamente em PR/release.
  - [ ] Falha no fluxo crítico E2E bloqueia merge em branch protegida.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S04-TST-002  
  **Status:** 🔴 Pendente

### 📦 Observabilidade e logs seguros - Telemetria com contexto e redaction

#### Objetivo

Padronizar telemetria operacional para permitir diagnóstico rápido sem exposição de dados sensíveis. Esta categoria cobre logger estruturado, políticas de redaction e redução de ruído em warnings para aumentar sinal de incidentes.

#### OBS.1 - Logging e higiene operacional

- [ ] **S04-OBS-001** - Introduzir logger estruturado central com correlação de contexto

  **Descrição curta:**
  - Substituir uso difuso de `console.*` em fluxos críticos por logger padronizado.
  - Garantir campos mínimos de contexto para rastrear requisições e eventos.

  **Implementação sugerida:**
  - Criar utilitário central de log com níveis (`info`, `warn`, `error`) e shape estável.
  - Incluir `requestId`, `orderId`, `eventId` e rota no contexto quando disponível.
  - Migrar inicialmente endpoints críticos de checkout, webhook e pedidos.

  **Arquivos/áreas afetadas:** `src/lib/logger.ts` (novo), `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/orders/session/[sessionId]/route.ts`, `src/app/api/orders/[orderId]/route.ts`

  **Critérios de aceitação:**
  - [ ] Logs de rotas críticas seguem formato estruturado único.
  - [ ] Endpoints críticos deixam de depender de `console.*` para observabilidade principal.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S04-QLT-002  
  **Status:** 🔴 Pendente

- [ ] **S04-OBS-002** - Aplicar redaction de PII em logs de auth, checkout e pedidos

  **Descrição curta:**
  - Evitar exposição de dados pessoais e segredos em logs de aplicação.
  - Cobrir e-mail, CPF, tokens e payloads sensíveis com mascaramento consistente.

  **Implementação sugerida:**
  - Criar utilitário de redaction para campos sensíveis antes da emissão de log.
  - Revisar pontos com risco de vazamento em auth, checkout, webhooks e orders.
  - Adicionar testes para garantir que logs não contenham PII em texto puro.

  **Arquivos/áreas afetadas:** `src/lib/log-redaction.ts` (novo), `src/lib/auth.ts`, `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/orders/[orderId]/route.ts`, `src/app/api/admin/remove-bg/__tests__/route.integration.test.ts`

  **Critérios de aceitação:**
  - [ ] Logs de fluxos críticos não expõem e-mail/CPF/token em texto puro.
  - [ ] Testes de segurança de logging falham se redaction for removida.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S04-OBS-001  
  **Status:** 🔴 Pendente

- [ ] **S04-OBS-003** - Reduzir ruído operacional de warnings (hooks e imagens)

  **Descrição curta:**
  - Diminuir warnings recorrentes de build/test para facilitar detecção de problemas reais.
  - Tratar principalmente avisos de hooks React e uso de imagens em pontos críticos.

  **Implementação sugerida:**
  - Auditar warnings atuais em `lint`, `build` e execução de testes.
  - Corrigir dependências de hooks e ajustes de imagem sem quebrar UX/performance.
  - Definir baseline de warnings aceitáveis para release e documentar exceções justificadas.

  **Arquivos/áreas afetadas:** `src/components/products/products-catalog.tsx`, `src/components/orders/orders-page-content.tsx`, `src/app/checkout/page.tsx`, `src/app/[slug]/checkout/page.tsx`, `docs/ROADMAP/Logs/S04-OBS-003.md` (novo)

  **Critérios de aceitação:**
  - [ ] Warnings recorrentes de hooks/imagens reduzidos nos fluxos críticos de compra.
  - [ ] Baseline de warnings e exceções documentado para revisão de release.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S04-OBS-001  
  **Status:** 🔴 Pendente

### 📦 CI gate e rollout monitorado - Merge protegido e validação pós-deploy

#### Objetivo

Transformar qualidade e observabilidade em critérios objetivos de liberação. A categoria cobre gate de CI, checklist operacional pós-deploy e plano de rollback para reação rápida a regressões.

#### RLS.1 - Governança de release

- [ ] **S04-RLS-001** - Tornar pipeline CI bloqueante com lint, build e testes críticos

  **Descrição curta:**
  - Garantir que regressões críticas impeçam merge antes de chegar em produção.
  - Consolidar ordem de execução de checks com foco em feedback rápido.

  **Implementação sugerida:**
  - Atualizar workflow de CI para incluir testes críticos definidos na fase.
  - Configurar status checks obrigatórios para branches protegidas.
  - Ajustar paralelismo/timeout para manter tempo de pipeline controlado.

  **Arquivos/áreas afetadas:** `.github/workflows/ci.yml`, `package.json`, `docs/ROADMAP/Logs/S04-RLS-001.md` (novo)

  **Critérios de aceitação:**
  - [ ] Merge bloqueado automaticamente quando qualquer teste crítico falhar.
  - [ ] Pipeline executa lint, build e suíte crítica com resultado rastreável.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** S04-TST-002, S04-TST-003  
  **Status:** 🔴 Pendente

- [ ] **S04-RLS-002** - Implementar checklist de monitoramento pós-deploy da Sprint 04

  **Descrição curta:**
  - Validar estabilidade da release com observação ativa logo após deploy.
  - Padronizar validação de métricas, smoke funcional e comunicação de incidentes.

  **Implementação sugerida:**
  - Criar checklist operacional para janela de 60 minutos pós-release.
  - Incluir verificação de taxa de erro, latência e falha de pagamento por fluxo crítico.
  - Definir canal de reporte, responsáveis e formato de evidência.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-04-qualidade-observabilidade.md`, `docs/ROADMAP/Logs/S04-RLS-002.md` (novo)

  **Critérios de aceitação:**
  - [ ] Checklist pós-deploy executável e reutilizável por release.
  - [ ] Evidências operacionais registradas com decisão explícita de estabilidade.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S04-QLT-002, S04-OBS-001, S04-RLS-001  
  **Status:** 🔴 Pendente

- [ ] **S04-RLS-003** - Formalizar plano de rollback e critérios de go/no-go

  **Descrição curta:**
  - Definir gatilhos objetivos para rollback quando testes/telemetria apontarem regressão.
  - Consolidar papéis e tempo alvo de recuperação.

  **Implementação sugerida:**
  - Descrever gatilhos de rollback para falha de testes críticos e degradação de métricas.
  - Definir sequência operacional de reversão e validação de recuperação.
  - Registrar aprovação de engenharia, QA e produto no fechamento da sprint.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-04-qualidade-observabilidade.md`, `docs/ROADMAP/Logs/S04-RLS-003.md` (novo), `docs/development/tasks/PHASE-04-qualidade-observabilidade.md`

  **Critérios de aceitação:**
  - [ ] Plano de rollback com RTO alvo e responsáveis definidos.
  - [ ] Critérios de go/no-go formalizados e evidenciados em log da sprint.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S04-RLS-001, S04-RLS-002  
  **Status:** 🔴 Pendente

---

## 🧪 Testes e Validações

- **Suites necessárias:** Unitário (Vitest), integração de APIs críticas (Vitest integration), E2E de compra (Playwright), smoke pós-deploy.
- **Cobertura alvo:** 100% dos cenários P0 da Sprint 04 e >=80% de branches nos módulos críticos (`checkout`, `webhooks/stripe`, `orders`).
- **Comandos de verificação:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:integration`, `npm run test:unit` (novo), `npm run test:e2e` (novo).
- **Estado atual:** ⚠️ Em evolução; CI já executa lint/typecheck/build, mas gate de testes críticos e observabilidade estruturada ainda dependem das tasks S04-TST/S04-OBS/S04-RLS.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/development/TASKS.md` com status da Fase 04 quando arquivo índice existir.
- Atualizar `docs/development/CHANGELOG.md` com entregas de qualidade e observabilidade (quando criado).
- Registrar evidências por tarefa em `docs/ROADMAP/Logs/S04-*.md`.
- Atualizar `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md` se houver novas variáveis para logging/monitoramento.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas da Fase 04 marcadas como concluídas.
- [ ] Gate de CI com lint, build e testes críticos ativado e bloqueante.
- [ ] Fluxo crítico de compra coberto por testes automatizados (unit/integration/e2e).
- [ ] Logs estruturados sem exposição de PII nos pontos críticos da aplicação.
- [ ] Checklist pós-deploy executado com monitoramento e evidências registradas.
- [ ] Plano de rollback e aprovação final (engenharia, QA e produto) documentados.
