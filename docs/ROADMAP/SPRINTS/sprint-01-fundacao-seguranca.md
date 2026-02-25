# Sprint 01 - Fundacao de Seguranca

## Objetivo
Fechar riscos criticos que impedem uso seguro em producao.

## Etapa 1 - Discovery tecnico
- Revisar contratos dos endpoints de checkout e pedidos.
- Mapear impacto em frontend e webhook.

## Etapa 2 - Design tecnico
- Definir novo contrato de checkout: `{ items: [{productId, quantity}], addressId }`.
- Definir politica de acesso para `/api/orders/session/[sessionId]`.
- Definir estrategia para desativar `/api/test-stripe` em producao.

## Etapa 3 - Implementacao
- Recalcular preco/total no backend com dados do banco.
- Validar store/produto/quantidade no servidor.
- Exigir sessao em consulta de pedido por sessao.
- Introduzir campos Stripe separados na tabela `Order`.

## Etapa 4 - Testes e rollout
- Testes de integracao para checkout e consulta de pedido.
- Testes manuais de compra completa.
- Rollout com feature flag se necessario.

## Criterios de aceite
- Nao e possivel alterar preco via payload do cliente.
- Pedido so pode ser consultado por dono autenticado.
- Endpoint de teste Stripe indisponivel em producao.
- Fluxo sucesso/falha encontra pedido corretamente apos webhook.
