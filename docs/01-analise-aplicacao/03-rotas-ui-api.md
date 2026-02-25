# Rotas UI e API

## Rotas UI (principais)

### Top-level
- `/`: home.
- `/products`: catalogo novo.
- `/product/[productId]`: detalhe de produto.
- `/explore`: vitrine exploratoria.
- `/orders`: pedidos do usuario autenticado.
- `/auth/*`: signin, signup, verify-email, reset-password, error, thank-you.
- `/carrinho`, `/checkout`, `/wishlist`: redirecionam para loja ativa (`/${slug}/...`).

### Por loja (`/[slug]`)
- `/${slug}`: home da loja.
- `/${slug}/product` e `/${slug}/product/[productId]`: catalogo/detalhe legado.
- `/${slug}/categorias` e `/${slug}/categorias/[categorySlug]`.
- `/${slug}/carrinho`, `/${slug}/checkout`, `/${slug}/wishlist`.
- `/${slug}/pedido`, `/${slug}/pedido/[orderId]`, `/${slug}/pedido/sucesso`, `/${slug}/pedido/falha`.
- `/${slug}/perfil`, `/${slug}/suporte`, `/${slug}/admin/remove-bg`.

## Rotas API (catalogo resumido)

### Auth
- `GET/POST /api/auth/[...nextauth]`
- `POST /api/auth/register`
- `GET/POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/user-info`

### Catalogo e loja
- `GET /api/products`
- `GET /api/products/[productId]`
- `GET /api/categories`
- `GET /api/categories/[categorySlug]`
- `GET /api/stores/[slug]`

### Carrinho e wishlist
- `GET/POST/PUT/DELETE /api/cart`
- `POST /api/cart/migrate`
- `GET/POST /api/wishlist`
- `GET /api/addresses`

### Checkout e pedidos
- `POST /api/checkout`
  - Payload aceito: `{ storeId, items: [{ productId, quantity, variantId? }], addressId?, shippingMethod }`.
  - O backend ignora/rejeita preco e metadados de produto vindos do cliente; subtotal/total sao calculados no servidor.
- `GET /api/orders/user`
- `GET /api/orders/[orderId]`
- `GET /api/orders/session/[sessionId]`
- `POST /api/webhooks/stripe`
- `GET /api/test-stripe`

### Utilitario
- `POST/PUT /api/remove-bg`

## Regras de acesso (estado atual)
- Middleware protege principalmente rotas de UI (`/orders`, `/(slug)/perfil|wishlist|carrinho|checkout|pedido`).
- Rotas API nao passam pelo matcher do middleware e dependem de validacao interna.
- Nem todas as APIs sensiveis exigem sessao (ex.: `/api/test-stripe`, `/api/auth/user-info`, `/api/remove-bg`).

## Inconsistencias funcionais
- Navegacao principal aponta carrinho para `/cart` em vez de `/carrinho` (`src/components/layout/app-chrome.tsx:81`).
- Pagina admin remove-bg usa `/api/products/${slug}` com `PUT`, mas a API existente em `/api/products/[productId]` e apenas `GET`.
