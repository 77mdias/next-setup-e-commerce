# AGENTS Guide - Seguranca e Padroes de Prototipacao (My Store)

> **Como usar:** este arquivo e o guia principal para agentes trabalhando neste repositorio. Siga a ordem das secoes, valide checklist e mantenha consistencia com os workflows do CI.

**Descricao curta:** Guia rapido para AI agents trabalhando no stack Next.js + Prisma do projeto My Store, com foco em seguranca, padroes de implementacao e qualidade de entrega sem quebra de pipeline.  
**Docs detalhados:** [README.md](./README.md)

---

## 📚 Stack-Specific Guides (opcional)

- **[Seguranca e Governanca](./docs/03-seguranca-governanca/00-politica-seguranca.md)** - politica de seguranca e hardening.
- **[Backlog de Hardening](./docs/03-seguranca-governanca/01-hardening-backlog.md)** - riscos e prioridades de seguranca.
- **[Tasks por Fase](./docs/development/tasks/PHASE-05-hardening-identidade-seguranca.md)** - status e criterios de aceite de seguranca.
- **[Variaveis de Ambiente](./docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md)** - contrato de env vars da aplicacao.

---

## 🚨 Critical Rules - READ FIRST

### 1. Tokens e credenciais nunca em plaintext

```bash
❌ NEVER: Persistir token bruto em banco, log ou resposta de erro.
✅ ALWAYS: Gerar token criptografico e persistir apenas hash (ex.: src/lib/secure-token.ts).
```

### 2. Callback e URLs externas sempre normalizados/validados

```typescript
❌ NEVER: Confiar em callbackUrl ou image URL vindos do cliente.
✅ ALWAYS: Usar normalizeCallbackPath() e validateRemoveBgImageUrl() antes de consumir.
```

### 3. Logs sem PII e sem segredos

```typescript
❌ NEVER: Logar email/cpf/token/chaves diretamente em logger.error/logger.info.
✅ ALWAYS: Passar pelo logger padrao (src/lib/logger.ts + src/lib/log-redaction.ts).
```

### 4. Evitar enumeracao de conta em endpoints publicos

```bash
❌ NEVER: Diferenciar mensagens para "usuario existe" vs "usuario nao existe" em recuperacao de conta.
✅ ALWAYS: Retornar mensagem neutra quando o endpoint for publico e sensivel.
```

### 5. Mudou schema? versione migracao junto

```bash
❌ NEVER: Alterar prisma/schema.prisma sem migration correspondente.
✅ ALWAYS: Gerar e commitar pasta em prisma/migrations/ + validar prisma.
```

### 6. Antes de push, reproduzir gates da pipeline

```bash
❌ NEVER: Abrir PR sem rodar lint/build/testes criticos.
✅ ALWAYS: Rodar checklist local de pipeline parity (secao Testing Rules + Workflow & Checklist).
```

### 7. Fluxos de auth exigem invalidacao deterministica

```typescript
❌ NEVER: Deixar token expirado acumulado ou permitir reuso concorrente.
✅ ALWAYS: Aplicar on-read/on-write cleanup e consumo atomico (updateMany quando aplicavel).
```

### 8. Este repositorio e DEMO/portfolio, nao produto em escala

```bash
❌ NEVER: Priorizar complexidade operacional de escala (Redis, filas, multi-regiao, HA, infra distribuida) sem requisito real da task.
✅ ALWAYS: Preferir a solucao mais simples, segura e suficiente para execucao local/demo, preservando clareza arquitetural e gates de CI.
```

---

## 📁 Project / Stack Structure

```tree
next-setup-e-commerce/
├── src/
│   ├── app/                      # Next.js App Router (UI + API routes)
│   │   ├── api/                  # Endpoints backend (auth, checkout, webhooks, etc.)
│   │   └── auth/                 # Fluxos de autenticacao no frontend
│   ├── components/               # Componentes de UI e feature components
│   ├── lib/                      # Regras de dominio, seguranca, integrações e utilitarios
│   ├── context/                  # Estado global (ex.: carrinho)
│   └── hooks/                    # Hooks de negocio
├── prisma/
│   ├── schema.prisma             # Modelo de dados
│   ├── migrations/               # Historico de migracoes versionadas
│   └── seed.ts                   # Seed
├── scripts/                      # Scripts operacionais (seed, cleanup, automacoes)
├── e2e/                          # Testes E2E criticos (Playwright)
├── .github/workflows/            # CI, migracao prod e jobs agendados
└── docs/                         # Roadmap, fases, seguranca e guias operacionais
```

- **Padroes de organizacao:** feature/domain-oriented dentro de `src/app`, `src/lib` e `src/components`.
- **Arquivos sensiveis:** `.env`, `.env.local`, `.env.example`, `prisma/schema.prisma`, workflows de deploy/migracao, secrets referenciados em `.github/workflows/*.yml`.

---

## ⚡ Essential Commands

### Development

```bash
npm run dev
npm run build
npm run start
```

### Database / Tooling

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate:deploy
npm run seed
npm run smart-seed
npm run tokens:cleanup-expired
```

### Testing

```bash
npm run test:unit
npm run test:integration
npm run test:integration:critical
npm run test:e2e:critical:ci
```

### Pipeline Parity (evitar erro no PR)

```bash
npm run prisma:generate
npm run prisma:validate
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:unit:critical
npm run test:integration:critical
```

---

## 📝 Coding Standards

### Naming

- **API routes:** `src/app/api/<dominio>/<subdominio>/route.ts`
- **Utils de seguranca:** `src/lib/*security*.ts`, `src/lib/*token*.ts`, `src/lib/log-redaction.ts`
- **Componentes React:** `PascalCase.tsx`
- **Hooks:** `use<Feature>.ts`
- **Testes:** `*.test.ts` (unit) e `*.integration.test.ts` (integracao)

### Formatting

- Indentacao: 2 spaces
- Quotes: double quotes (padrao Prettier/TS do projeto)
- Semicolons: required
- Lint command: `npm run lint`
- Format check command: `npm run format:check`

### Style Guides (opcional)

- Keep it simple: rotas enxutas, validacao explicita, regras de dominio em `src/lib`.
- Para auth e seguranca, prefira funcoes compartilhadas ao inves de duplicar regra em multiplas rotas.
- Em recomendacoes tecnicas, priorize simplicidade operacional para demo/portfolio; so proponha hardening de escala quando houver requisito explicito de producao/carga.

---

## 🧪 Testing Rules

### Backend / API (Next.js + Vitest)

- **Locais dos testes:** `src/**/__tests__/*.integration.test.ts`
- **Ferramentas:** Vitest (node env), mocks de Prisma/dependencias externas
- **Cobertura alvo:** cenarios P0/P1 dos fluxos criticos (auth, checkout, webhooks, pedidos)

### Frontend / App Router

- **Locais dos testes:** `src/**/*.test.ts` (exceto `*.integration.test.ts`)
- **Ferramentas:** Vitest para unitario, Playwright para E2E critico (`e2e/checkout-critical-flow.spec.ts`)
- **Regra:** quando alterar UX de auth/checkout, validar contrato API + comportamento visual principal

### Mandatory Commands Before Push

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:unit:critical
npm run test:integration:critical
```

### CI / Pipeline Actions que precisam passar

- **CI (`.github/workflows/ci.yml`)**
  1. `npm ci --include=dev`
  2. `npm run prisma:generate`
  3. `npm run prisma:validate`
  4. `npm run typecheck`
  5. `npm run lint`
  6. `npx prettier --check` (arquivos alterados)
  7. `npm run build`
  8. `npm run test:unit:critical`
  9. `npm run test:integration:critical`
  10. `npm run prisma:migrate:deploy`
  11. `npm run test:e2e:critical:ci`
- **Migrate Prod (`.github/workflows/migrate.yml`)**
  - valida secrets -> `npm ci` -> prisma status -> `prisma migrate deploy` (retry) -> trigger Vercel.
- **Cleanup Tokens (`.github/workflows/auth-token-cleanup.yml`)**
  - schedule diario + manual -> dry-run cleanup -> apply cleanup.

---

## 📋 Commit & PR Guidelines

### Commit Format

```text
<type>(<scope>): <subject>
```

- **Tipos validos:** feat, fix, docs, style, refactor, test, chore
- **Regras:**
  - usar verbo no imperativo
  - assunto curto e objetivo
  - incluir `TASK-ID` no assunto/descricao quando aplicavel (ex.: `S05-SEC-003`)
  - se alterar schema, commit deve incluir migration

### PR Checklist

1. **Titulo:** `[TASK-ID] resumo` (quando houver task formal)
2. **Testes:** anexar comandos executados e status
3. **Seguranca:** declarar impacto (tokens, auth, logs, rate-limit, webhooks)
4. **Schema/env:** documentar alteracoes em migrations e env vars
5. **Docs:** atualizar roadmap/log da task quando houver impacto funcional/arquitetural

---

## 🎯 AIDEV Anchors

```typescript
// AIDEV-NOTE: contexto rapido de decisao tecnica
// AIDEV-TODO: pendencia tecnica que precisa follow-up
// AIDEV-QUESTION: duvida de regra/contrato
// AIDEV-CRITICAL: trecho sensivel (auth, pagamento, seguranca)
// AIDEV-GOTCHA: armadilha conhecida para evitar regressao
```

- **Antes de alterar modulos criticos:** `rg -n "AIDEV-" src docs`
- **Quando adicionar anchors:** auth, pagamentos, webhooks, rate limit, redacao de logs, migracoes criticas.

---

## 🔄 Workflow & Checklist

1. Identificar a task ativa em `docs/development/tasks/PHASE-*.md`.
2. Mapear impacto real (API, frontend, schema, integracoes, seguranca).
3. Implementar seguindo padroes de seguranca (token hash, anti-enumeracao, redacao de logs, validacao de URL/callback), sem introduzir infra/complexidade desnecessaria para um contexto de demo.
4. Cobrir cenarios com testes (unit/integration/e2e critico quando afetado).
5. Rodar pipeline parity local para evitar falha no PR.
6. Atualizar docs de fase/sprint/log tecnico quando houver mudanca de comportamento.

### ✅ Pre-push Checklist

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run build`
- [ ] `npm run test:unit:critical`
- [ ] `npm run test:integration:critical`
- [ ] Se schema mudou: migration versionada + `npm run prisma:validate`
- [ ] Se auth/seguranca mudou: validar logs redigidos e contratos de erro neutros
- [ ] Docs atualizadas (`docs/development/tasks/*`, sprint/log quando aplicavel)

---

## 📚 Quick Documentation Lookup (opcional tabela)

| Necessidade                       | Documento                                                           |
| --------------------------------- | ------------------------------------------------------------------- |
| Visao geral do projeto            | `README.md`                                                         |
| Analise de seguranca da aplicacao | `docs/01-analise-aplicacao/04-seguranca.md`                         |
| Politica de seguranca             | `docs/03-seguranca-governanca/00-politica-seguranca.md`             |
| Hardening backlog                 | `docs/03-seguranca-governanca/01-hardening-backlog.md`              |
| Deploy seguro                     | `docs/03-seguranca-governanca/02-requisitos-deploy-seguro.md`       |
| Variaveis de ambiente             | `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md`              |
| Sprint atual de hardening         | `docs/ROADMAP/SPRINTS/sprint-05-hardening-identidade-seguranca.md`  |
| Tasks por fase                    | `docs/development/tasks/PHASE-05-hardening-identidade-seguranca.md` |

---

> **Nota final:** este repositorio e de demo/portfolio com execucao local e deploy em plataforma gerenciada. Priorize simplicidade operacional sem abrir mao de regras basicas de seguranca e dos gates de CI.
