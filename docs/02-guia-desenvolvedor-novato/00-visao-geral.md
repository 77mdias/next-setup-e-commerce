# Guia Novato - Visao Geral

## O que e esta aplicacao
`My Store` e um e-commerce com:
- catalogo de produtos
- carrinho e wishlist
- login/cadastro/recuperacao de senha
- checkout com Stripe
- area de pedidos e perfil

## Como pensar o sistema
- `src/app/` define paginas e endpoints API.
- `src/components/` contem a interface e blocos reutilizaveis.
- `src/hooks/` contem logica de negocio do frontend.
- `src/lib/` contem infra compartilhada (auth, db, stripe, email).
- `prisma/` contem modelo de dados e migracoes.

## Fluxo de compra (alto nivel)
1. Usuario navega e adiciona produto ao carrinho.
2. Carrinho persiste localmente ou via `/api/cart` quando logado.
3. Checkout cria pedido e sessao Stripe.
4. Webhook Stripe confirma pagamento e atualiza pedido.
5. Usuario consulta pedido em `/orders` (rotas `/${slug}/*` sao legadas com redirecionamento para rotas canônicas quando aplicável).

## Importante para quem esta comecando
- Existem rotas novas (`/products`) e legadas por loja (`/${slug}/product`).
- Sempre confira em qual fluxo voce esta mexendo antes de codar.
- Priorize alteracoes pequenas e validacoes locais (`lint`, `build`).
