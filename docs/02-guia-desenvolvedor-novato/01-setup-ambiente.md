# Guia Novato - Setup de Ambiente

## Pre-requisitos
- Node.js 18+
- npm 9+
- PostgreSQL 15+ (local ou cloud)

## 1) Instalar dependencias
```bash
npm install
```

## 2) Configurar variaveis de ambiente
```bash
cp .env.example .env.local
```

Preencher no minimo:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- OAuths se forem usados (`GITHUB_*`, `GOOGLE_*`)

## 3) Preparar banco
```bash
npx prisma generate
npx prisma migrate dev
npm run seed
```

## 4) Rodar local
```bash
npm run dev
```
Acesse `http://localhost:3000`.

## 5) Validacao minima antes de codar
```bash
npm run lint
npm run build
```

## Problemas comuns
- Erro de Stripe no build: confira `STRIPE_SECRET_KEY` e `NEXT_PUBLIC_BASE_URL`.
- Erro de auth: confira `NEXTAUTH_URL` e `NEXTAUTH_SECRET`.
- Erro de email: use senha de app do Gmail, nao senha normal.
