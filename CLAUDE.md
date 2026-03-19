# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Primary agent guide:** [`AGENTS.md`](./AGENTS.md) — read it first. It contains critical security rules, full coding standards, PR/commit conventions, CI pipeline requirements, and pre-push checklists. Everything in AGENTS.md takes precedence over default Claude behavior.

---

## Commands

```bash
# Development
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check   # check only
npm run format:write   # auto-fix

# Database
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
npm run seed

# Testing
npm run test:unit                     # all unit tests
npm run test:unit:critical            # same as above (used by CI)
npm run test:integration              # all integration tests
npm run test:integration:critical     # critical subset (used by CI)
npm run test:e2e:critical:ci          # E2E Playwright (needs built app + running server)
```

Run a **single integration test file**:
```bash
npx vitest run --config vitest.integration.config.ts path/to/file.integration.test.ts
```

Run a **single unit test file**:
```bash
npx vitest run --config vitest.unit.config.ts path/to/file.test.ts
```

**Pipeline parity** (run before every push to avoid CI failures):
```bash
npm run prisma:generate && npm run prisma:validate && npm run typecheck && npm run lint && npm run format:check && npm run build && npm run test:unit:critical && npm run test:integration:critical
```

---

## Architecture

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Prisma + PostgreSQL (Neon) + NextAuth v4 + Stripe + Tailwind CSS v4.

### Key layers

| Layer | Path | Purpose |
|---|---|---|
| App Router pages & layouts | `src/app/` | All UI pages plus API route handlers |
| API routes | `src/app/api/` | Backend endpoints: auth, checkout, orders, admin, webhooks, remove-bg |
| Domain/security libs | `src/lib/` | Business rules isolated from routes: auth tokens, RBAC, rate-limit, logger, Stripe, Prisma client |
| UI components | `src/components/` | Feature and shared components (admin, auth, product, layout, ui primitives) |
| Global state | `src/context/` | Cart context (client-side) |
| Middleware | `src/middleware.ts` | Auth guard, admin role check, maintenance mode, legacy redirects |
| Prisma schema | `prisma/schema.prisma` | Source of truth for all models; migrations in `prisma/migrations/` |
| E2E tests | `e2e/` | Playwright critical-path tests tagged `@critical` |
| Integration tests | `src/**/__tests__/*.integration.test.ts` | Vitest node env, mock external deps |
| Unit tests | `src/**/*.test.ts` (excluding integration) | Vitest, pure logic |

### Auth flow

NextAuth v4 with Prisma adapter. Custom credential provider with email verification and password reset using crypto tokens stored only as hashes (`src/lib/secure-token.ts`). RBAC enforced in middleware (`isAdminRole`) and per-route via `src/lib/rbac.ts`.

### Admin panel

Routes under `/admin/*` are protected by role check in middleware. The admin area has sub-sections: catalog, orders, customers, audit log, and remove-bg image processing.

### Payments

Stripe integration via `src/lib/stripe.ts` and `src/lib/stripe-config.ts`. Checkout creates a Stripe session; webhook at `src/app/api/webhooks/stripe/` confirms payment and transitions order state machine (`src/lib/order-state-machine.ts`).

### Path alias

`@/` maps to `src/` in both TypeScript and Vitest configs.
