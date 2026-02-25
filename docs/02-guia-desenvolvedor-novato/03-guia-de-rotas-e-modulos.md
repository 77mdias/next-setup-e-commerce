# Guia Novato - Rotas e Modulos

## Rotas de produto
- Novo fluxo:
  - `/products`
  - `/product/[productId]`
- Fluxo legado por loja:
  - `/${slug}/product`
  - `/${slug}/product/[productId]`

## Rotas de compra
- `/${slug}/carrinho`
- `/${slug}/checkout`
- `/${slug}/pedido`
- `/${slug}/pedido/[orderId]`
- `/${slug}/pedido/sucesso`
- `/${slug}/pedido/falha`

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

## Dica pratica
Quando for alterar comportamento de checkout/pedido, sempre revisar estes 4 arquivos juntos:
- `src/hooks/useCheckout.ts`
- `src/app/api/checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- `src/app/api/orders/session/[sessionId]/route.ts`
