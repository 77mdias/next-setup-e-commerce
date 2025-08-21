## 🛍️ **My Store | NEXT SETUP - E-commerce Fullstack**

> **Simulação completa de e-commerce em produção para portfólio** ��

[![Next.js](https://img.shields.io/badge/Next.js-15.0.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 **Índice**

- [�� Sobre o Projeto](#-sobre-o-projeto)
- [✨ Funcionalidades](#-funcionalidades)
- [🛠️ Tecnologias](#️-tecnologias)
- [🏗️ Arquitetura](#️-arquitetura)
- [🚀 Como Executar](#-como-executar)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [🎨 Design System](#-design-system)
- [🔧 Configurações](#-configurações)
- [�� Responsividade](#-responsividade)
- [🔒 Autenticação](#-autenticação)
- [💳 Pagamentos](#-pagamentos)
- [�� Banco de Dados](#-banco-de-dados)
- [🎭 Componentes](#-componentes)
- [📈 Performance](#-performance)
- [🤝 Contribuição](#-contribuição)
- [�� Licença](#-licença)

---

## 🎯 **Sobre o Projeto**

**My Store** é uma simulação completa de e-commerce desenvolvida como projeto de portfólio, demonstrando habilidades em desenvolvimento fullstack moderno. O projeto simula uma loja virtual completa com todas as funcionalidades essenciais de um e-commerce real.

### 🎪 **Características Principais**

- **Multi-tenancy** - Suporte a múltiplas lojas
- **Design Moderno** - Interface elegante e responsiva
- **Performance Otimizada** - Carregamento rápido e SEO
- **UX/UI Avançada** - Experiência do usuário premium
- **Funcionalidades Completas** - Carrinho, wishlist, busca, filtros

---

## ✨ **Funcionalidades**

### 🛒 **E-commerce Core**

- [x] **Catálogo de Produtos** - Grid responsivo com filtros
- [x] **Carrinho de Compras** - Gestão de estado global
- [x] **Lista de Desejos** - Favoritos persistentes
- [x] **Busca Avançada** - Filtros por categoria, preço, marca
- [x] **Páginas de Produto** - Galeria, especificações, avaliações
- [x] **Categorias e Subcategorias** - Navegação hierárquica

### 👤 **Sistema de Usuários**

- [x] **Autenticação** - Login/Registro com NextAuth
- [x] **Perfil de Usuário** - Gestão de dados pessoais
- [x] **Histórico de Pedidos** - Acompanhamento de compras
- [x] **Endereços** - Múltiplos endereços de entrega

### �� **Pagamentos e Pedidos**

- [x] **Integração Stripe** - Pagamentos seguros
- [x] **Webhooks** - Processamento assíncrono
- [x] **Gestão de Pedidos** - Status e rastreamento
- [x] **Notificações** - Sistema de alertas

### 🎨 **Interface e UX**

- [x] **Design Responsivo** - Mobile-first
- [x] **Tema Escuro** - Modo noturno elegante
- [x] **Animações Suaves** - Transições fluidas
- [x] **Scroll to Top** - Navegação intuitiva
- [x] **Loading States** - Feedback visual
- [x] **Error Handling** - Tratamento de erros

---

## ��️ **Tecnologias**

### **Frontend**

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Ícones modernos
- **Framer Motion** - Animações avançadas

### **Backend**

- **Next.js API Routes** - API RESTful
- **Prisma ORM** - Query builder type-safe
- **PostgreSQL** - Banco de dados relacional
- **NextAuth.js** - Autenticação social

### **Ferramentas**

- **ESLint** - Linting de código
- **Prettier** - Formatação automática
- **VS Code** - Configurações otimizadas
- **Git** - Controle de versão

---

## ��️ **Arquitetura**

```
my-store/
├── 📁 src/
│   ├── 📁 app/                    # App Router (Next.js 15)
│   │   ├── �� [slug]/            # Multi-tenancy (lojas)
│   │   │   ├── 📁 categorias/    # Sistema de categorias
│   │   │   ├── 📁 product/       # Produtos e detalhes
│   │   │   ├── 📁 carrinho/      # Carrinho de compras
│   │   │   ├── 📁 wishlist/      # Lista de desejos
│   │   │   └── �� perfil/        # Área do usuário
│   │   ├── �� api/               # API Routes
│   │   └── �� auth/              # Autenticação
│   ├── 📁 components/            # Componentes reutilizáveis
│   ├── 📁 hooks/                 # Custom hooks
│   ├── 📁 lib/                   # Utilitários e configurações
│   └── 📁 types/                 # Definições TypeScript
├── 📁 prisma/                    # Schema e migrations
├── 📁 public/                    # Assets estáticos
└── 📁 scripts/                   # Scripts de automação
```

---

## 🚀 **Como Executar**

### **Pré-requisitos**

- Node.js 18+
- PostgreSQL 15+
- npm/yarn/pnpm

### **1. Clone o Repositório**

```bash
git clone https://github.com/seu-usuario/my-store.git
cd my-store
```

### **2. Instale as Dependências**

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

### **3. Configure o Banco de Dados**

```bash
# Configure as variáveis de ambiente
cp .env.example .env.local

# Execute as migrations
npx prisma migrate dev

# Popule o banco com dados de exemplo
npm run seed
```

### **4. Execute o Projeto**

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) 🎉

---

## �� **Estrutura do Projeto**

### **�� Páginas Principais**

- **`/`** - Homepage com produtos em destaque
- **`/[slug]`** - Loja específica (multi-tenancy)
- **`/[slug]/categorias`** - Catálogo de categorias
- **`/[slug]/product`** - Lista de todos os produtos
- **`/[slug]/product/[id]`** - Detalhes do produto
- **`/[slug]/carrinho`** - Carrinho de compras
- **`/[slug]/wishlist`** - Lista de desejos
- **`/[slug]/perfil`** - Área do usuário

### **🔧 Componentes Principais**

- **`CardProducts`** - Card de produto reutilizável
- **`ScrollToTop`** - Botão de voltar ao topo animado
- **`ProductGallery`** - Galeria de imagens do produto
- **`CategoryControls`** - Controles de categoria
- **`NotificationContainer`** - Sistema de notificações

### **🎣 Custom Hooks**

- **`useAddToCart`** - Gestão do carrinho
- **`useWishlist`** - Gestão da wishlist
- **`useScrollToTop`** - Controle do scroll
- **`useProductList`** - Listagem de produtos
- **`useCategoryPage`** - Páginas de categoria

---

## 🎨 **Design System**

### **�� Cores**

```scss
// Variáveis CSS customizadas
--button-primary: hsla(348, 100%, 64%, 1); // Rosa vibrante
--text-price: hsla(348, 100%, 64%, 1); // Preços
--all-black: hsla(0, 0%, 7%, 1); // Fundo escuro
--card-product: hsla(0, 0%, 15%, 1); // Cards
```

### **🎭 Animações**

- **Float Animation** - Movimento suave de flutuação
- **Pulse Glow** - Brilho pulsante
- **Sparkle** - Partículas animadas
- **Smooth Transitions** - Transições fluidas

### **�� Responsividade**

- **Mobile-first** - Design mobile-first
- **Breakpoints** - sm, md, lg, xl, 2xl
- **Grid System** - Flexbox e CSS Grid
- **Touch-friendly** - Elementos touch-friendly

---

## 🔧 **Configurações**

### **VS Code**

- **Material Icon Theme** - Ícones personalizados
- **Espaçamento otimizado** - Melhor legibilidade
- **Configurações de workspace** - Padronização

### **ESLint & Prettier**

- **Regras TypeScript** - Qualidade de código
- **Formatação automática** - Padrão consistente
- **Integração VS Code** - Auto-fix

---

## 📱 **Responsividade**

### **�� Mobile (320px+)**

- Grid de 1 coluna
- Menu hambúrguer
- Cards otimizados
- Touch gestures

### **�� Tablet (768px+)**

- Grid de 2-3 colunas
- Navegação expandida
- Sidebar categories

### **��️ Desktop (1024px+)**

- Grid de 4+ colunas
- Layout completo
- Hover effects
- Animações avançadas

---

## �� **Autenticação**

### **NextAuth.js**

- **Google OAuth** - Login social
- **Email/Password** - Autenticação tradicional
- **JWT Tokens** - Sessões seguras
- **Middleware** - Proteção de rotas

### **Sessões**

- **Persistent** - Lembrar usuário
- **Secure** - HTTPS only
- **Refresh** - Auto-refresh tokens

---

## 💳 **Pagamentos**

### **Stripe Integration**

- **Checkout Session** - Pagamento seguro
- **Webhooks** - Processamento assíncrono
- **Payment Methods** - Múltiplas formas
- **Error Handling** - Tratamento de erros

### **Order Management**

- **Status Tracking** - Acompanhamento
- **Email Notifications** - Confirmações
- **Order History** - Histórico completo

---

## 📊 **Banco de Dados**

### **Schema Prisma**

```prisma
model Store {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  products  Product[]
  categories Category[]
}

model Product {
  id          String   @id @default(cuid())
  name        String
  price       Float
  description String?
  images      Json
  store       Store    @relation(fields: [storeId], references: [id])
  category    Category @relation(fields: [categoryId], references: [id])
  brand       Brand    @relation(fields: [brandId], references: [id])
}
```

### **Relacionamentos**

- **Store → Products** (1:N)
- **Category → Products** (1:N)
- **Brand → Products** (1:N)
- **User → Orders** (1:N)

---

## 🎭 **Componentes**

### **UI Components**

- **Button** - Botões com variantes
- **Input** - Campos de entrada
- **Modal** - Modais responsivos
- **Card** - Cards reutilizáveis
- **Toast** - Notificações toast

### **Business Components**

- **ProductCard** - Card de produto
- **CategoryCard** - Card de categoria
- **CartItem** - Item do carrinho
- **WishlistItem** - Item da wishlist

---

## 📈 **Performance**

### **Otimizações**

- **Image Optimization** - Next.js Image
- **Code Splitting** - Lazy loading
- **Bundle Analysis** - Análise de bundle
- **Caching** - Cache estratégico

### **SEO**

- **Meta Tags** - Meta tags dinâmicas
- **Structured Data** - Schema.org
- **Sitemap** - Sitemap automático
- **Robots.txt** - Configuração SEO

---

## �� **Contribuição**

### **Como Contribuir**

1. **Fork** o projeto
2. **Crie** uma branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### **Padrões de Código**

- **TypeScript** - Tipagem obrigatória
- **ESLint** - Regras de linting
- **Prettier** - Formatação automática
- **Conventional Commits** - Padrão de commits

---

## 📄 **Licença**

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## ��‍💻 **Desenvolvedor**

**Seu Nome** - [GitHub](https://github.com/seu-usuario) | [LinkedIn](https://linkedin.com/in/seu-usuario)

---

## 🙏 **Agradecimentos**

- **Next.js Team** - Framework incrível
- **Vercel** - Deploy e hosting
- **Tailwind CSS** - Framework CSS
- **Prisma** - ORM moderno
- **Stripe** - Pagamentos seguros

---

<div align="center">

### ⭐ **Se este projeto te ajudou, considere dar uma estrela!** ⭐

**Made with ❤️ and ☕**

</div>

---

## 📝 **Como Usar Este README**

1. **Copie** todo o conteúdo acima
2. **Substitua** no seu arquivo `README.md`
3. **Personalize** as informações (nome, links, etc.)
4. **Adicione** screenshots do projeto se desejar
5. **Atualize** as badges com suas informações

### **Personalizações Sugeridas:**

- 🔗 **Links do GitHub/LinkedIn**
- 📸 **Screenshots do projeto**
- 🎯 **Funcionalidades específicas**
- 🛠️ **Tecnologias adicionais**
- 📊 **Métricas de performance**

Este README está pronto para impressionar recrutadores e mostrar suas habilidades de desenvolvimento fullstack! 🚀✨
