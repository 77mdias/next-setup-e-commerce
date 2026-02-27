# Dados e Banco

## Visao geral
O schema Prisma modela um e-commerce completo com contas, loja, catalogo, estoque, pedidos, pagamento, endereco, avaliacao, wishlist e carrinho.

## Entidades centrais
- `User`: conta, role, verificacao de email, reset de senha.
- `Store`: loja e configuracoes comerciais.
- `Category` (hierarquica): categorias e subcategorias.
- `Product`: produto com preco, imagens, rating e flags de destaque/oferta.
- `Inventory` + `StockMovement`: estoque e historico de movimentacao.
- `Order` + `OrderItem` + `Payment`: pedido e pagamento.
- `Address`: enderecos do usuario.
- `Wishlist` e `Cart`: listas por usuario.

## Relacionamentos importantes
- Usuario 1:N pedidos, enderecos, wishlist, carrinho.
- Loja 1:N produtos e pedidos.
- Produto N:1 categoria, marca e loja.
- Pedido 1:N itens e pagamentos.

## Indices
Migracao `20260222114500_optimize_products_api_indexes` adiciona indices focados em:
- lojas ativas por data
- categorias ativas/ordenacao
- produtos por loja com filtros de atividade, preco, nome, vendas e rating

Esses indices suportam bem os endpoints de listagem/filtro (`/api/products`, `/api/categories`).

## Qualidade do modelo
Pontos positivos:
- Enumera os estados de pedido e pagamento.
- Uniques importantes (`email`, `sku`, `wishlist user+product`, `cart user+product`).

Pontos de atencao:
- `Order` agora possui `stripeCheckoutSessionId` e `stripePaymentIntentId`, mas o campo legado `stripePaymentId` ainda coexiste temporariamente para compatibilidade durante rollout.
- Tokens de verificacao/reset sao persistidos em texto simples.
- Tipo de `phone` em `next-auth.d.ts` diverge do banco (`string` no banco, `number` no tipo de sessao).
