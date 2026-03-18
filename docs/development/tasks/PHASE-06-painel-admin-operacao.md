# 🚀 Tasks - Fase 06: Painel Admin e Operacao

**Status:** 🟠 EM ANDAMENTO
**Última atualização:** 2026-03-18
**Sprint Atual:** Sprint 06
**Status Geral:** 🟡 33% (4/12 tarefas concluídas)
**ETA:** 2 semanas após kickoff da Sprint 06
**Pré-requisito:** Fase 05 - Hardening de Identidade e Segurança (✅ concluída em 2026-03-13)

---

## 📊 Resumo de Progresso

| Categoria                                  | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| ------------------------------------------ | ------ | --------- | ------------ | -------- | --------- |
| Fundação do painel e RBAC                  | 3      | 2         | 0            | 1        | 0         |
| Dashboard operacional e KPIs               | 3      | 1         | 0            | 2        | 0         |
| Módulos operacionais e trilha de auditoria | 3      | 0         | 0            | 3        | 0         |
| Testes, homologação e governança           | 3      | 1         | 0            | 2        | 0         |
| **TOTAL**                                  | **12** | **4**     | **0**        | **8**    | **0**     |

### 🎯 Principais Indicadores

- ✅ Guard inicial de acesso em `/admin` entregue com validação em middleware + layout server-side.
- ✅ Matriz de autorização por recurso/ação entregue para `/api/admin/**` com contrato uniforme de erro.
- 🔄 Contrato de KPIs e endpoint consolidado de dashboard entregues; resta a etapa de shell/UI para consumo operacional.
- 🔄 Módulos operacionais priorizados: pedidos, catálogo/estoque/imagens e visão de clientes.
- 🔄 Trilha de auditoria para ações sensíveis definida como requisito de aceite da fase.
- 🔄 Checklist de homologação e plano de rollback já definidos no roadmap da Sprint 06.

---

## 🎯 Objetivos da Fase

- Entregar shell administrativo inicial com navegação e guard de acesso por papel.
- Aplicar RBAC consistente entre rotas de página e endpoints `/api/admin/**`.
- Implementar dashboard MVP com KPIs operacionais essenciais para rotina diária.
- Entregar módulo de pedidos com listagem, filtros, detalhe e ações operacionais permitidas.
- Entregar módulo de catálogo com CRUD, gestão de imagem e ajuste de estoque por escopo de loja.
- Disponibilizar visão administrativa de clientes sem exposição desnecessária de dados sensíveis.
- Registrar trilha de auditoria para alterações administrativas críticas.
- Fechar fase com cobertura de testes, checklist de homologação e plano de rollback executável.

---

## 📦 Estrutura de Categorias

### 📦 Fundação do painel e RBAC - Controle de acesso seguro por papel

#### Objetivo

Estabelecer a base de autenticação/autorização do painel para impedir acesso indevido e garantir isolamento por loja desde o início da Sprint 06.

#### ACC.1 - Acesso administrativo e autorização

- [x] **S06-ACC-001** - Criar guard de autenticação/autorização para `/admin`

  **Descrição curta:**
  - Páginas administrativas precisam bloquear acesso anônimo e usuários sem papel compatível.
  - O comportamento deve ser consistente entre layout, middleware e páginas filhas.

  **Implementação sugerida:**
  - Criar layouts de admin com validação de sessão e papel.
  - Padronizar resposta de bloqueio (`redirect`, `403` ou `404`) por contexto de segurança.
  - Garantir callback seguro para login sem open redirect.

  **Arquivos/áreas afetadas:** `src/middleware.ts`, `src/app/admin/layout.tsx` (novo), `src/lib/auth.ts`, `src/lib/callback-url.ts`

  **Critérios de aceitação:**
  - [x] Usuário não autenticado não acessa páginas administrativas.
  - [x] Usuário autenticado sem papel admin recebe resposta consistente e segura.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** nenhuma  
  **Status:** 🟢 Concluída (2026-03-13)

- [x] **S06-ACC-002** - Implementar matriz RBAC por recurso/ação nas APIs administrativas

  **Descrição curta:**
  - Endpoints admin devem validar papel e escopo antes de qualquer operação.
  - A autorização precisa ser reutilizável para evitar divergência de regra entre rotas.

  **Implementação sugerida:**
  - Criar módulo compartilhado de política RBAC por recurso (`orders`, `catalog`, `customers`, `dashboard`).
  - Aplicar checks em `GET/POST/PUT/PATCH/DELETE` de `/api/admin/**`.
  - Padronizar erros de autorização sem detalhar regra interna.

  **Arquivos/áreas afetadas:** `src/lib/rbac.ts` (novo), `src/app/api/admin/**/route.ts`, `src/lib/logger.ts`

  **Critérios de aceitação:**
  - [x] Operações administrativas só executam quando papel e ação forem permitidos.
  - [x] Contrato de erro de autorização é uniforme nos endpoints admin.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S06-ACC-001  
  **Status:** 🟢 Concluída (2026-03-14)

- [x] **S06-ACC-003** - Garantir isolamento multi-store no escopo de `STORE_ADMIN`

  **Descrição curta:**
  - Operador de loja não pode visualizar/alterar dados de outra loja.
  - As queries admin precisam filtrar escopo por `storeId` de forma obrigatória.

  **Implementação sugerida:**
  - Aplicar filtro de escopo por loja em queries de pedidos, catálogo e clientes.
  - Reforçar validação cruzada entre contexto de rota e escopo autorizado do usuário.
  - Registrar tentativas de acesso cross-store em log de segurança redigido.

  **Arquivos/áreas afetadas:** `src/app/api/admin/orders/**`, `src/app/api/admin/products/**`, `src/app/api/admin/customers/**`, `src/lib/auth.ts`, `src/lib/log-redaction.ts`

  **Critérios de aceitação:**
  - [x] `STORE_ADMIN` não acessa dados de lojas fora do próprio escopo.
  - [x] `SUPER_ADMIN` mantém visão global sem regressão funcional.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S06-ACC-001, S06-ACC-002  
  **Status:** 🟢 Concluída (2026-03-15)

### 📦 Dashboard operacional e KPIs - Visão executiva mínima para rotina diária

#### Objetivo

Entregar um dashboard funcional para acompanhamento rápido da operação, com métricas confiáveis e sem vazamento de dados entre lojas.

#### DSH.1 - Dashboard MVP

- [x] **S06-DSH-001** - Definir contrato de KPIs e endpoints de agregação administrativa

  **Descrição curta:**
  - O dashboard precisa de contratos claros para evitar cálculo inconsistente entre frontend e backend.
  - A API deve suportar filtros mínimos por janela temporal e escopo de loja.

  **Implementação sugerida:**
  - Definir payload/resposta para indicadores de pedidos, receita, aprovação e estoque baixo.
  - Implementar endpoint consolidado com paginação/filtros quando necessário.
  - Garantir queries performáticas para contexto de demo sem complexidade excessiva.

  **Arquivos/áreas afetadas:** `src/app/api/admin/dashboard/route.ts` (novo), `src/lib/admin/dashboard-metrics.ts` (novo), `src/lib/prisma.ts`

  **Critérios de aceitação:**
  - [x] API de dashboard retorna KPIs mínimos com shape estável.
  - [x] Filtros de período e escopo de loja funcionam com resultado consistente.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S06-ACC-002, S06-ACC-003  
  **Status:** ✅ Concluída em 2026-03-15

- [x] **S06-DSH-002** - Construir shell de navegação administrativa e página inicial do dashboard

  **Descrição curta:**
  - A Sprint 06 exige entrada única de operação com navegação clara por módulos.
  - O shell precisa acomodar o contexto administrativo em `/admin`.

  **Implementação sugerida:**
  - Criar estrutura de layout com menu lateral, breadcrumbs e estado ativo de rota.
  - Definir links para dashboard, pedidos, catálogo, clientes e auditoria.
  - Garantir experiência responsiva mínima para uso desktop/mobile.

  **Arquivos/áreas afetadas:** `src/app/admin/page.tsx` (novo), `src/components/admin/AdminShell.tsx` (novo), `src/components/admin/AdminSidebar.tsx` (novo)

  **Critérios de aceitação:**
  - [x] Navegação admin funciona sem links quebrados nas rotas previstas.
  - [x] Usuário visualiza contexto correto (global ou loja) no shell do painel.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 6h  
  **Dependências:** S06-ACC-001  
  **Status:** ✅ Concluída em 2026-03-15

- [x] **S06-DSH-003** - Renderizar KPIs do dashboard com estados de loading/empty/error

  **Descrição curta:**
  - O dashboard deve comunicar o estado operacional de forma acionável.
  - A interface precisa tratar indisponibilidade parcial sem quebrar a tela inteira.

  **Implementação sugerida:**
  - Integrar página de dashboard ao endpoint de métricas.
  - Implementar cards de KPI com comparação por janela e sinais visuais básicos.
  - Tratar fallback de erro sem exposição de detalhes sensíveis.

  **Arquivos/áreas afetadas:** `src/components/admin/dashboard/*` (novo), `src/app/admin/page.tsx`, `src/hooks/useAdminDashboard.ts` (novo)

  **Critérios de aceitação:**
  - [x] Dashboard exibe os quatro KPIs mínimos definidos para a sprint.
  - [x] Estados de loading/empty/error são consistentes e não quebram navegação.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 5h  
  **Dependências:** S06-DSH-001, S06-DSH-002  
  **Status:** ✅ Concluída em 2026-03-17

### 📦 Módulos operacionais e trilha de auditoria - Execução diária com rastreabilidade

#### Objetivo

Disponibilizar os módulos administrativos de maior impacto operacional com registro auditável das ações sensíveis.

#### OPS.1 - Pedidos, catálogo e clientes no painel

- [x] **S06-OPS-001** - Entregar módulo de pedidos admin (listagem, filtros, detalhe e ação operacional)

  **Descrição curta:**
  - Operação precisa monitorar pedidos e executar ações permitidas por papel.
  - O módulo deve apresentar histórico básico sem expor dados além do necessário.

  **Implementação sugerida:**
  - Criar listagem com filtros por status, período e busca textual.
  - Implementar endpoint de detalhe com histórico de transições.
  - Implementar ação operacional permitida (ex.: atualização de status interno) com validação de RBAC.

  **Arquivos/áreas afetadas:** `src/app/api/admin/orders/route.ts` (novo), `src/app/api/admin/orders/[orderId]/route.ts` (novo), `src/app/admin/orders/page.tsx` (novo), `src/components/admin/orders/*` (novo)

  **Critérios de aceitação:**
  - [x] Operador autorizado consulta pedidos com filtros funcionais.
  - [x] Ação operacional em pedido respeita RBAC e atualiza histórico.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S06-ACC-002, S06-ACC-003  
  **Status:** 🟢 Concluída

- [x] **S06-OPS-002** - Entregar módulo de catálogo admin (CRUD, imagens e ajuste de estoque)

  **Descrição curta:**
  - O painel precisa permitir manutenção operacional de catálogo e inventário básico.
  - Alterações em produto/estoque devem seguir escopo de loja e validação de autorização.

  **Implementação sugerida:**
  - Implementar listagem e edição de produto/categoria no painel admin.
  - Integrar gestão de imagens com contrato seguro de upload/processamento.
  - Incluir ajuste de estoque com validação de valores e trilha de alteração.

  **Arquivos/áreas afetadas:** `src/app/api/admin/products/**/route.ts` (novo/ajuste), `src/app/api/admin/categories/**/route.ts` (novo/ajuste), `src/app/admin/catalog/page.tsx` (novo), `src/components/admin/catalog/*` (novo)

  **Critérios de aceitação:**
  - [x] CRUD de catálogo e ajuste de estoque funcionam dentro do escopo autorizado.
  - [x] Alterações inválidas são rejeitadas com mensagem consistente.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S06-ACC-002, S06-ACC-003  
  **Status:** 🟢 Concluída

- [x] **S06-OPS-003** - Entregar visão de clientes admin e trilha de auditoria para ações sensíveis

  **Descrição curta:**
  - Operação precisa localizar cliente por email/nome e consultar histórico básico de pedidos.
  - Ações sensíveis do painel devem gerar trilha de auditoria (quem, quando, antes/depois).

  **Implementação sugerida:**
  - Criar endpoint/listagem de clientes com busca e paginação.
  - Exibir histórico resumido de pedidos associado ao cliente no painel.
  - Implementar persistência de auditoria para mutações administrativas críticas.

  **Arquivos/áreas afetadas:** `src/app/api/admin/customers/route.ts` (novo), `src/app/admin/customers/page.tsx` (novo), `src/lib/audit-log.ts` (novo), `prisma/schema.prisma`, `prisma/migrations/*`

  **Critérios de aceitação:**
  - [x] Busca de clientes funciona por nome/email com escopo de autorização correto.
  - [x] Toda ação sensível em pedidos/catálogo registra evento auditável.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 8h  
  **Dependências:** S06-OPS-001, S06-OPS-002  
  **Status:** 🟢 Concluída

### 📦 Testes, homologação e governança - Go/no-go seguro da Sprint 06

#### Objetivo

Transformar o escopo do painel em entrega validada por testes críticos e critérios operacionais objetivos antes de release.

#### ADM.1 - Qualidade e operação do painel

- [x] **S06-ADM-001** - Cobrir integração de RBAC e isolamento multi-store nos endpoints admin

  **Descrição curta:**
  - Mudanças de autorização exigem cobertura de regressão para evitar bypass.
  - Os testes devem validar acesso permitido/negado por papel e por escopo de loja.

  **Implementação sugerida:**
  - Criar suites de integração para `/api/admin/dashboard`, `/orders`, `/products` e `/customers`.
  - Cobrir cenários `401`, `403`, `404` e acesso cross-store indevido.
  - Garantir mocks determinísticos de sessão e contexto de papel.

  **Arquivos/áreas afetadas:** `src/app/api/admin/**/__tests__/*.integration.test.ts`, `package.json`

  **Critérios de aceitação:**
  - [x] RBAC e escopo de loja cobertos por testes de integração em cenários críticos.
  - [x] Regressão de autorização bloqueia pipeline da sprint.

  **Prioridade:** 🔴 Crítica
  **Estimativa:** 6h
  **Dependências:** S06-ACC-002, S06-ACC-003, S06-OPS-003
  **Status:** 🟢 Concluída (2026-03-18)

- [ ] **S06-ADM-002** - Cobrir fluxo E2E crítico do painel admin (dashboard, pedidos e catálogo)

  **Descrição curta:**
  - O painel precisa de validação ponta a ponta para detectar quebras UI/API.
  - O escopo mínimo de release deve cobrir login admin, dashboard e operação essencial.

  **Implementação sugerida:**
  - Criar cenário E2E para acesso admin autorizado e bloqueio de usuário sem papel.
  - Cobrir fluxo de atualização operacional em pedido e alteração de catálogo/estoque.
  - Publicar artefatos Playwright para diagnóstico em falha.

  **Arquivos/áreas afetadas:** `e2e/admin-critical-flow.spec.ts` (novo), `playwright.config.ts`, `.github/workflows/ci.yml`, `package.json`

  **Critérios de aceitação:**
  - [ ] Fluxo E2E crítico do painel executa em CI sem flakiness relevante.
  - [ ] Falha no cenário crítico bloqueia merge/release da Sprint 06.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 7h  
  **Dependências:** S06-DSH-003, S06-OPS-001, S06-OPS-002  
  **Status:** ⚪ Pendente

- [ ] **S06-ADM-003** - Executar checklist de homologação e validar plano de rollback da Sprint 06

  **Descrição curta:**
  - O encerramento da sprint exige evidências operacionais e decisão formal de go/no-go.
  - A homologação deve validar segurança de acesso e continuidade do fluxo público.

  **Implementação sugerida:**
  - Executar checklist manual definido no roadmap da Sprint 06.
  - Consolidar evidências técnicas e decisão operacional em log da sprint.
  - Validar gatilhos, sequência e RTO do rollback com responsáveis.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-06-painel-admin-operacao.md`, `docs/ROADMAP/Logs/S06-ADM-003.md` (novo), `docs/development/tasks/PHASE-06-painel-admin-operacao.md`

  **Critérios de aceitação:**
  - [ ] Checklist de homologação executado com evidências rastreáveis.
  - [ ] Plano de rollback validado com decisão de go/no-go formal.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S06-ADM-001, S06-ADM-002  
  **Status:** ⚪ Pendente

---

## 🧪 Testes e Validações

- **Suites necessárias:** Unitário (Vitest) para RBAC/auditoria; integração (Vitest) para `/api/admin/**`; E2E crítico (Playwright) para fluxo admin; smoke de regressão do checkout público.
- **Cobertura alvo:** 100% dos cenários P0 de autorização/admin e >=80% dos ramos críticos dos módulos admin alterados.
- **Comandos de verificação:** `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`, `npm run test:unit:critical`, `npm run test:integration:critical`, `npm run test:e2e:critical:ci`.
- **Estado atual:** 🔄 Planejado; execução inicia após kickoff formal da Sprint 06.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/ROADMAP/SPRINTS/sprint-06-painel-admin-operacao.md` com progresso por etapa e status de homologação.
- Registrar evidências técnicas por task em `docs/ROADMAP/Logs/S06-*.md`.
- Atualizar `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md` caso novas env vars admin/auditoria sejam adicionadas.
- Atualizar `docs/03-seguranca-governanca/01-hardening-backlog.md` se surgirem novos riscos de autorização/auditoria.
- Atualizar documentação de API admin (quando criada) com contratos de paginação/filtro/ordenação.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas da Fase 06 marcadas como concluídas.
- [ ] RBAC aplicado em UI e API com validação de escopo por loja.
- [ ] Dashboard com KPIs mínimos operacionais entregue e validado.
- [ ] Módulos de pedidos, catálogo e clientes operacionais no painel.
- [ ] Trilha de auditoria ativa para ações administrativas sensíveis.
- [ ] Migrações de schema aplicadas e versionadas (se houver alteração no modelo de auditoria).
- [ ] Testes unitários, integração, E2E crítico e checklist manual executados.
- [ ] Plano de rollback validado com decisão formal de go/no-go.
