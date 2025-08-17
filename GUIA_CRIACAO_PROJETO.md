# 🍔 Criando seu Sistema de Pedidos do Zero - Baseado no FSW Donalds

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.1.6-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.2.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</div>

<div align="center">
  <h2>🚀 Guia Completo para Criar seu Próprio Sistema de Pedidos</h2>
  <p><em>Construa do zero uma plataforma moderna de pedidos para restaurantes!</em></p>
</div>

---

## 📋 Índice

- [🎯 O que Vamos Construir](#-o-que-vamos-construir)
- [⚡ Pré-requisitos](#-pré-requisitos)
- [🏗️ Criação do Projeto Base](#️-criação-do-projeto-base)
- [📦 Instalação de Dependências](#-instalação-de-dependências)
- [⚙️ Arquivos de Configuração](#️-arquivos-de-configuração)
- [🗄️ Configuração do Banco de Dados](#️-configuração-do-banco-de-dados)
- [🔐 Variáveis de Ambiente](#-variáveis-de-ambiente)
- [📱 Estrutura de Pastas](#-estrutura-de-pastas)
- [🎨 Configuração do UI](#-configuração-do-ui)
- [💳 Integração com Stripe](#-integração-com-stripe)
- [🚀 Primeiro Teste](#-primeiro-teste)
- [📝 Próximos Passos](#-próximos-passos)

---

## 🎯 O que Vamos Construir

Vamos criar um **sistema completo de pedidos online** com:

### 🌟 **Funcionalidades Principais:**

- 🏪 **Multi-restaurante**: Suporte a múltiplos estabelecimentos
- 🛒 **Carrinho Inteligente**: Gerenciamento avançado de pedidos
- 💳 **Pagamentos Seguros**: Integração completa com Stripe
- 📱 **Design Responsivo**: Mobile-first com interface moderna
- 🎯 **Validações Inteligentes**: CPF, formulários e dados
- 📊 **Gestão de Pedidos**: Acompanhamento em tempo real

### 🏗️ **Stack Tecnológica:**

- **Frontend**: Next.js 15.1.6 + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Stripe + Webhooks
- **Forms**: React Hook Form + Zod

---

## ⚡ Pré-requisitos

### 📦 **Software Necessário:**

| Software       | Versão Mínima | Download                                               |
| -------------- | ------------- | ------------------------------------------------------ |
| **Node.js**    | 18.0+         | [nodejs.org](https://nodejs.org/)                      |
| **npm**        | 9.0+          | Incluído com Node.js                                   |
| **PostgreSQL** | 14.0+         | [postgresql.org](https://www.postgresql.org/download/) |
| **Git**        | 2.30+         | [git-scm.com](https://git-scm.com/)                    |

### 🔍 **Verificar Instalações:**

```bash
# Verificar Node.js
node --version
# Deve mostrar: v18.x.x ou superior

# Verificar npm
npm --version
# Deve mostrar: 9.x.x ou superior

# Verificar PostgreSQL
psql --version
# Deve mostrar: psql (PostgreSQL) 14.x ou superior

# Verificar Git
git --version
# Deve mostrar: git version 2.30.x ou superior
```

### 💡 **Contas Necessárias:**

- 🔥 **Conta no Stripe** (para pagamentos): [stripe.com](https://stripe.com)
- 🐙 **Conta no GitHub** (para versionamento): [github.com](https://github.com)

---

## 🏗️ Criação do Projeto Base

### **Passo 1: 🆕 Criar Projeto Next.js**

```bash
# Criar novo projeto Next.js com TypeScript
npx create-next-app@latest meu-sistema-pedidos --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Entrar na pasta do projeto
cd meu-sistema-pedidos

# Verificar se foi criado corretamente
ls -la
# Deve mostrar: package.json, src/, public/, etc.
```

### **Passo 2: 🧹 Limpeza Inicial**

```bash
# Remover arquivos desnecessários
rm src/app/page.tsx
rm src/app/globals.css

# Criar estrutura básica
mkdir -p src/app/api/webhooks/stripe
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/helpers
mkdir -p src/data
mkdir -p prisma
```

### **Passo 3: 🔧 Inicializar Git**

```bash
# Inicializar repositório Git
git init

# Primeiro commit
git add .
git commit -m "🎉 Projeto inicial - Sistema de Pedidos"
```

---

## 📦 Instalação de Dependências

### **Passo 1: 🛠️ Dependências Principais**

```bash
# Instalação das dependências principais
npm install @prisma/client prisma @hookform/resolvers @radix-ui/react-dialog @radix-ui/react-label @radix-ui/react-scroll-area @radix-ui/react-separator @radix-ui/react-slot @stripe/stripe-js class-variance-authority clsx lucide-react next-themes react-hook-form react-number-format sonner stripe tailwind-merge tailwindcss-animate vaul zod
```

### **Passo 2: 🔧 Dependências de Desenvolvimento**

```bash
# Instalação das dependências de desenvolvimento
npm install -D @eslint/eslintrc @types/node @types/react @types/react-dom eslint eslint-config-next eslint-plugin-simple-import-sort postcss prettier-plugin-tailwindcss ts-node typescript
```

### **Passo 3: ✅ Verificar Instalação**

```bash
# Verificar se todas as dependências foram instaladas
npm list --depth=0

# Verificar package.json
cat package.json | grep '"dependencies"' -A 20
```

**🎯 Dependências que devem aparecer:**

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.2.1",
    "@prisma/client": "^6.2.1",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@stripe/stripe-js": "^5.7.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.539.0",
    "next": "15.1.6",
    "next-themes": "^0.4.6",
    "prisma": "^6.2.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.62.0",
    "react-number-format": "^5.4.3",
    "sonner": "^2.0.7",
    "stripe": "^17.7.0",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2",
    "zod": "^4.0.17"
  }
}
```

---

## ⚙️ Arquivos de Configuração

### **Passo 1: 📄 package.json - Scripts**

Edite o `package.json` e adicione/modifique os scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### **Passo 2: 🎨 tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### **Passo 3: 🎯 next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "u9a6wmr3as.ufs.sh", // Para imagens de exemplo
      },
      // Adicione aqui outros domínios de imagens que você usar
    ],
  },
};

export default nextConfig;
```

### **Passo 4: 🔧 components.json (shadcn/ui)**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### **Passo 5: 🎨 src/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: Arial, Helvetica, sans-serif;
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 20%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 20%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 20%;
    --primary: 42 100% 50%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 20%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 20%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 198 33% 94%;
    --input: 198 33% 94%;
    --ring: 0 0% 20%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply h-full bg-background text-foreground;
  }

  html {
    @apply h-full;
  }
}
```

### **Passo 6: 🔧 eslint.config.mjs**

```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    plugins: {
      "simple-import-sort": require("eslint-plugin-simple-import-sort"),
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },
];

export default eslintConfig;
```

### **Passo 7: 🎯 .prettierrc.json**

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## 🗄️ Configuração do Banco de Dados

### **Passo 1: 🐘 Criar Banco PostgreSQL**

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE meu_sistema_pedidos;

# Criar usuário
CREATE USER sistema_user WITH PASSWORD 'senha_super_segura';

# Dar permissões
GRANT ALL PRIVILEGES ON DATABASE meu_sistema_pedidos TO sistema_user;

# Sair do psql
\q
```

### **Passo 2: 🔧 prisma/schema.prisma**

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Restaurant {
  id             String         @id @default(uuid())
  name           String
  slug           String         @unique
  description    String
  avatarImageUrl String
  coverImageUrl  String
  menuCategories MenuCategory[]
  products       Product[]
  orders         Order[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
}

model MenuCategory {
  id           String     @id @default(uuid())
  name         String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
  products     Product[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Product {
  id             String         @id @default(uuid())
  name           String
  description    String
  price          Float
  imageUrl       String
  ingredients    String[]
  restaurant     Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId   String
  menuCategory   MenuCategory   @relation(fields: [menuCategoryId], references: [id], onDelete: Cascade)
  menuCategoryId String
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  OrderProduct   OrderProduct[]
}

model Order {
  id                Int               @id @default(autoincrement())
  total             Float
  status            OrderStatus
  consumptionMethod ConsumptionMethod
  restaurant        Restaurant        @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId      String
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  OrderProduct      OrderProduct[]
  customerName      String
  customerCpf       String
}

model OrderProduct {
  id        String   @id @default(uuid())
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   Int
  quantity  Int
  price     Float
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum OrderStatus {
  PENDING
  IN_PREPARATION
  PAYMENT_CONFIRMED
  PAYMENT_FAILED
  READY_FOR_PICKUP
  COMPLETED
  CANCELLED
}

enum ConsumptionMethod {
  TAKE_AWAY
  DINE_IN
}
```

### **Passo 3: 🌱 prisma/seed.ts**

```typescript
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
const { PrismaClient } = require("@prisma/client");

const prismaClient = new PrismaClient();

const main = async () => {
  await prismaClient.$transaction(async (tx: any) => {
    await tx.restaurant.deleteMany();
    const restaurant = await tx.restaurant.create({
      data: {
        name: "Meu Restaurante",
        slug: "meu-restaurante",
        description: "O melhor sistema de pedidos do mundo",
        avatarImageUrl:
          "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQvcNP9rHlEJu1vCY5kLqzjf29HKaeN78Z6pRy",
        coverImageUrl:
          "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQac8bHYlkBUjlHSKiuseLm2hIFzVY0OtxEPnw",
      },
    });

    // Categoria Combos
    const combosCategory = await tx.menuCategory.create({
      data: {
        name: "Combos",
        restaurantId: restaurant.id,
      },
    });

    await tx.product.createMany({
      data: [
        {
          name: "Combo Big Burger",
          description:
            "Hambúrguer artesanal, batata frita e refrigerante. O combo perfeito!",
          price: 29.9,
          imageUrl:
            "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQaHB8tslkBUjlHSKiuseLm2hIFzVY0OtxEPnw",
          menuCategoryId: combosCategory.id,
          restaurantId: restaurant.id,
          ingredients: [
            "Pão artesanal",
            "Hambúrguer 180g",
            "Queijo cheddar",
            "Alface",
            "Tomate",
            "Cebola",
            "Molho especial",
          ],
        },
        {
          name: "Combo Chicken Crispy",
          description: "Frango empanado crocante, batata frita e refrigerante.",
          price: 27.9,
          imageUrl:
            "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQr12aTqPo3SsGjBJCaM7yhxnbDlXeL5N9dckv",
          menuCategoryId: combosCategory.id,
          restaurantId: restaurant.id,
          ingredients: [
            "Pão brioche",
            "Frango empanado",
            "Alface",
            "Tomate",
            "Maionese",
          ],
        },
      ],
    });

    // Categoria Lanches
    const lanchesCategory = await tx.menuCategory.create({
      data: {
        name: "Lanches",
        restaurantId: restaurant.id,
      },
    });

    await tx.product.createMany({
      data: [
        {
          name: "X-Burger Clássico",
          description: "O hambúrguer tradicional que você ama.",
          price: 19.9,
          imageUrl:
            "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQKfI6fivqActTvBGLXfQe4a8CJ6d3HiR7USPK",
          menuCategoryId: lanchesCategory.id,
          restaurantId: restaurant.id,
          ingredients: [
            "Pão",
            "Hambúrguer",
            "Queijo",
            "Alface",
            "Tomate",
            "Molho",
          ],
        },
        {
          name: "X-Bacon Especial",
          description: "Hambúrguer com bacon crocante e queijo derretido.",
          price: 24.9,
          imageUrl:
            "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQ99rtECuYaDgmA4VujBU0wKn2ThXJvF3LHfyc",
          menuCategoryId: lanchesCategory.id,
          restaurantId: restaurant.id,
          ingredients: [
            "Pão artesanal",
            "Hambúrguer",
            "Bacon",
            "Queijo cheddar",
            "Alface",
            "Tomate",
          ],
        },
      ],
    });

    // Categoria Bebidas
    const bebidasCategory = await tx.menuCategory.create({
      data: {
        name: "Bebidas",
        restaurantId: restaurant.id,
      },
    });

    await tx.product.createMany({
      data: [
        {
          name: "Coca-Cola 350ml",
          description: "Coca-cola gelada para acompanhar seu lanche.",
          price: 5.9,
          imageUrl:
            "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQJS1b33q29eEsh0CVmOywrqx1UPnJpRGcHN5v",
          menuCategoryId: bebidasCategory.id,
          restaurantId: restaurant.id,
          ingredients: [],
        },
        {
          name: "Suco Natural de Laranja",
          description: "Suco de laranja natural, sem conservantes.",
          price: 7.9,
          imageUrl:
            "https://u9a6wmr3as.ufs.sh/f/jppBrbk0cChQW7Kxm9gniS9XCLQu7Nb4jvBYZze16goaOqsK",
          menuCategoryId: bebidasCategory.id,
          restaurantId: restaurant.id,
          ingredients: [],
        },
      ],
    });
  });
};

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
```

### **Passo 4: 🔧 src/lib/prisma.ts**

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: PrismaClient;
}

let prisma: PrismaClient;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const db = prisma;
```

### **Passo 5: 🚀 Executar Configuração do Banco**

```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrations
npx prisma migrate dev --name initial

# Popular banco com dados
npx prisma db seed

# Verificar se funcionou
npx prisma studio
```

---

## 🔐 Variáveis de Ambiente

### **Passo 1: 📄 Criar .env.local**

```bash
# Criar arquivo de variáveis de ambiente
touch .env.local
```

### **Passo 2: ⚙️ Configurar Variáveis**

Adicione no arquivo `.env.local`:

```env
# ===================================
# 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS
# ===================================
DATABASE_URL="postgresql://sistema_user:senha_super_segura@localhost:5432/meu_sistema_pedidos"

# ===================================
# 💳 CONFIGURAÇÃO DO STRIPE
# ===================================
# Obtenha suas chaves em: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY="sk_test_sua_chave_secreta_aqui"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_sua_chave_publica_aqui"
STRIPE_WEBHOOK_SECRET_KEY="whsec_sua_chave_webhook_aqui"

# ===================================
# 🔧 CONFIGURAÇÕES GERAIS
# ===================================
NODE_ENV="development"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### **Passo 3: 🔒 Verificar Segurança**

```bash
# Verificar se .env.local está no .gitignore
cat .gitignore | grep ".env"
# Deve mostrar: .env*

# NUNCA commite arquivos .env!
```

---

## 📱 Estrutura de Pastas

### **Passo 1: 📁 Criar Estrutura Completa**

```bash
# Criar todas as pastas necessárias
mkdir -p src/app/\[slug\]/{menu,orders}/components
mkdir -p src/app/\[slug\]/menu/\[productId\]
mkdir -p src/app/api/webhooks/stripe
mkdir -p src/components/ui
mkdir -p src/lib
mkdir -p src/helpers
mkdir -p src/data
mkdir -p src/hooks
mkdir -p public/images
```

### **Passo 2: 🏗️ Estrutura Final**

```
meu-sistema-pedidos/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── images/
├── src/
│   ├── app/
│   │   ├── [slug]/
│   │   │   ├── menu/
│   │   │   │   ├── [productId]/
│   │   │   │   ├── components/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── components/
│   │   │   │   └── page.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/
│   ├── data/
│   ├── helpers/
│   ├── hooks/
│   └── lib/
│       └── prisma.ts
├── .env.local
├── .gitignore
├── components.json
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🎨 Configuração do UI

### **Passo 1: 🎯 src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### **Passo 2: 📱 src/app/layout.tsx**

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meu Sistema de Pedidos",
  description: "Sistema moderno de pedidos para restaurantes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

### **Passo 3: 🏠 src/app/page.tsx**

```typescript
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          🍔 Meu Sistema de Pedidos
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema moderno de pedidos para restaurantes
        </p>
        <div className="space-y-4">
          <Link
            href="/meu-restaurante"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            🚀 Acessar Restaurante
          </Link>
          <div className="text-sm text-muted-foreground">
            <p>✅ Next.js 15.1.6 configurado</p>
            <p>✅ TypeScript + Tailwind CSS</p>
            <p>✅ Prisma + PostgreSQL</p>
            <p>✅ Stripe para pagamentos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 💳 Integração com Stripe

### **Passo 1: 🔧 src/lib/stripe.ts**

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});
```

### **Passo 2: 🔗 src/app/api/webhooks/stripe/route.ts**

```typescript
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_KEY!,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: parseInt(orderId) },
          data: { status: "PAYMENT_CONFIRMED" },
        });
      }
      break;

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
    case "charge.failed":
      const failedSession = event.data.object as Stripe.Checkout.Session;
      const failedOrderId = failedSession.metadata?.orderId;

      if (failedOrderId) {
        await db.order.update({
          where: { id: parseInt(failedOrderId) },
          data: { status: "PAYMENT_FAILED" },
        });
      }
      break;
  }

  return NextResponse.json({ received: true });
}
```

### **Passo 3: 🌐 Configurar Webhook no Stripe**

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá para **Developers** > **Webhooks**
3. Clique em **Add endpoint**
4. URL: `http://localhost:3000/api/webhooks/stripe`
5. Eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.failed`
6. Copie a **chave do webhook** e adicione no `.env.local`

---

## 🚀 Primeiro Teste

### **Passo 1: 🎬 Executar o Projeto**

```bash
# Instalar shadcn/ui CLI
npx shadcn@latest init

# Executar em modo desenvolvimento
npm run dev
```

### **Passo 2: 🌐 Testar Acesso**

Abra o navegador em:

- **🏠 Home**: [http://localhost:3000](http://localhost:3000)
- **🍔 Restaurante**: [http://localhost:3000/meu-restaurante](http://localhost:3000/meu-restaurante)

### **Passo 3: ✅ Verificações**

```bash
# Verificar banco de dados
npx prisma studio
# Deve abrir interface em http://localhost:5555

# Verificar se há erros
npm run build
# Deve compilar sem erros

# Verificar linting
npm run lint
# Deve passar sem problemas
```

### **Passo 4: 🎯 Commit das Configurações**

```bash
# Adicionar todos os arquivos
git add .

# Commit das configurações
git commit -m "⚙️ Configuração completa do projeto

- ✅ Next.js 15.1.6 + TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ Prisma + PostgreSQL
- ✅ Stripe para pagamentos
- ✅ Estrutura de pastas completa
- ✅ Arquivos de configuração
- ✅ Seed do banco de dados"
```

---

## 📝 Próximos Passos

### 🎯 **O que você já tem funcionando:**

- ✅ **Projeto Next.js** configurado com TypeScript
- ✅ **Banco de dados PostgreSQL** com Prisma
- ✅ **Tailwind CSS** com shadcn/ui
- ✅ **Stripe** configurado para pagamentos
- ✅ **Estrutura de pastas** organizada
- ✅ **Dados de exemplo** no banco

### 🚀 **Próximas implementações:**

1. **📱 Páginas do Sistema**
   - Página do restaurante
   - Menu de produtos
   - Carrinho de compras
   - Finalização de pedidos

2. **🛒 Context do Carrinho**
   - Gerenciamento de estado global
   - Adicionar/remover produtos
   - Cálculos automáticos

3. **📋 Sistema de Pedidos**
   - Formulários com validação
   - Integração com Stripe
   - Acompanhamento de status

4. **🎨 Componentes UI**
   - Instalar componentes do shadcn/ui
   - Criar componentes personalizados
   - Design responsivo

### 📚 **Comandos úteis para continuar:**

```bash
# Instalar componentes shadcn/ui conforme necessário
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add scroll-area
npx shadcn@latest add separator

# Ver banco de dados
npx prisma studio

# Resetar banco se necessário
npx prisma migrate reset

# Build para produção
npm run build
```

### 🎉 **Parabéns!**

Você criou com sucesso a **base completa** do seu sistema de pedidos! 🚀

Agora você tem:

- 🏗️ **Arquitetura sólida** com as melhores tecnologias
- 🗄️ **Banco de dados** estruturado e populado
- 💳 **Pagamentos** configurados com Stripe
- 🎨 **UI moderna** com Tailwind + shadcn/ui
- 📱 **Estrutura escalável** para crescer

### 📞 **Precisa de ajuda?**

- 📚 **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- 🗄️ **Prisma**: [prisma.io/docs](https://prisma.io/docs)
- 💳 **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- 🎨 **shadcn/ui**: [ui.shadcn.com](https://ui.shadcn.com)

---

<div align="center">
  <h3>🍔 Sua jornada para criar o melhor sistema de pedidos começa aqui!</h3>
  <p><strong>Happy Coding! 🚀</strong></p>
</div>
