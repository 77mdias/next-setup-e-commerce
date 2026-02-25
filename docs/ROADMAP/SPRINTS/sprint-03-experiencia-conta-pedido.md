# Sprint 03 - Experiencia de Conta e Pedido

## Objetivo
Evoluir a experiencia do usuario logado e reduzir friccao operacional.

## Etapa 1 - Discovery
- Revisar lacunas no perfil (enderecos sem CRUD completo).
- Revisar consistencia entre rotas novas e legadas.

## Etapa 2 - Design
- Definir API de enderecos completa (`GET/POST/PUT/DELETE`).
- Definir estrategia para convergencia de rotas (`/products` vs `/${slug}/product`).

## Etapa 3 - Implementacao
- CRUD de endereco no perfil.
- Correcao de rotas inconsistentes (`/cart` -> `/carrinho`).
- Corrigir fluxo admin remove-bg com endpoint dedicado e protegido.

## Etapa 4 - Testes
- Teste E2E de cadastro/edicao de endereco.
- Teste navegacional de menus e redirecionamentos.

## Criterios de aceite
- Usuario gerencia enderecos sem erro.
- Navegacao de carrinho funciona em todos os menus.
- Area admin remove-bg opera com endpoint correto e controle de acesso.
