# Guia Novato - Checklists Operacionais

## Checklist antes de abrir PR
- [ ] Entendi a rota/fluxo alvo (novo vs legado)
- [ ] Nao quebrei autenticacao/autorizacao
- [ ] Nao confiei em dado sensivel vindo do client
- [ ] Rodei `npm run lint`
- [ ] Rodei `npm run build`
- [ ] Atualizei docs relevantes

## Checklist para mudancas em API
- [ ] Endpoint valida payload
- [ ] Endpoint valida sessao e ownership
- [ ] Endpoint nao retorna dado sensivel desnecessario
- [ ] Erros padronizados e sem vazamento de internals

## Checklist para mudancas em banco
- [ ] Atualizei `schema.prisma`
- [ ] Criei migration
- [ ] Executei migrate local
- [ ] Ajustei seed se necessario

## Checklist para mudancas em checkout/pagamento
- [ ] Preco e total calculados no backend
- [ ] IDs Stripe persistidos de forma consistente
- [ ] Webhook idempotente
- [ ] Pagina de sucesso/falha testada
