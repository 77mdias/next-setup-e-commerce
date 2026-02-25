# Arquitetura

## Stack principal
- Frontend/Backend: Next.js 15 (App Router) + React 19 + TypeScript
- ORM/DB: Prisma + PostgreSQL
- Auth: NextAuth (Credentials + Google + GitHub)
- Pagamentos: Stripe Checkout + Webhook
- Email: Nodemailer (Gmail)

## Estrutura de codigo
- `src/app/`: paginas e API routes do App Router.
- `src/components/`: UI e componentes de dominio.
- `src/hooks/`: hooks de negocio (`useCheckout`, `useWishlist`, etc.).
- `src/context/cart.tsx`: estado de carrinho (localStorage + sincronizacao com API).
- `src/lib/`: auth, prisma, stripe, email, utilitarios.
- `prisma/`: schema, migrations e seed.
- `scripts/`: operacoes auxiliares (seed inteligente e imagens).

## Topologia funcional
1. UI chama APIs internas (`/api/*`).
2. APIs usam Prisma para persistencia.
3. Autenticacao via NextAuth com sessao JWT.
4. Checkout cria pedido e sessao Stripe.
5. Webhook Stripe atualiza status do pedido/pagamento.

## Padroes observados
- Multi-loja por slug: `/${slug}/...`.
- Rotas top-level coexistem com rotas legadas por slug (ex.: `/products` e `/${slug}/product`).
- Uso extensivo de componentes client-side para fluxo de carrinho/pedido.

## Forcas arquiteturais
- Organizacao por dominio razoavel em `src/app/[slug]`.
- Camada de acesso ao banco centralizada em `db` (`src/lib/prisma.ts`).
- Resolucao de loja com cache em memoria (`src/lib/store.ts`).

## Debitos arquiteturais
- Duplicidade de experiencia entre rotas novas e legadas.
- Inconsistencia de nomenclatura de rotas (`/cart` vs `/carrinho`).
- Endpoint admin de remove-bg chama rota de produto inexistente para o caso (`src/app/[slug]/admin/remove-bg/page.tsx:27` e `:46`).
- Observabilidade baseada quase apenas em `console.*` sem padrao de sanitizacao.

## Observacao de runtime
- `src/lib/stripe-config.ts` valida e loga configuracoes no import; em build isso executa e polui logs.
