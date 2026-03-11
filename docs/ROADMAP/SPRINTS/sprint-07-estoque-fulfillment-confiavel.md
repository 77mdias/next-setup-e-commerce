# Sprint 07 - Estoque e Fulfillment Confiavel

## Objetivo

Eliminar risco de oversell e garantir consistencia de estoque do checkout ao pos-pagamento, com reconciliacao operacional.

## Etapa 1 - Discovery

- Mapear ciclo de estoque atual:
  - leitura no checkout;
  - confirmacao/cancelamento via webhook;
  - ajuste manual.
- Identificar condicoes de concorrencia em compras simultaneas.
- Levantar regras de negocio para reserva, expiracao e devolucao de estoque.

## Etapa 2 - Design

- Definir modelo de reserva de estoque com TTL por item de pedido.
- Definir transacoes atomicas no checkout e no webhook para evitar estado parcial.
- Definir estrategia de compensacao para pagamento falho/expirado.
- Definir job de reconciliacao para detectar e corrigir divergencias.

## Etapa 3 - Implementacao

- Introduzir reserva de estoque no inicio do checkout.
- Converter reserva em baixa definitiva apenas apos confirmacao de pagamento.
- Liberar reserva automaticamente em cancelamento/expiracao/falha.
- Proteger atualizacoes de estoque com lock transacional/concorrencia otimista.
- Expor visao operacional de estoque reservado vs disponivel no painel admin.
- Criar rotina de reconciliacao com relatorio de anomalias.

## Etapa 4 - Testes e homologacao (S07-INV-003)

- Testes de integracao com cenario concorrente (dois checkouts para ultimo item).
- Testes de idempotencia entre webhook e transicoes de estoque.
- Testes de recuperacao apos falha parcial no fluxo de pagamento.
- Janela recomendada de deploy: dias uteis 10:00-12:00 (America/Sao_Paulo), com monitoramento por 90 minutos.

### Checklist manual de homologacao (S07-INV-003)

| Cenario | Resultado esperado | Evidencia tecnica | Status |
| --- | --- | --- | --- |
| Dois compradores para ultimo item | Apenas um pedido confirma pagamento; outro e bloqueado ou cancelado sem venda indevida | Suite de concorrencia de checkout/webhook | [ ] |
| Pagamento falho apos reserva | Reserva e liberada sem estoque negativo | Suite de falha/compensacao + logs | [ ] |
| Webhook duplicado | Nao ha baixa dupla de estoque | Suite de idempotencia webhook | [ ] |
| Reconciliacao operacional | Divergencias detectadas e reportadas | Job de reconciliacao + relatorio | [ ] |

### Plano de rollback (S07-INV-003)

- **RTO alvo:** ate 25 minutos apos decisao de rollback.
- **Gatilhos:**
  - estoque negativo;
  - baixa duplicada;
  - bloqueio indevido de checkout em massa.
- **Passos de rollback:**
  1. Congelar alteracoes de estoque via admin temporariamente.
  2. Reverter release para versao estavel anterior.
  3. Rodar reconciliacao emergencial para corrigir divergencias abertas.
  4. Executar smoke completo de checkout e webhook.
  5. Registrar incidente e plano de prevencao.
- **Responsaveis:** engenharia backend/commerce, QA e operacao.

## Criterios de aceite

- Checkout nao confirma venda acima do estoque real.
- Reserva e baixa de estoque seguem estado de pagamento de forma consistente.
- Webhook nao provoca mutacao duplicada de estoque.
- Painel admin exibe estoque disponivel e reservado.
- Reconciliacao identifica e trata divergencias de inventario.
