# Sprint 06 - Painel Admin e Operacao

## Objetivo

Entregar o primeiro painel administrativo da aplicacao (dashboard + operacao) com controle de acesso por papel e trilha de auditoria.

## Etapa 1 - Discovery

- Definir personas e permissoes:
  - `SUPER_ADMIN` (visao global);
  - `STORE_ADMIN` (visao por loja).
- Levantar fluxos operacionais prioritarios:
  - monitoramento de pedidos e pagamentos;
  - gestao de produtos/imagens/estoque;
  - visao de clientes e ocorrencias.
- Definir indicadores minimos do dashboard para operacao diaria.

## Etapa 2 - Design

- Definir IA e navegacao de painel:
  - `/admin`.
- Definir matriz de autorizacao (RBAC) por recurso e acao.
- Definir contratos das APIs admin com filtros, paginacao e ordenacao.
- Definir modelo de auditoria para acoes sensiveis (quem, quando, antes/depois).

## Etapa 3 - Implementacao

- Criar shell do painel com guard de autenticacao/autorizacao.
- Dashboard MVP com KPIs:
  - pedidos por status;
  - taxa de pagamento aprovado;
  - receita bruta por janela;
  - produtos com estoque baixo.
- Modulo de pedidos:
  - listagem com filtros;
  - detalhe com historico;
  - acao operacional permitida por papel.
- Modulo de catalogo:
  - CRUD de produto/categoria;
  - gestao de imagem;
  - ajuste de estoque.
- Modulo de clientes:
  - busca por email/nome;
  - visao de historico basico de pedidos.
- Registrar trilha de auditoria para alteracoes administrativas.

### Progresso atual

- ✅ `S06-ACC-001` entregou o guard de `/admin` em middleware + layout server-side.
- ✅ `S06-ACC-002` entregou RBAC uniforme para `/api/admin/**`.
- ✅ `S06-ACC-003` consolidou isolamento multi-store nos endpoints administrativos.
- ✅ `S06-DSH-001` entregou o contrato de KPIs e o endpoint `GET /api/admin/dashboard`.
- ✅ `S06-DSH-002` entregou o shell administrativo em `/admin`, com contexto global/loja, breadcrumbs, links estáveis para `orders`, `catalog`, `customers` e `audit`, além do isolamento do chrome público para o painel.
- ✅ `S06-DSH-003` consumiu as métricas no dashboard com cards de KPI, comparativos por janela e fallback consistente para loading, empty e error.
- ✅ `S06-OPS-001` entregou o módulo operacional de pedidos com listagem filtrável, detalhe seguro e atualização de status interno com RBAC e escopo por loja.
- 🔄 Próxima entrega: `S06-OPS-002` para abrir o módulo operacional de catálogo no painel.

## Etapa 4 - Testes e homologacao (S06-ADM-003)

- Testes de integracao para RBAC em todos os endpoints admin.
- Testes E2E para os fluxos criticos do painel (dashboard, pedidos, catalogo).
- Smoke manual com perfil sem permissao para garantir `403/404` corretos.
- Janela recomendada de deploy: dias uteis 10:00-12:00 (America/Sao_Paulo), com monitoramento por 90 minutos.

### Checklist manual de homologacao (S06-ADM-003)

| Cenario                                  | Resultado esperado                      | Evidencia tecnica                                                                                                                                                                                                  | Status |
| ---------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| Usuario sem papel admin acessa painel    | Acesso negado com contrato consistente  | `docs/ROADMAP/Logs/S06-ACC-001.md`, `docs/ROADMAP/Logs/S06-ADM-002.md`, suites `src/app/admin/__tests__/layout.integration.test.ts` e `src/app/api/admin/**/__tests__/*.integration.test.ts`                       | [x]    |
| Dashboard com indicadores da loja        | KPIs carregam sem vazamento cross-store | `docs/ROADMAP/Logs/S06-DSH-001.md`, `docs/ROADMAP/Logs/S06-DSH-003.md`, `docs/ROADMAP/Logs/S06-ADM-002.md`, `npm run build`                                                                                        | [x]    |
| Atualizacao de produto/estoque no painel | Alteracao persistida e auditada         | `docs/ROADMAP/Logs/S06-OPS-002.md`, `docs/ROADMAP/Logs/S06-OPS-003.md`, suites `src/app/api/admin/products/**/__tests__/*.integration.test.ts` e `src/app/api/admin/categories/**/__tests__/*.integration.test.ts` | [x]    |
| Operacao em pedido via painel            | Acao valida atualiza estado e historico | `docs/ROADMAP/Logs/S06-OPS-001.md`, `docs/ROADMAP/Logs/S06-OPS-003.md`, suite `src/app/api/admin/orders/[orderId]/__tests__/route.integration.test.ts`, `docs/ROADMAP/Logs/S06-ADM-002.md`                         | [x]    |

### Plano de rollback (S06-ADM-003)

- **RTO alvo:** ate 20 minutos apos decisao de rollback.
- **Gatilhos:**
  - bypass de RBAC;
  - alteracao administrativa sem auditoria em `admin_audit_logs`;
  - impacto em fluxo publico de compra;
  - regressao persistente em `/admin`, `/api/admin/dashboard`, `/api/admin/orders` ou `/api/admin/products` apos release.
- **Passos de rollback:**
  1. Aplicar contencao imediata da UI administrativa via `APP_MAINTENANCE_ROUTES=/admin` quando for necessario interromper acesso enquanto a reversao principal nao entra em producao.
  2. Reverter a release para a versao estavel anterior, restaurando o conjunto `/admin` + `/api/admin/**` conhecido como saudavel.
  3. Validar smoke pos-reversao em fluxo publico (`/`, `/produto`, `/carrinho`, `/checkout`) e em smoke admin minimo (`/admin`, `/api/admin/dashboard`, `/api/admin/orders`).
  4. Confirmar integridade da trilha de auditoria e ausencia de mutacoes administrativas orfas na janela do incidente.
  5. Registrar incidente, causa raiz e acao corretiva no log da sprint.
- **Responsaveis:** engenharia fullstack, QA e produto.
- **Observacao operacional:** o repositorio nao possui feature flag dedicada para o painel admin; `APP_MAINTENANCE_ROUTES=/admin` cobre apenas contencao temporaria da UI, enquanto o rollback efetivo depende da reversao da release estavel.

### Decisao final da janela de homologacao

- **Decisao:** `GO`
- **Janela de homologacao:** 2026-03-18 (America/Sao_Paulo)
- **Evidencias consolidadas:** `docs/ROADMAP/Logs/S06-ACC-001.md`, `docs/ROADMAP/Logs/S06-DSH-003.md`, `docs/ROADMAP/Logs/S06-OPS-001.md`, `docs/ROADMAP/Logs/S06-OPS-002.md`, `docs/ROADMAP/Logs/S06-OPS-003.md`, `docs/ROADMAP/Logs/S06-ADM-002.md`, `docs/ROADMAP/Logs/S06-ADM-003.md`
- **Validacao operacional:** `npm run lint` e `npm run build` concluidos sem regressao, com cobertura critica previa documentada nas tasks dependentes.

## Criterios de aceite

- Painel administrativo operacional em `/admin`.
- RBAC aplicado em UI e API com cobertura automatizada.
- Dashboard com KPIs minimos de operacao.
- Modulos de pedidos e catalogo funcionais para operacao diaria.
- Trilha de auditoria para acoes sensiveis habilitada.
