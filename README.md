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
- 🧪 [Testes](#-testes)
- 🗄️ [Banco de Dados](#-banco-de-dados)
- 📈 [Performance](#-performance)
- 🔧 [Correções Recentes](#-correções-recentes)
- 🤝 [Contribuição](#-contribuição)
- 📄 [Licença](#-licença)

---

## 🎯 Sobre

O My Store é uma aplicação fullstack que simula um e-commerce real: catálogo completo, categorias/subcategorias, página de produto rica, carrinho, wishlist, checkout com Stripe, autenticação e muito mais. As rotas por slug (`/[slug]`) seguem como legado com redirecionamento para rotas canônicas.

Principais diferenciais:

- 🎨 UI moderna e consistente (dark theme, animações suaves e microinterações)
- ⚡ App Router com arquitetura limpa e componentização avançada
- 🧠 Hooks customizados para regras de negócio (cart, wishlist, produtos)
- 🧪 Tipagem forte com TypeScript em todo o projeto
- 🔄 Sistema de checkout completo com Stripe e webhooks
- 📱 Design responsivo e acessível

---

## ✨ Funcionalidades

### 🛍️ **E-commerce Core**

- 📦 Catálogo com busca, ordenação e visualização grid/list
- 🧭 Categorias e subcategorias com controle de estado e filtros
- 🛍️ Página de produto com galeria, preço, quantidade, shipping e ações
- 🛒 Carrinho (Context API) e 💝 Wishlist (hook dedicado)
- 🔎 Páginas: `categorias`, `product`, `carrinho`, `wishlist`, `perfil`

### 💳 **Sistema de Pagamentos**

- ✅ Checkout completo com Stripe
- 🔄 Webhooks para processamento de pagamentos
- 📊 Status de pedidos em tempo real
- 📧 Confirmação de pedido por email
- 🎯 Páginas de sucesso/falha do pedido

### 🔐 **Autenticação & Segurança**

- 🔑 NextAuth.js com OAuth (Google, GitHub) e credenciais
- 🛡️ Middleware para proteção de rotas
- 🔒 Validação de formulários com Zod
- 📧 Verificação de email
- 🔄 Recuperação de senha

### 🎨 **UX/UI Avançada**

- ⬆️ Scroll-to-top com animações (float, pulse, sparkle)
- 🔔 Notificações (UI Toast/Notification)
- 🎭 Microinterações e transições suaves
- 📱 Design mobile-first responsivo
- 🌙 Dark theme consistente

### 🛠️ **Ferramentas de Desenvolvimento**

- 🖼️ Processamento automático de imagens (Remove.bg)
- 📊 Scripts de backup e restauração
- 🧪 API de teste do Stripe
- 🔍 Logs detalhados para debug
- 📈 Monitoramento de performance

---

## 🧰 Stack

### **Frontend**

- Next.js 15 (App Router) • React 19 • TypeScript
- Tailwind CSS 4 • Lucide React • Radix UI
- React Hook Form • Zod • Sonner (toasts)

### **Backend**

- Next.js API Routes • Prisma ORM • PostgreSQL
- NextAuth.js (OAuth + Email) • Stripe
- Nodemailer • bcryptjs

### **Dev/Qualidade**

- ESLint • Prettier • VS Code Workspace
- Prisma Studio • Neon Database

---

## 🏛️ Arquitetura

```
src/
  app/
    [slug]/
      page.tsx (redirect legado para /)
      categorias/ (rotas legadas com redirect para /products)
        [categorySlug]/page.tsx
        page.tsx
      product/ (rotas legadas com redirect para /products e /product/[id])
        [productId]/page.tsx
        page.tsx
      carrinho/ • wishlist/ • perfil/ • ofertas/ • suporte/ (legado)
      checkout/ • pedido/ (sucesso, falha - legado)
      layout.tsx
    api/
      products/ • categories/ • cart/ • wishlist/ • remove-bg/
      checkout/ • orders/ • webhooks/stripe/ • test-stripe/
      auth/ (register, signin, verify-email, reset-password)
  components/product-detail/ (page-content, hooks, components/*)
  components/products/ (products-catalog)
  components/ui/ (button, input, card-products, navigation-menu, toast, scroll-to-top)
  hooks/ (useAddToCart, useWishlist, useScrollToTop, useCheckout, useAuth)
  lib/ (auth, prisma, stripe, utils, email)
  prisma/ (schema.prisma, migrations, seed.ts)
  scripts/ (smart-seed, backup-images, auto-reprocess-images)
```

---

## 🚀 Como executar

### **Pré-requisitos**

- Node.js 18+
- PostgreSQL 15+ (ou Neon Database)
- Conta Stripe (para pagamentos)

### **Instalação**

```bash
# 1) Instalar deps
npm install

# 2) Variáveis de ambiente
cp .env.example .env.local
# veja também: docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md
# opcional (portfolio/demo): automação de status de pedido e entrega
# DEMO_ORDER_AUTOMATION_ENABLED=true

# 3) Prisma
npx prisma generate
npx prisma migrate dev
npm run seed

# 4) Dev server
npm run dev
# http://localhost:3000
```

### **Scripts úteis**

```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção
npm run lint         # Linting
npm run seed         # Seed básico
npm run smart-seed   # Seed inteligente
npm run backup-images    # Backup de imagens
npm run restore-images   # Restaurar imagens
npm run reprocess-images # Reprocessar imagens
npm run check-images     # Verificar imagens
```

---

## 🧩 Principais módulos

### **E-commerce**

- `src/components/ui/card-products.tsx` • Card unificado com ações (cart/wishlist)
- `src/components/products/products-catalog.tsx` • Catálogo canônico de produtos
- `src/components/product-detail/*` • Página de detalhe de produto (canônica)

### **Carrinho & Wishlist**

- `src/hooks/useAddToCart.ts` • Ações de carrinho
- `src/hooks/useWishlist.ts` • Ações de wishlist
- `src/context/cart.tsx` • Context do carrinho

### **Checkout & Pagamentos**

- `src/hooks/useCheckout.ts` • Lógica de checkout
- `src/app/api/checkout/route.ts` • API de checkout
- `src/app/api/webhooks/stripe/route.ts` • Webhooks do Stripe
- `src/app/orders/page.tsx` • Página canônica de pedidos
- `src/app/orders/success/page.tsx` • Callback canônico de sucesso

### **UX/UI**

- `src/hooks/useScrollToTop.ts` + `components/ui/scroll-to-top.tsx` • UX scroll
- `src/components/ui/notification.tsx` • Sistema de notificações
- `src/components/ui/toast.tsx` • Toasts

---

## 🎨 Design System

### **Tokens (globals.scss)**

```scss
--button-primary: hsla(348, 100%, 64%, 1);
--text-price: hsla(348, 100%, 64%, 1);
--text-price-secondary: hsla(348, 100%, 54%, 1);
--all-black: hsla(0, 0%, 7%, 1);
--card-product: hsla(0, 0%, 15%, 1);
--text-primary: hsla(0, 0%, 100%, 1);
```

### **Interações**

- Efeitos: hover/scale/shadow, tooltips, microinterações
- Animações customizadas (float, pulse-glow, sparkle) aplicadas ao ScrollToTop
- Transições suaves entre estados

### **Responsividade**

- Mobile-first, grid responsivo (1–4 colunas)
- Navegação sticky, touch-friendly
- Breakpoints otimizados

---

## 🔐 Autenticação

### **Providers**

- Google OAuth
- GitHub OAuth
- Credenciais (email/senha)

### **Funcionalidades**

- Verificação de email
- Recuperação de senha
- Middleware para rotas protegidas
- Tipagem NextAuth estendida em `src/types/next-auth.d.ts`

### **Fluxo**

1. Registro/Login
2. Verificação de email (se necessário)
3. Redirecionamento com callbackUrl
4. Proteção de rotas sensíveis

---

## 💳 Pagamentos

### **Stripe Integration**

- Stripe Checkout para pagamentos
- Webhooks para processamento automático
- Status de pedidos em tempo real
- Registro de pagamentos no banco

### **Fluxo de Checkout**

1. Adicionar produtos ao carrinho
2. Preencher informações pessoais
3. Redirecionamento para Stripe
4. Processamento do pagamento
5. Webhook atualiza status
6. Redirecionamento para sucesso/falha

### **Webhooks**

- `checkout.session.completed` • Pagamento confirmado
- `checkout.session.async_payment_failed` • Pagamento falhou
- `checkout.session.expired` • Sessão expirou

---

## 🧪 Testes

### **Teste do Stripe**

Para testar o sistema de pagamentos, use os cartões de teste do Stripe:

#### **Cartões de Sucesso**

```
Número: 4242 4242 4242 4242
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
```

#### **Cartões de Falha**

```
Número: 4000 0000 0000 0002 (pagamento recusado)
Número: 4000 0000 0000 9995 (saldo insuficiente)
```

#### **API de Teste**

```bash
GET /api/test-stripe
# Em desenvolvimento local: testa configuração do Stripe e cria sessão de teste
```

Restrições operacionais do endpoint:

- `NODE_ENV=production`: sempre bloqueado com `404`.
- Ambientes fora de `development` (ex.: staging) ficam bloqueados por padrão.
- Para habilitar temporariamente fora de dev, é obrigatório configurar:
  - `ENABLE_TEST_STRIPE_ENDPOINT=true`
  - `INTERNAL_DEBUG_KEY` e enviar `X-Internal-Debug-Key` com o mesmo valor
  - `TEST_STRIPE_ALLOWED_IPS` com IPs permitidos (separados por vírgula) e enviar origem via `X-Forwarded-For`
- Nunca use esse endpoint como parte do fluxo normal de checkout.

### **Teste de Checkout**

1. Adicione produtos ao carrinho
2. Vá para checkout (`/checkout`)
3. Preencha informações pessoais
4. Use cartão de teste: `4242 4242 4242 4242`
5. Complete o pagamento
6. Verifique redirecionamento para página de sucesso

---

## 🗄️ Banco de Dados (Prisma)

### **Entidades Principais**

- `Store` • Lojas/marketplaces
- `Product` • Produtos com variantes
- `Category` • Categorias e subcategorias
- `Brand` • Marcas
- `User` • Usuários com roles
- `Order` • Pedidos com status
- `Payment` • Registros de pagamento
- `Wishlist` • Lista de desejos

### **Relacionamentos**

- Loja → Produtos (1:N)
- Categoria → Produtos (1:N)
- Marca → Produtos (1:N)
- Usuário → Pedidos (1:N)
- Pedido → Pagamentos (1:N)
- Usuário → Wishlist (1:N)

### **Seeds**

- `prisma/seed.ts` • Seed básico
- `scripts/smart-seed.js` • Seed inteligente com imagens
- `scripts/backup-processed-images.js` • Backup de imagens

---

## 📈 Performance & Qualidade

### **Otimizações**

- Image Optimization com Next.js
- Code-splitting automático
- Cache inteligente
- SEO otimizado (App Router)
- Lazy loading de componentes

### **Qualidade de Código**

- ESLint/Prettier integrados
- TypeScript strict mode
- Conventional Commits
- VSCode workspace (.vscode/)

### **Monitoramento**

- Logs detalhados para debug
- Error boundaries
- Performance monitoring
- Webhook status tracking

---

## 🔧 Correções Recentes

### **Checkout & Pagamentos**

- ✅ Corrigido erro 404 após checkout do Stripe
- ✅ Melhorado redirecionamento de autenticação
- ✅ Implementado webhooks robustos
- ✅ Adicionado logs detalhados para debug
- ✅ Corrigido middleware para rotas de pedido

### **UX/UI**

- ✅ Melhorado loading states
- ✅ Corrigido fluxo de autenticação
- ✅ Implementado tratamento de erros robusto
- ✅ Adicionado feedback visual para ações

### **Performance**

- ✅ Otimizado carregamento de imagens
- ✅ Implementado cache inteligente
- ✅ Melhorado SEO e meta tags

### **Segurança**

- ✅ Validação de formulários com Zod
- ✅ Proteção de rotas sensíveis
- ✅ Sanitização de dados
- ✅ Rate limiting em APIs críticas

---

## 🤝 Contribuição

1. Faça um fork
2. Crie uma branch: `feat/minha-feature`
3. Commit: `git commit -m "feat: minha feature"`
4. Push e abra um PR

### **Padrões**

- TypeScript strict mode
- ESLint/Prettier
- Conventional Commits
- Testes para novas funcionalidades
- Documentação atualizada

---

## 📄 Licença

Projeto sob licença MIT. Consulte `LICENSE`.

---

### ⭐ Curtiu o projeto?

Deixe uma estrela e compartilhe! Feito com ❤️ e ☕.

### 🔗 Links Úteis

- [Documentação do Stripe](https://stripe.com/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
