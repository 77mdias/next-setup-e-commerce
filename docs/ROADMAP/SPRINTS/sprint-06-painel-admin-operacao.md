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
  - `/admin` (global);
  - `/${slug}/admin` (escopo da loja).
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

## Etapa 4 - Testes e homologacao (S06-ADM-003)

- Testes de integracao para RBAC em todos os endpoints admin.
- Testes E2E para os fluxos criticos do painel (dashboard, pedidos, catalogo).
- Smoke manual com perfil sem permissao para garantir `403/404` corretos.
- Janela recomendada de deploy: dias uteis 10:00-12:00 (America/Sao_Paulo), com monitoramento por 90 minutos.

### Checklist manual de homologacao (S06-ADM-003)

| Cenario | Resultado esperado | Evidencia tecnica | Status |
| --- | --- | --- | --- |
| Usuario sem papel admin acessa painel | Acesso negado com contrato consistente | Suite `src/app/api/admin/**/__tests__/*.integration.test.ts` | [ ] |
| Dashboard com indicadores da loja | KPIs carregam sem vazamento cross-store | Logs + screenshot homologacao | [ ] |
| Atualizacao de produto/estoque no painel | Alteracao persistida e auditada | Suite de catalogo + tabela de auditoria | [ ] |
| Operacao em pedido via painel | Acao valida atualiza estado e historico | Suite de pedidos + smoke manual | [ ] |

### Plano de rollback (S06-ADM-003)

- **RTO alvo:** ate 20 minutos apos decisao de rollback.
- **Gatilhos:**
  - bypass de RBAC;
  - alteracao administrativa sem auditoria;
  - impacto em fluxo publico de compra.
- **Passos de rollback:**
  1. Desativar rotas/paginas do painel por feature flag.
  2. Reverter release para versao estavel anterior.
  3. Validar smoke de compra publica e APIs admin.
  4. Registrar incidente e acao corretiva no log da sprint.
- **Responsaveis:** engenharia fullstack, QA e produto.

## Criterios de aceite

- Painel administrativo operacional em `/admin` e `/${slug}/admin`.
- RBAC aplicado em UI e API com cobertura automatizada.
- Dashboard com KPIs minimos de operacao.
- Modulos de pedidos e catalogo funcionais para operacao diaria.
- Trilha de auditoria para acoes sensiveis habilitada.
