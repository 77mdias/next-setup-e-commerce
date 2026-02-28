# 🚀 Tasks - Fase 01: Fundacao de Seguranca

**Status:** 🟢 ATIVA
**Última atualização:** 2026-02-28
**Sprint Atual:** Sprint 01
**Status Geral:** 🟡 92% (11/12 tarefas completas) - FASE ATIVA
**ETA:** 1 sprint (5-7 dias uteis)
**Pré-requisito:** Backlog priorizado Sprint 01 (✅ definido)

---

## 📊 Resumo de Progresso

| Categoria                     | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| ----------------------------- | ------ | --------- | ------------ | -------- | --------- |
| Checkout server-authoritative | 4      | 3         | 0            | 1        | 0         |
| Autorização de pedidos        | 3      | 3         | 0            | 0        | 0         |
| Stripe hardening e dados      | 3      | 3         | 0            | 0        | 0         |
| Testes, rollout e governança  | 2      | 2         | 0            | 0        | 0         |
| **TOTAL**                     | **12** | **11**    | **0**        | **1**    | **0**     |

### 🎯 Principais Indicadores

- ✅ Escopo P0 fechado em 4 frentes críticas (checkout, orders/session, test-stripe, IDs Stripe).
- ✅ Sequência de execução definida por dependência técnica.
- ⚠️ Risco principal: task crítica `S01-CHK-002` ainda pendente para concluir recalculo canônico de preço no backend.

---

## 🎯 Objetivos da Fase

- Eliminar manipulação de preço/total via payload do cliente no fluxo de checkout.
- Garantir que consulta de pedido por sessão Stripe só funcione para usuário autenticado e dono do pedido.
- Bloquear o endpoint de teste Stripe em produção e reduzir exposição operacional em ambientes não-dev.
- Separar IDs Stripe de sessão de checkout e payment intent para evitar inconsistências de rastreabilidade.
- Ajustar front-end de sucesso/falha para tratar respostas 401/403 sem vazamento de dados.
- Implantar validações de regressão (lint/build + testes de integração/manual) antes de liberar.
- Registrar evidências técnicas e operacionais para handoff seguro.

---

## 📦 Estrutura de Categorias

### 📦 Checkout server-authoritative - Integridade de preço e itens

#### Objetivo

Remover a confiança em valores vindos do cliente no endpoint de checkout. O servidor deve recalcular subtotal, frete e total com base em dados persistidos e validar rigorosamente produto, estoque mínimo, loja e quantidade.

#### CHK.1 - Contrato de entrada e validação sem preço do cliente

- [x] **S01-CHK-001** - Redefinir payload aceito em `POST /api/checkout`

  **Descrição curta:**
  - Trocar contrato para `{ storeId, items: [{ productId, quantity, variantId? }], addressId, shippingMethod }`.
  - Remover dependência de `item.price`, `item.name` e outros campos sensíveis enviados pelo cliente.

  **Implementação sugerida:**
  - Criar schema de validação (Zod) para payload mínimo necessário.
  - Rejeitar requisições com campos inválidos/quantidades não positivas.
  - Normalizar mensagens de erro com status 400.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/route.ts`, `src/hooks/useCheckout.ts`, `src/app/[slug]/checkout/page.tsx`

  **Critérios de aceitação:**
  - [x] Enviar `price` adulterado no payload não altera valor final do pedido.
  - [x] Payload inválido retorna 400 com erro claro e sem stack exposta.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 4h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída

- [ ] **S01-CHK-002** - Recalcular preços no servidor com dados canônicos

  **Descrição curta:**
  - Buscar produtos/variações no banco por ID e recalcular `unitPrice`, `subtotal`, `shippingFee` e `total`.
  - Garantir vínculo entre `storeId` e produtos selecionados.

  **Implementação sugerida:**
  - Carregar produtos por lista de IDs com `select` mínimo.
  - Validar existência, disponibilidade e vínculo com loja.
  - Montar `line_items` Stripe usando preço do banco (centavos).

  **Arquivos/áreas afetadas:** `src/app/api/checkout/route.ts`, `src/lib/stripe-config.ts`

  **Critérios de aceitação:**
  - [ ] Totais do pedido sempre derivados de dados do banco.
  - [ ] Produto inválido/inativo/fora da loja retorna 400/404 e não cria pedido.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S01-CHK-001  
  **Status:** 🔴 Pendente

#### CHK.2 - Persistência confiável de pedido

- [x] **S01-CHK-003** - Persistir `OrderItem` apenas com snapshot do servidor

  **Descrição curta:**
  - Persistir nome, imagem, preço unitário e total por item exclusivamente a partir dos dados canônicos do backend.
  - Evitar criação de pedido com dados inconsistentes de cliente.

  **Implementação sugerida:**
  - Substituir mapping atual baseado em `items` do request por mapping de produtos carregados do banco.
  - Garantir cálculo de `totalPrice = unitPrice * quantity` no servidor.
  - Consolidar transação `order + items` com rollback em falha.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/route.ts`

  **Critérios de aceitação:**
  - [x] `order_items.unitPrice` nunca depende de campo enviado pelo cliente.
  - [x] Falha parcial não deixa pedido órfão/inconsistente.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** S01-CHK-002  
  **Status:** 🟢 Concluída

- [x] **S01-CHK-004** - Ajustar consumidor frontend para novo contrato

  **Descrição curta:**
  - Atualizar hook e páginas para enviar apenas IDs/quantidade/endereço no checkout.
  - Validar UX de erro quando backend rejeitar item.

  **Implementação sugerida:**
  - Refatorar montagem de `checkoutData` em `useCheckout`.
  - Ajustar tratamento de resposta 400/404/409 com mensagem acionável.
  - Validar fluxo em `/[slug]/checkout` e fallback em `/checkout`.

  **Arquivos/áreas afetadas:** `src/hooks/useCheckout.ts`, `src/app/[slug]/checkout/page.tsx`, `src/app/checkout/page.tsx`

  **Critérios de aceitação:**
  - [x] Frontend envia payload compatível com novo contrato.
  - [x] Erros de validação aparecem sem quebrar navegação.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S01-CHK-001  
  **Status:** 🟢 Concluída

### 📦 Autorização de pedidos - Proteção de dados pós-checkout

#### Objetivo

Garantir que o endpoint `/api/orders/session/[sessionId]` não vaze dados para usuários anônimos nem para usuários autenticados não proprietários do pedido.

#### ORD.1 - Auth obrigatória e ownership

- [x] **S01-ORD-001** - Exigir autenticação obrigatória em `/api/orders/session/[sessionId]`

  **Descrição curta:**
  - Hoje o endpoint permite busca sem sessão ativa por ausência de filtro obrigatório de usuário.
  - Ajustar para retornar 401 quando não houver sessão autenticada.

  **Implementação sugerida:**
  - Inserir guarda inicial `if (!session?.user?.id) return 401`.
  - Remover lógica condicional que relaxa `where.userId` quando sessão é nula.
  - Padronizar resposta de erro para não indicar existência do pedido.

  **Arquivos/áreas afetadas:** `src/app/api/orders/session/[sessionId]/route.ts`

  **Critérios de aceitação:**
  - [x] Requisição sem login sempre retorna 401.
  - [x] Não há resposta com dados de pedido para anônimos.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 2h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída

- [x] **S01-ORD-002** - Endurecer consulta e resposta para evitar enumeração

  **Descrição curta:**
  - Garantir que busca use filtro estrito por `sessionId + userId`.
  - Evitar logs e mensagens que confirmem existência de pedidos de terceiros.

  **Implementação sugerida:**
  - Ajustar query para `findFirst({ where: { stripeCheckoutSessionId, userId }})` após migração Stripe.
  - Reduzir logs sensíveis (`orderId`, `sessionUserId`, debug de lista completa).
  - Manter 404 genérico quando não encontrar registro autorizado.

  **Arquivos/áreas afetadas:** `src/app/api/orders/session/[sessionId]/route.ts`

  **Critérios de aceitação:**
  - [x] Usuário autenticado não acessa pedido de outro usuário.
  - [x] Logs de produção não expõem IDs sensíveis desnecessários.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 3h  
  **Dependências:** S01-ORD-001, S01-STR-002  
  **Status:** ✅ Concluída

- [x] **S01-ORD-003** - Ajustar páginas de sucesso/falha para estados 401/403/404

  **Descrição curta:**
  - Tratar retorno do endpoint sem loop de redirecionamento ou tela inconsistente.
  - Exibir mensagem segura ao usuário quando pedido não estiver acessível.

  **Implementação sugerida:**
  - Atualizar fetch/erro em `pedido/sucesso` e `pedido/falha`.
  - Diferenciar UX para sessão expirada (solicitar login) vs pedido não encontrado.
  - Garantir preservação de `session_id` ao redirecionar para login.

  **Arquivos/áreas afetadas:** `src/app/[slug]/pedido/sucesso/page.tsx`, `src/app/[slug]/pedido/falha/page.tsx`

  **Critérios de aceitação:**
  - [x] Usuário sem sessão é direcionado para login sem quebrar fluxo.
  - [x] Tela de falha/sucesso não mostra erro técnico bruto.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S01-ORD-001  
  **Status:** ✅ Concluída

### 📦 Stripe hardening e dados - Separação de IDs e endpoint de teste

#### Objetivo

Separar tecnicamente `checkoutSessionId` e `paymentIntentId` no domínio de pedido/pagamento, eliminando ambiguidades. Paralelamente, impedir uso indevido de `/api/test-stripe` em produção.

#### STR.1 - Modelo e migração de dados

- [x] **S01-STR-001** - Introduzir campos Stripe separados no modelo `Order`

  **Descrição curta:**
  - Criar `stripeCheckoutSessionId` e `stripePaymentIntentId`.
  - Planejar migração/backfill a partir de `stripePaymentId` legado.

  **Implementação sugerida:**
  - Atualizar `prisma/schema.prisma` com novos campos (e índice quando aplicável).
  - Criar migration com estratégia de transição sem downtime lógico.
  - Definir regra de compatibilidade temporária durante rollout.

  **Arquivos/áreas afetadas:** `prisma/schema.prisma`, `prisma/migrations/*`

  **Critérios de aceitação:**
  - [x] Schema compila e migration aplica sem perda de dados.
  - [x] Campos legados e novos coexistem durante transição controlada.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 4h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída

- [x] **S01-STR-002** - Atualizar checkout e webhook para gravar IDs corretos

  **Descrição curta:**
  - `checkout` deve salvar `stripeCheckoutSessionId`.
  - `webhook` deve salvar `stripePaymentIntentId` e refletir pagamento no pedido.

  **Implementação sugerida:**
  - Atualizar `POST /api/checkout` para persistir ID de sessão em campo dedicado.
  - Atualizar `POST /api/webhooks/stripe` para ler metadata e salvar payment intent no campo correto.
  - Ajustar lookup de pedido por sessão para o novo campo.

  **Arquivos/áreas afetadas:** `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/orders/session/[sessionId]/route.ts`

  **Critérios de aceitação:**
  - [x] Fluxo sucesso/falha localiza pedido corretamente por `session_id`.
  - [x] Payment intent fica registrado separadamente para conciliação.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** S01-STR-001, S01-CHK-003  
  **Status:** ✅ Concluída

#### STR.2 - Restrição operacional de endpoint de teste

- [x] **S01-STR-003** - Desativar/restringir `/api/test-stripe` fora de desenvolvimento

  **Descrição curta:**
  - Endpoint de teste não deve ficar disponível publicamente em produção.
  - Permitir uso apenas em desenvolvimento local (ou sob chave interna explícita).

  **Implementação sugerida:**
  - Bloquear quando `NODE_ENV === "production"` com 404/403.
  - Opcional: exigir token interno (`X-Internal-Debug-Key`) em staging.
  - Registrar no README de operações quando e como usar.

  **Arquivos/áreas afetadas:** `src/app/api/test-stripe/route.ts`, `README.md` (seção de operações)

  **Critérios de aceitação:**
  - [x] Em produção, endpoint retorna bloqueio e não cria sessão Stripe.
  - [x] Em dev, fluxo de diagnóstico permanece funcional.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 2h  
  **Dependências:** nenhuma  
  **Status:** ✅ Concluída

### 📦 Testes, rollout e governança - Garantia de entrega

#### Objetivo

Estabelecer validação mínima para liberar Sprint 01 sem regressões críticas no pagamento e no acesso a pedidos.

#### QA.1 - Validação técnica e liberação controlada

- [x] **S01-QA-001** - Criar suíte de integração mínima para checkout e order-session

  **Descrição curta:**
  - Cobrir cenários críticos de segurança e integridade de pedido.
  - Executar validação antes de merge/deploy.

  **Implementação sugerida:**
  - Definir framework de teste de API (ex.: Vitest/Jest + supertest).
  - Cobrir casos: payload adulterado, anônimo em order session, owner válido, owner inválido.
  - Integrar comando de execução no pipeline local.

  **Arquivos/áreas afetadas:** `src/app/api/**/__tests__/*` (novo), `package.json`

  **Critérios de aceitação:**
  - [x] Casos críticos P0 com testes automatizados executáveis.
  - [x] Falha de segurança quebra execução da suíte.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 8h  
  **Dependências:** S01-CHK-002, S01-ORD-001, S01-STR-002  
  **Status:** ✅ Concluída

- [x] **S01-QA-002** - Checklist manual de homologação e plano de rollback

  **Descrição curta:**
  - Formalizar validações manuais para ambiente de staging antes de produção.
  - Definir ação rápida em caso de erro no fluxo de pagamento.

  **Implementação sugerida:**
  - Criar checklist de ponta a ponta (sucesso/falha/expiração webhook).
  - Definir rollback lógico (feature flag ou reversão de deploy).
  - Registrar responsáveis e janela de deploy.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-01-fundacao-seguranca.md`, `docs/ROADMAP/Logs/S01-QA-002.md`, `docs/development/tasks/PHASE-01-fundacao-seguranca.md`

  **Critérios de aceitação:**
  - [x] Checklist executado com evidências de resultado.
  - [x] Plano de rollback validado com time responsável.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S01-CHK-004, S01-ORD-003, S01-STR-003  
  **Status:** ✅ Concluída

---

## 🧪 Testes e Validações

- **Suites necessárias:** Integração de API (checkout, orders/session, webhook), regressão manual E2E do fluxo de compra.
- **Cobertura alvo:** 100% dos cenários P0 da Sprint 01 cobertos (automatizado + manual).
- **Comandos de verificação:** `npm run lint`, `npm run build`.
- **Comandos recomendados (após criar suíte):** `npm run test:integration`.
- **Estado atual:** ✅ Suíte automatizada de integração configurada e executável via `npm run test:integration`.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/development/TASKS.md` com status da Fase 01 quando arquivo índice existir.
- Atualizar `docs/development/CHANGELOG.md` com entregas de segurança (quando criado).
- Documentar mudanças de schema/migration em `docs/01-analise-aplicacao/02-dados-e-banco.md`.
- Registrar decisão de hardening Stripe em `docs/03-seguranca-governanca/01-hardening-backlog.md`.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas críticas (🔴) concluídas e revisadas.
- [ ] Migration Prisma aplicada e versionada.
- [x] Validações `lint` e `build` executadas com sucesso.
- [x] Fluxo completo de pagamento (sucesso/falha) validado em homologação.
- [x] Endpoint `/api/test-stripe` bloqueado em produção.
- [x] Endpoint `/api/orders/session/[sessionId]` exige autenticação e ownership.
- [x] Evidências e changelog técnico registrados na pasta `docs/ROADMAP/Logs`.
