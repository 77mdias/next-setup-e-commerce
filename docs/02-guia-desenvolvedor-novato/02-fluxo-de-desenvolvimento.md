# Guia Novato - Fluxo de Desenvolvimento

## Branching simples
1. Atualize branch base.
2. Crie branch curta por objetivo (`feat/...`, `fix/...`).
3. Commits pequenos e claros.

## Passo a passo para implementar algo
1. Entender rota/pasta alvo (`src/app`, `src/components`, `src/hooks`).
2. Fazer alteracao minima necessaria.
3. Rodar `npm run lint`.
4. Rodar `npm run build`.
5. Validar fluxo no navegador.
6. Atualizar documentacao quando mexer em regras.

## Onde alterar cada tipo de mudanca
- UI/layout: `src/components/*` e paginas `src/app/*/page.tsx`
- API/back: `src/app/api/**/route.ts`
- Auth/session: `src/lib/auth.ts`, `src/middleware.ts`
- Dados: `prisma/schema.prisma` + migrations
- Checkout/Stripe: `src/app/api/checkout/route.ts`, `src/app/api/webhooks/stripe/route.ts`

## Regra de ouro
- Nunca confiar em dado vindo do frontend para preco, permissao ou identidade.
