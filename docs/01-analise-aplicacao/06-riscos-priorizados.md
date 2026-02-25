# Riscos Priorizados e Plano de Acao

## Matriz

| ID | Risco | Severidade | Impacto | Probabilidade | Prioridade |
|---|---|---|---|---|---|
| R1 | Preco manipulavel no checkout | Critica | Muito alta | Alta | P0 |
| R2 | Pedido por sessionId sem auth obrigatoria | Critica | Muito alta | Media/Alta | P0 |
| R3 | Endpoint test-stripe aberto | Alta | Alta | Alta | P0 |
| R4 | Ambiguidade `stripePaymentId` (session vs payment intent) | Alta | Alta | Alta | P0 |
| R5 | Enumeracao de conta em `/api/auth/user-info` | Alta | Alta | Alta | P1 |
| R6 | Token de verificacao fraco (`Math.random`) | Alta | Alta | Media | P1 |
| R7 | TLS inseguro no email (`rejectUnauthorized:false`) | Alta | Alta | Media | P1 |
| R8 | Remove-bg com apiKey no cliente + SSRF | Alta | Alta | Media | P1 |
| R9 | Politica de senha inconsistente | Media | Media | Alta | P2 |
| R10 | Ownership de pedido baseado em email | Media | Media/Alta | Media | P2 |
| R11 | Exposicao email owner da loja | Media | Media | Media | P2 |
| R12 | Logging com PII | Media | Media | Alta | P2 |

## Plano 30/60/90

### 0-30 dias (P0)
- Corrigir checkout autoritativo no servidor.
- Exigir auth em `/api/orders/session/[sessionId]`.
- Desativar/restringir `/api/test-stripe`.
- Separar IDs Stripe (session e payment intent).

### 31-60 dias (P1)
- Endurecer auth de `/api/auth/user-info`.
- Migrar tokens para `crypto.randomBytes` + hash no banco.
- Remover `rejectUnauthorized:false`.
- Hardening do remove-bg (chave server-side + allowlist).

### 61-90 dias (P2)
- Unificar politica de senha.
- Corrigir ownership de pedido por `userId`.
- Sanitizacao de logs e mascaramento de PII.
- Revisao de respostas publicas com dados pessoais.
