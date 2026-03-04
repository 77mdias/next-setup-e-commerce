# 🚀 Tasks - Fase 03: Experiência de Conta e Pedido

**Status:** 🟢 ATIVA
**Última atualização:** 2026-03-02
**Sprint Atual:** Sprint 03
**Status Geral:** 🟡 25% (3/12 tarefas completas) - FASE ATIVA
**ETA:** 1 sprint (5-7 dias úteis)
**Pré-requisito:** Fase 02 - Checkout Confiável e Integridade de Pedido (✅ concluída em 2026-03-02)

---

## 📊 Resumo de Progresso

| Categoria                          | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| ---------------------------------- | ------ | --------- | ------------ | -------- | --------- |
| Conta e endereços no perfil        | 3      | 3         | 0            | 0        | 0         |
| Navegação e convergência de rotas  | 3      | 0         | 0            | 3        | 0         |
| Admin remove-bg seguro e funcional | 3      | 0         | 0            | 3        | 0         |
| Testes, homologação e governança   | 3      | 0         | 0            | 3        | 0         |
| **TOTAL**                          | **12** | **3**     | **0**        | **9**    | **0**     |

### 🎯 Principais Indicadores

- ✅ Escopo da Sprint 03 consolidado em 4 frentes de experiência e operação.
- ✅ Dependências críticas de pedido/pagamento já endereçadas na Fase 02.
- ⚠️ Risco principal atual: fluxo admin de remove-bg usa endpoint de produto incompatível para persistência e expõe `apiKey` no payload.

---

## 🎯 Objetivos da Fase

- Entregar CRUD completo de endereços para usuário autenticado no perfil.
- Reduzir fricção de checkout com seleção consistente de endereço no fluxo de compra.
- Eliminar rotas inconsistentes de carrinho/pedido, mantendo compatibilidade para links legados.
- Padronizar redirecionamentos de sucesso/falha e callback de autenticação em rotas canônicas.
- Corrigir o fluxo administrativo de remove-bg com endpoint dedicado e controle de acesso explícito.
- Remover segredo de remove-bg do cliente e concentrar uso da chave no servidor.
- Garantir cobertura de integração e checklist operacional para go-live da Sprint 03.

---

## 📦 Estrutura de Categorias

### 📦 Conta e endereços no perfil - CRUD completo para usuário logado

#### Objetivo

Fechar a lacuna funcional de perfil onde hoje há listagem de endereços, mas sem criação, edição e remoção completas. Esta categoria cobre API, regras de endereço padrão e integração da UI de perfil/checkout.

#### ADR.1 - API de endereços e regras de consistência

- [x] **S03-ADR-001** - Completar `GET/POST/PUT/DELETE` em `/api/addresses` com ownership estrito

  **Descrição curta:**
  - Hoje a API de endereços oferece apenas leitura (`GET`) para o usuário autenticado.
  - É necessário implementar mutações com validação de payload e proteção por `userId`.

  **Implementação sugerida:**
  - Definir schema de validação para criação/edição (campos mínimos, formato de CEP, limites de string).
  - Implementar `POST`, `PUT` e `DELETE` com filtro obrigatório por `{ id, userId }`.
  - Garantir regra de endereço padrão único por usuário com atualização transacional.

  **Arquivos/áreas afetadas:** `src/app/api/addresses/route.ts`, `src/lib/prisma.ts`, `src/lib/auth.ts`

  **Critérios de aceitação:**
  - [x] Usuário autenticado cria, edita e remove apenas os próprios endereços.
  - [x] Regra de endereço padrão único é mantida sem inconsistência entre registros.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída (2026-03-02)

- [x] **S03-ADR-002** - Integrar CRUD de endereços na tela de perfil (`/perfil`)

  **Descrição curta:**
  - A interface de perfil ainda mostra ações com placeholder (`toast`) para adicionar/editar/remover endereço.
  - A experiência precisa refletir operações reais com feedback de sucesso/erro.

  **Implementação sugerida:**
  - Adicionar formulário/modal para criação e edição com estado controlado e validação de cliente.
  - Conectar botões de `Add New`, `Edit` e `Remove` às rotas da API de endereços.
  - Recarregar lista e endereço principal após mutação, mantendo UX sem refresh completo.

  **Arquivos/áreas afetadas:** `src/components/profile/profile-page-content.tsx`, `src/components/profile/*` (novo, se necessário)

  **Critérios de aceitação:**
  - [x] Usuário executa criação, edição e remoção de endereço sem fallback para placeholder.
  - [x] Estado da UI permanece consistente após mutações (lista, default, loading e erro).

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 6h  
  **Dependências:** S03-ADR-001  
  **Status:** ✅ Concluída (2026-03-02)

#### ADR.2 - Consumo de endereço no checkout

- [x] **S03-ADR-003** - Conectar endereço padrão/selecionado ao fluxo de checkout

  **Descrição curta:**
  - Checkout já aceita `addressId`, mas a experiência de seleção e fallback precisa ser consolidada com os dados do perfil.
  - Garantir que endereço inválido/inacessível seja tratado com resposta previsível e UX acionável.

  **Implementação sugerida:**
  - Carregar endereços do usuário no checkout e selecionar padrão automaticamente.
  - Permitir troca de endereço sem quebrar payload do `POST /api/checkout`.
  - Tratar `400/404` de endereço com mensagem clara e ação de recuperação.

  **Arquivos/áreas afetadas:** `src/app/checkout/page.tsx`, `src/hooks/useCheckout.ts`, `src/hooks/useCheckout.helpers.ts`

  **Critérios de aceitação:**
  - [x] Checkout usa endereço válido do usuário e envia `addressId` correto para API.
  - [x] Erro de endereço não interrompe a navegação com estado inconsistente.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S03-ADR-001, S03-ADR-002  
  **Status:** ✅ Concluída (2026-03-02)

### 📦 Navegação e convergência de rotas - Compatibilidade legada sem fricção

#### Objetivo

Padronizar rotas canônicas de compra/pedido e reduzir quebra em links antigos compartilhados. A categoria cobre alias de rota, ajuste de navegação e consistência de redirecionamentos.

#### NAV.1 - Alias e consistência de carrinho/pedido

- [x] **S03-NAV-001** - Implementar compatibilidade explícita de `/cart` para `/carrinho`

  **Descrição curta:**
  - Links legados para `/cart` ainda podem existir fora da aplicação e causar 404.
  - Criar ponte canônica evita regressão de navegação em campanhas, docs e bookmarks antigos.

  **Implementação sugerida:**
  - Criar rota top-level `/cart` apenas para redirecionar para `/carrinho` preservando querystring.
  - Ajustar middleware para cobrir proteção de auth na rota legada quando aplicável.
  - Garantir semântica de redirecionamento estável para uso em produção.

  **Arquivos/áreas afetadas:** `src/app/cart/page.tsx` (novo), `src/middleware.ts`

  **Critérios de aceitação:**
  - [x] Acessar `/cart` sempre redireciona para `/carrinho` mantendo parâmetros.
  - [x] Fluxo autenticado/anônimo continua com comportamento consistente de proteção.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 2h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída (2026-03-04)

- [ ] **S03-NAV-002** - Auditar e corrigir pontos de navegação entre rotas legadas e canônicas

  **Descrição curta:**
  - A aplicação convive com rotas legadas por `slug` e rotas top-level canônicas.
  - É necessário reduzir divergência em links internos e ações de retorno.

  **Implementação sugerida:**
  - Revisar componentes/hook de navegação para remover hardcodes conflitantes.
  - Padronizar destino de CTAs de carrinho/produtos/pedido para rotas canônicas.
  - Manter redirecionamento legados com fallback previsível.

  **Arquivos/áreas afetadas:** `src/components/layout/app-chrome.tsx`, `src/components/home/home-data.ts`, `src/hooks/useAddToCart.ts`, `src/app/[slug]/**/page.tsx`

  **Critérios de aceitação:**
  - [ ] Menus e CTAs não direcionam para rotas inválidas/inconsistentes.
  - [ ] Rotas legadas continuam funcionando apenas como ponte para a canônica equivalente.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S03-NAV-001  
  **Status:** 🔴 Pendente

- [ ] **S03-NAV-003** - Padronizar redirects de sucesso/falha de pedido e callback auth

  **Descrição curta:**
  - Fluxos de `orders/success` e `orders/failure` já possuem regras de segurança, mas precisam convergir para destino canônico único.
  - Objetivo é reduzir comportamento divergente em callback de login e fallback de erro.

  **Implementação sugerida:**
  - Revisar construção de `callbackUrl` e fallback em `orders/success` e `orders/failure`.
  - Garantir preservação de `session_id` e parâmetros relevantes no redirecionamento.
  - Unificar mensagens e destino final em cenários de `401/404` sem vazamento de detalhes.

  **Arquivos/áreas afetadas:** `src/app/orders/success/page.tsx`, `src/app/orders/failure/page.tsx`, `src/components/auth/AuthButton.tsx`, `src/app/orders/__tests__/page.integration.test.ts`

  **Critérios de aceitação:**
  - [ ] Redirecionamentos de sucesso/falha seguem rota canônica e preservam contexto necessário.
  - [ ] Usuário sem sessão é direcionado para auth com callback válido e sem loop.

  **Prioridade:** 🟢 Média  
  **Estimativa:** 3h  
  **Dependências:** S03-NAV-002  
  **Status:** 🔴 Pendente

### 📦 Admin remove-bg seguro e funcional - Endpoint dedicado com acesso controlado

#### Objetivo

Corrigir o fluxo administrativo de remoção de fundo para usar endpoint dedicado, sem segredo no cliente e com validação de acesso. Esta categoria endereça tanto segurança quanto funcionalidade de persistência das imagens processadas.

#### RBG.1 - Endpoint administrativo e hardening de segurança

- [ ] **S03-RBG-001** - Criar endpoint dedicado para remove-bg administrativo com autorização explícita

  **Descrição curta:**
  - O fluxo atual da página admin não usa endpoint específico para operação administrativa.
  - É necessário separar API pública de API administrativa e reforçar controle de acesso.

  **Implementação sugerida:**
  - Criar rota administrativa dedicada (`/api/admin/remove-bg`) com guarda de sessão/role.
  - Restringir operação a usuários autorizados e retornar `401/403` quando aplicável.
  - Padronizar erros operacionais sem exposição de stack ou segredo.

  **Arquivos/áreas afetadas:** `src/app/api/admin/remove-bg/route.ts` (novo), `src/middleware.ts`, `src/lib/auth.ts`

  **Critérios de aceitação:**
  - [ ] Usuário sem privilégio administrativo não processa remove-bg.
  - [ ] Endpoint administrativo responde de forma segura e previsível em erro.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** nenhuma  
  **Status:** 🔴 Pendente

- [ ] **S03-RBG-002** - Remover `apiKey` do payload cliente e aplicar allowlist de origem de imagem

  **Descrição curta:**
  - Hoje `POST/PUT /api/remove-bg` aceitam `apiKey` no body, o que expõe segredo e amplia superfície de abuso.
  - A chave deve ficar estritamente no servidor, com validação de origem de imagem.

  **Implementação sugerida:**
  - Migrar uso da chave para variável de ambiente no servidor.
  - Bloquear URLs não confiáveis (allowlist de host/protocolo) antes de download/processamento.
  - Atualizar cliente para não enviar `apiKey`.

  **Arquivos/áreas afetadas:** `src/app/api/remove-bg/route.ts`, `src/hooks/useRemoveBg.ts`, `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md`

  **Critérios de aceitação:**
  - [ ] Requisição cliente não envia segredo de remove-bg no payload.
  - [ ] Endpoint rejeita origem de imagem fora da allowlist definida.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** S03-RBG-001  
  **Status:** 🔴 Pendente

- [ ] **S03-RBG-003** - Corrigir persistência de imagens processadas no fluxo admin

  **Descrição curta:**
  - A página `/${slug}/admin/remove-bg` consulta e persiste em `/api/products/${slug}` com `PUT`, fluxo incompatível com a API atual.
  - É necessário alinhar leitura/atualização de produto para salvar imagens processadas corretamente.

  **Implementação sugerida:**
  - Criar/ajustar endpoint de atualização de imagens de produto para uso administrativo.
  - Atualizar página admin para consumir contrato real da API.
  - Recarregar lista de produtos após persistência com feedback de sucesso/erro.

  **Arquivos/áreas afetadas:** `src/app/[slug]/admin/remove-bg/page.tsx`, `src/app/api/products/[productId]/route.ts` (ou rota admin dedicada), `src/components/RemoveBgProcessor.tsx`

  **Critérios de aceitação:**
  - [ ] Imagens processadas são persistidas no produto correto sem 404/405.
  - [ ] Fluxo admin exibe retorno consistente e atualiza estado após salvar.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S03-RBG-001, S03-RBG-002  
  **Status:** 🔴 Pendente

### 📦 Testes, homologação e governança - Liberação segura da Sprint 03

#### Objetivo

Assegurar cobertura mínima automatizada e validação operacional antes de go-live das mudanças de conta/pedido. A categoria fecha riscos de regressão com foco em CRUD de endereços, navegação e remove-bg administrativo.

#### QA.1 - Cobertura crítica e operação controlada

- [ ] **S03-QA-001** - Cobrir integração da API de endereços (auth, CRUD e default)

  **Descrição curta:**
  - Garantir que endpoints de endereço não sofram regressão de ownership e validação.
  - Cobrir comportamento de endereço padrão após mutações.

  **Implementação sugerida:**
  - Criar suíte de integração para `GET/POST/PUT/DELETE /api/addresses`.
  - Validar cenários de autenticado, não autenticado e não-owner.
  - Cobrir transições de default com consistência de dados.

  **Arquivos/áreas afetadas:** `src/app/api/addresses/__tests__/route.integration.test.ts` (novo), `src/app/api/addresses/route.ts`

  **Critérios de aceitação:**
  - [ ] API de endereços falha com segurança para acessos não autorizados.
  - [ ] Mutações válidas atualizam estado esperado sem inconsistência de default.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 4h  
  **Dependências:** S03-ADR-001  
  **Status:** 🔴 Pendente

- [ ] **S03-QA-002** - Cobrir navegação canônica e fluxo admin remove-bg em integração

  **Descrição curta:**
  - Validar redirects de rotas legadas (`/cart`, `/${slug}/...`) para canônicas.
  - Cobrir bloqueio de acesso e contrato do endpoint admin remove-bg.

  **Implementação sugerida:**
  - Adicionar testes de página/integração para redirect de carrinho e sucesso/falha de pedido.
  - Criar cenários de autorização para endpoint admin remove-bg.
  - Validar comportamento estável para erros previsíveis (`401/403/404`).

  **Arquivos/áreas afetadas:** `src/app/orders/__tests__/page.integration.test.ts`, `src/app/api/admin/remove-bg/__tests__/route.integration.test.ts` (novo), `src/app/cart/page.tsx` (novo)

  **Critérios de aceitação:**
  - [ ] Redirecionamentos de navegação são estáveis em cenários autenticado/anônimo.
  - [ ] Endpoint admin remove-bg é bloqueado para perfil não autorizado.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S03-NAV-001, S03-NAV-003, S03-RBG-001  
  **Status:** 🔴 Pendente

- [ ] **S03-QA-003** - Checklist manual de homologação e plano de rollback da Sprint 03

  **Descrição curta:**
  - Formalizar validações manuais de staging para perfil/endereço, navegação e admin remove-bg.
  - Definir rollback rápido para regressão em CRUD de endereço e rota administrativa.

  **Implementação sugerida:**
  - Criar checklist com cenários de criação/edição/remoção de endereço, `/cart` -> `/carrinho` e remove-bg admin.
  - Definir gatilhos e passos operacionais de rollback com responsáveis.
  - Registrar evidências no log técnico da sprint.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-03-experiencia-conta-pedido.md`, `docs/development/tasks/PHASE-03-experiencia-conta-pedido.md`, `docs/ROADMAP/Logs/S03-QA-003.md` (novo)

  **Critérios de aceitação:**
  - [ ] Checklist executado com evidências de resultado.
  - [ ] Plano de rollback validado com time responsável.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S03-QA-001, S03-QA-002  
  **Status:** 🔴 Pendente

---

## 🧪 Testes e Validações

- **Suites necessárias:** Integração de API (`addresses`, `admin/remove-bg`, `orders redirects`), regressão de páginas (`/perfil`, `/checkout`, `/orders`, `/cart`), homologação manual E2E.
- **Cobertura alvo:** 100% dos cenários P1/P2 da Sprint 03 cobertos (automatizado + manual).
- **Comandos de verificação:** `npm run test:integration`, `npm run lint`, `npm run build`.
- **Estado atual:** 🟡 Execução técnica em andamento; `S03-ADR-001`, `S03-ADR-002` e `S03-ADR-003` concluídas com validações de lint/build e integração.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/development/TASKS.md` com status da Fase 03 quando arquivo índice existir.
- Atualizar `docs/development/CHANGELOG.md` com entregas de experiência de conta/pedido (quando criado).
- Documentar ajustes de API de endereços e remove-bg em `docs/01-analise-aplicacao/03-rotas-ui-api.md`.
- Registrar evidências de execução por task em `docs/ROADMAP/Logs/S03-*.md`.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas da Fase 03 marcadas como concluídas.
- [ ] Migrations Prisma aplicadas e versionadas (se houver mudanças de schema para endereços).
- [ ] Validações `npm run test:integration`, `npm run lint` e `npm run build` executadas com sucesso.
- [ ] Fluxos de endereço, navegação canônica e admin remove-bg validados em homologação.
- [ ] Evidências e logs técnicos da Sprint 03 registrados em `docs/ROADMAP/Logs`.
- [ ] Aprovação final da Sprint 03 registrada pelo time responsável.
