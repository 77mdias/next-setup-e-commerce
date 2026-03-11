# {{DOCUMENT TITLE}}

> **Como usar:** copie este modelo para `AGENTS.md` (ou `backend/AGENTS.md`, `frontend/AGENTS.md`, etc.), substitua os espaços `{{ }}` com informações reais e mantenha a ordem das seções. This ensures every stack guide follows the same structure.

**Descrição curta:** {{Ex.: “Guia rápido para AI agents trabalhando no stack {{Stack}} do projeto 77code.”}}  
**Docs detalhados:** [CLAUDE.md](./CLAUDE.md) (opcional adaptar caminho relativo)

---

## 📚 Stack-Specific Guides (opcional)

> Lista outros guias relevantes ou “N/A” se este já for o guia específico.

- **[Backend AGENTS.md](./backend/AGENTS.md)** – {{stack/resumo}}
- **[Frontend AGENTS.md](./frontend/AGENTS.md)** – {{stack/resumo}}

---

## 🚨 Critical Rules - READ FIRST

> Liste no mínimo 5 regras essenciais. Use subtítulos enumerados com blocos ❌/✅ para comparação.

### {{1. Regra crítica}}
```bash
❌ NEVER: {{exemplo proibido}}
✅ ALWAYS: {{comando/caminho correto}}
```

### {{2. Regra crítica}}
```typescript
❌ NEVER: {{antipadrão}}
✅ ALWAYS: {{padrão recomendado}}
```

_(Repita até cobrir todas as regras obrigatórias do stack)_.

---

## 📁 Project / Stack Structure

> Descreva o layout principal com um bloco de código `tree` comentado.

```
{{root}}/
├── {{path}}   # {{descrição}}
└── …
```

- **Padrões de organização:** {{feature-based, domain-driven, etc.}}
- **Arquivos sensíveis:** {{.env, secrets, etc.}}

---

## ⚡ Essential Commands

> Separe por contexto (Development, Database, Testing, etc.). Inclua make targets ou npm scripts.

### Development
```bash
{{make dev}}
{{make dev-build}}
```

### Database / Tooling
```bash
{{comandos}}
```

### Testing
```bash
{{make test}}
{{npm test}}
```

---

## 📝 Coding Standards

### Naming
- **Services:** {{UsersService}}
- **Components/Controllers:** {{}}
- **DTOs/Interfaces:** {{}}

### Formatting
- Indentação: {{2 spaces}}
- Quotes: {{single}}
- Semicolons: {{required}}
- Lint/format command: `{{npm run format}}`

### Style Guides (opcional)
- {{Clean architecture, BEM, Atomic design, etc.}}

---

## 🧪 Testing Rules

### Backend / {{Stack}}
- **Locais dos testes:** `{{path}}`
- **Ferramentas:** {{Jest, Cypress, etc.}}
- **Cobertura alvo:** {{>80%}}

### Frontend / {{Stack}}
- {{Detalhes equivalentes}}

### Mandatory Commands Before Push
```bash
{{make test}}
{{npm test -- --watch=false}}
```

---

## 📋 Commit & PR Guidelines

### Commit Format
```
<type>(<scope>): <subject> (TASK-ID)
```

- **Tipos válidos:** {{feat, fix, docs, style, refactor, test, chore}}
- **Regras:** {{imperative mood, 72 chars, sem ponto final, referenciar task}}

### PR Checklist
1. **Título:** `[TASK-ID] {{Resumo}}`
2. **Testes:** anexar resultados
3. **Screenshots:** quando UI
4. **Env vars / Ports:** documentar alterações

---

## 🎯 AIDEV Anchors

```typescript
// AIDEV-NOTE: {{quando usar}}
// AIDEV-TODO: {{tarefa pendente}}
// AIDEV-QUESTION: {{dúvida}}
// AIDEV-CRITICAL: {{código sensível}}
// AIDEV-GOTCHA: {{pitfall}}
```

- **Antes de alterar módulos críticos:** `grep -r "AIDEV-" {{path}}`
- **Quando adicionar:** lógica complexa, segurança, pagamentos, integrações externas.

---

## 🔄 Workflow & Checklist

1. Revisar `docs/development/TASKS.md` → confirmar fase ativa e requisitos.
2. Compreender dependências/migrations necessárias.
3. Implementar seguindo padrões acima.
4. Adicionar/atualizar `AIDEV-*` anchors quando necessário.
5. Rodar lint/format/testes obrigatórios.
6. Atualizar docs (`TASKS.md`, `CHANGELOG.md`) antes de abrir PR.

### ✅ Pre-push Checklist

- [ ] `make test` (backend) + `npm test` (frontend ou equivalente)
- [ ] `npm run format` / `npm run lint`
- [ ] `make prisma-migrate` (quando alterar schema) + `git add backend/prisma/migrations`
- [ ] Docs atualizadas (TASKS, CHANGELOG, notas extras)
- [ ] Containers Docker ok (`make dev`)

---

## 📚 Quick Documentation Lookup (opcional tabela)

| Necessidade | Documento |
| ----------- | --------- |
| {{Stack guide}} | `{{path}}` |
| {{Docker}} | `docs/infrastructure/DOCKER.md` |
| {{Database}} | `docs/database/DATABASE.md` |
| {{Roadmap}} | `docs/development/ROADMAP.md` |

_(Adapte linhas conforme os recursos relevantes do stack.)_

---

> **Nota final (opcional):** inclua infos de produção (domínio, portas, VPS) ou lembretes específicos do stack.
