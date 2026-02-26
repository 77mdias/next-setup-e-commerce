# Guia Novato - Rotas e Modulos

## Rotas de produto
- Novo fluxo:
  - `/`
  - `/products`
  - `/product/[productId]`
- Fluxo legado por loja (com redirecionamento):
  - `/${slug}` -> `/`
  - `/${slug}/product` -> `/products`
  - `/${slug}/product/[productId]` -> `/product/[productId]`
  - `/${slug}/categorias` -> `/products`
  - `/${slug}/categorias/[categorySlug]` -> `/products?category=[categorySlug]`

## Rotas de compra
- `/carrinho`
- `/checkout`
- `/wishlist`
- `/orders`
- `/orders/[orderId]`
- `/orders/success`
- `/orders/failure`
- Legadas com redirecionamento:
  - `/${slug}/carrinho`
  - `/${slug}/checkout`
  - `/${slug}/wishlist`
  - `/${slug}/perfil` -> `/perfil`
  - `/${slug}/suporte` -> `/status?reason=development`
  - `/${slug}/pedido` -> `/orders`
  - `/${slug}/pedido/[orderId]` -> `/orders/[orderId]`
  - `/${slug}/pedido/sucesso` -> `/orders/success`
  - `/${slug}/pedido/falha` -> `/orders/failure`

## Rotas de autenticacao
- `/auth/signin`
- `/auth/signup`
- `/auth/verify-email`
- `/auth/reset-password`
- `/auth/error`
- `/auth/thank-you`

## APIs principais
- Catalogo: `/api/products`, `/api/categories`
- Carrinho/Wishlist: `/api/cart`, `/api/wishlist`
- Checkout/Pedidos: `/api/checkout`, `/api/orders/*`, `/api/webhooks/stripe`
- Auth: `/api/auth/*`
- Observacao: APIs de catalogo usam loja ativa e nao aceitam mais `storeSlug` via query.
- Performance catalogo:
  - `GET /api/products?facetsOnly=1` para carregar apenas filtros.
  - `GET /api/products` so calcula `total`/`totalPages` quando `includeTotal=1`.
  - Para listagem rapida, usar `includeFacets=0&includeTotal=0` e paginacao por `hasMore`.

## Dica pratica
Quando for alterar comportamento de checkout/pedido, sempre revisar estes 4 arquivos juntos:
- `src/hooks/useCheckout.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/orders/session/[sessionId]/route.ts`
