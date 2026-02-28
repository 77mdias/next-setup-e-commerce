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
- Responsaveis por liberacao: engenharia backend, QA e produto.
- Janela de deploy recomendada: dias uteis das 10:00 as 12:00 (America/Sao_Paulo), com monitoramento por 60 minutos apos release.

### Checklist manual de homologacao (S01-QA-002)

| Cenario | Resultado esperado | Evidencia registrada | Status |
| --- | --- | --- | --- |
| Pagamento aprovado no checkout | Pedido criado e pagina de sucesso retornada sem erro | `docs/ROADMAP/Logs/S01-QA-002.md` (secao "Checklist e evidencias") | ✅ |
| Falha de pagamento | Fluxo de falha exibido sem exposicao de dados sensiveis | `docs/ROADMAP/Logs/S01-QA-002.md` (secao "Checklist e evidencias") | ✅ |
| Atraso/expiracao de webhook | Pedido nao confirmado nao e marcado como pago indevidamente | `docs/ROADMAP/Logs/S01-QA-002.md` (secao "Checklist e evidencias") | ✅ |
| Consulta de pedido por usuario nao owner | Endpoint de consulta retorna 404 sem enumeracao | `docs/ROADMAP/Logs/S01-QA-002.md` (secao "Checklist e evidencias") | ✅ |

### Plano de rollback (S01-QA-002)

- **Gatilhos:** aumento anormal de falhas de checkout, regressao em autenticacao de order-session ou inconsistencias de status de pagamento apos deploy.
- **Passos de rollback:**
  1. Suspender liberacao de novos checkouts (feature flag/pausa operacional temporaria).
  2. Reverter para a release estavel anterior.
  3. Revalidar `lint`, `build` e smoke test de checkout apos reversao.
  4. Comunicar status no canal de incidentes e registrar acao no log da sprint.
- **Responsaveis:** engenharia backend (execucao), QA (revalidacao), produto (comunicacao de janela e impacto).
- **RTO alvo:** ate 15 minutos para restaurar fluxo estavel.

## Criterios de aceite
- Nao e possivel alterar preco via payload do cliente.
- Pedido so pode ser consultado por dono autenticado.
- Endpoint de teste Stripe indisponivel em producao.
- Fluxo sucesso/falha encontra pedido corretamente apos webhook.
- Checklist manual de homologacao e plano de rollback formalizados para go-live.
