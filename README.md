# 🛍️ My Store • E-commerce Fullstack (Portfólio)

> Simulação completa de e-commerce em produção para portfólio, com foco em UX, performance e código limpo. 🚀

<div align="left">

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.14.0-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.12-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-18.4.0-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)

</div>

---

## 📌 Índice

- 🧭 [Sobre](#-sobre)
- ✨ [Funcionalidades](#-funcionalidades)
- 🧰 [Stack](#-stack)
- 🏛️ [Arquitetura](#-arquitetura)
- 🚀 [Como executar](#-como-executar)
- 🧩 [Principais módulos](#-principais-módulos)
- 🎨 [Design System](#-design-system)
- 🔐 [Autenticação](#-autenticação)
- 💳 [Pagamentos](#-pagamentos)
- 🗄️ [Banco de Dados](#-banco-de-dados)
- 📈 [Performance](#-performance)
- 🤝 [Contribuição](#-contribuição)
- 📄 [Licença](#-licença)

---

## 🎯 Sobre

O My Store é uma aplicação fullstack que simula um e-commerce real: multi-lojas (rota `/[slug]`), catálogo completo, categorias/subcategorias, página de produto rica, carrinho, wishlist, checkout com Stripe, autenticação e muito mais.

Principais diferenciais:

- 🎨 UI moderna e consistente (dark theme, animações suaves e microinterações)
- ⚡ App Router com arquitetura limpa e componentização avançada
- 🧠 Hooks customizados para regras de negócio (cart, wishlist, produtos)
- 🧪 Tipagem forte com TypeScript em todo o projeto

---

## ✨ Funcionalidades

- 📦 Catálogo com busca, ordenação e visualização grid/list
- 🧭 Categorias e subcategorias com controle de estado e filtros
- 🛍️ Página de produto com galeria, preço, quantidade, shipping e ações
- 🛒 Carrinho (Context API) e 💝 Wishlist (hook dedicado)
- 🔎 Páginas: `categorias`, `product`, `carrinho`, `wishlist`, `perfil`
- ⬆️ Scroll-to-top com animações (float, pulse, sparkle)
- 🔔 Notificações (UI Toast/Notification)
- 🧾 Webhooks de pagamento (Stripe)

---

## 🧰 Stack

Frontend

- Next.js 15 (App Router) • React 19 • TypeScript
- Tailwind CSS 4 • Lucide React • Radix UI

Backend

- Next.js API Routes • Prisma ORM • PostgreSQL
- NextAuth.js (OAuth + Email) • Stripe

Dev/Qualidade

- ESLint • Prettier • VS Code Workspace

---

## 🏛️ Arquitetura

```
src/
  app/
    [slug]/
      categorias/
        [categorySlug]/
          components/ (product-card, subcategory-card, header, controls, ...)
          hooks/use-category-page.ts
          page.tsx
        page.tsx
      product/
        [productId]/
          components/ (gallery, header, pricing, tabs, stats, ...)
          hooks/use-product-page.ts
          page.tsx
        hooks/use-product-list.ts
        page.tsx
      carrinho/ • wishlist/ • perfil/ • ofertas/ • suporte/
      components/ (Header, Nav, Menu, etc.)
      context/cart.tsx
      layout.tsx
    api/
      products/ • categories/ • cart/ • wishlist/ • remove-bg/ • webhooks/stripe/
  components/ui/ (button, input, card-products, navigation-menu, toast, scroll-to-top)
  hooks/ (useAddToCart, useWishlist, useScrollToTop, ...)
  lib/ (auth, prisma, stripe, utils)
  prisma/ (schema.prisma, migrations, seed.ts)
```

---

## 🚀 Como executar

Pré-requisitos: Node 18+, PostgreSQL 15+, conta Stripe.

```bash
# 1) Instalar deps
npm install

# 2) Variáveis de ambiente
cp .env.example .env.local
# veja também: ENVIRONMENT_VARIABLES.md

# 3) Prisma
npx prisma generate
npx prisma migrate dev
npm run seed

# 4) Dev server
npm run dev
# http://localhost:3000
```

Scripts úteis (package.json): `dev`, `build`, `start`, `lint`, `seed`, `smart-seed`, `reprocess-images`, `backup-images`.

---

## 🧩 Principais módulos

- `src/components/ui/card-products.tsx` • Card unificado com ações (cart/wishlist)
- `src/app/[slug]/categorias/[categorySlug]/hooks/use-category-page.ts` • Estado/filtro/sort
- `src/app/[slug]/product/hooks/use-product-list.ts` • Lista de produtos da loja
- `src/app/[slug]/product/[productId]/components/*` • Página de produto modular
- `src/hooks/useAddToCart.ts` • Ações de carrinho
- `src/hooks/useWishlist.ts` • Ações de wishlist
- `src/hooks/useScrollToTop.ts` + `components/ui/scroll-to-top.tsx` • UX scroll

---

## 🎨 Design System

Tokens (globals.scss)

```scss
--button-primary: hsla(348, 100%, 64%, 1);
--text-price: hsla(348, 100%, 64%, 1);
--all-black: hsla(0, 0%, 7%, 1);
--card-product: hsla(0, 0%, 15%, 1);
```

Interações

- Efeitos: hover/scale/shadow, tooltips, microinterações
- Animações customizadas (float, pulse-glow, sparkle) aplicadas ao ScrollToTop

Responsividade

- Mobile-first, grid responsivo (1–4 colunas), navegação sticky, touch-friendly

---

## 🔐 Autenticação

- NextAuth (Google OAuth + credenciais)
- Tipagem NextAuth estendida em `src/types/next-auth.d.ts`
- Middleware para rotas protegidas

---

## 💳 Pagamentos

- Stripe Checkout + Webhooks (`src/app/api/webhooks/stripe/`)
- Exibição de status de pedido e integrações correlatas

---

## 🗄️ Banco de Dados (Prisma)

- Entidades principais: `Store`, `Product`, `Category`, `Brand`, `User`, `Order`
- Relacionamentos: loja→produtos, categoria→produtos, marca→produtos, user→orders
- Seeds inteligentes (`scripts/smart-seed.js`) e `prisma/seed.ts`

---

## 📈 Performance & Qualidade

- Image Optimization, code-splitting, cache e SEO (App Router)
- ESLint/Prettier integrados • VSCode workspace (.vscode/)

---

## 🤝 Contribuição

1. Faça um fork
2. Crie uma branch: `feat/minha-feature`
3. Commit: `git commit -m "feat: minha feature"`
4. Push e abra um PR

Padrões: TypeScript, ESLint/Prettier, Conventional Commits.

---

## 📄 Licença

Projeto sob licença MIT. Consulte `LICENSE`.

---

### ⭐ Curtiu o projeto?

Deixe uma estrela e compartilhe! Feito com ❤️ e ☕.
