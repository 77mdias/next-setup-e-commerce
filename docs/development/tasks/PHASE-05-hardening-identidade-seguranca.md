# 🚀 Tasks - Fase 05: Hardening de Identidade e Seguranca

**Status:** 🟢 ATIVA
**Última atualização:** 2026-03-11
**Sprint Atual:** Sprint 05
**Status Geral:** 🟡 25% (3/12 tarefas completas) - FASE ATIVA
**ETA:** 2 semanas apos kickoff da Sprint 05
**Pré-requisito:** Fase 04 - Qualidade, Testes e Observabilidade (✅ concluída em 2026-03-11)

---

## 📊 Resumo de Progresso

| Categoria                                   | Total  | Concluído | Em Andamento | Pendente | Bloqueado |
| ------------------------------------------- | ------ | --------- | ------------ | -------- | --------- |
| Tokens e ciclo de identidade seguro         | 3      | 3         | 0            | 0        | 0         |
| Política de senha e anti-enumeração         | 3      | 0         | 0            | 3        | 0         |
| Hardening de transporte, anti-abuso e logs  | 3      | 0         | 0            | 3        | 0         |
| Testes, homologação e governança de release | 3      | 0         | 0            | 3        | 0         |
| **TOTAL**                                   | **12** | **3**     | **0**        | **9**    | **0**     |

### 🎯 Principais Indicadores

- ✅ Geração de token de verificação migrou para aleatoriedade criptográfica com persistência por hash.
- ✅ Reset de senha migrou para persistência por hash e consumo one-time com invalidação atômica.
- ⚠️ Transporte SMTP ainda possui `rejectUnauthorized: false` em fluxos de autenticação por email.
- ⚠️ Endpoint público `/api/auth/user-info` expõe sinais de existência/estado de conta.
- ⚠️ Endpoint `/api/remove-bg` segue sem autenticação obrigatória e sem limite de taxa dedicado.
- 🎯 Sprint 05 é bloqueadora para iniciar o painel admin da Sprint 06 com base de segurança adequada.

---

## 🎯 Objetivos da Fase

- Migrar tokens de verificação/reset para geração criptográfica e persistência por hash.
- Implementar ciclo de vida seguro de token (expiração curta, invalidacão one-time use e proteção a replay).
- Unificar política de senha entre cadastro e redefinição (backend + frontend).
- Eliminar vetores de enumeração de conta em endpoints públicos de autenticação.
- Aplicar hardening de transporte SMTP com TLS estrito e configuração centralizada.
- Introduzir rate limiting nas rotas sensíveis de auth e remove-bg.
- Padronizar logging de segurança sem exposição de PII/tokens em texto puro.
- Formalizar validação operacional de release com checklist e plano de rollback da Sprint 05.

---

## 📦 Estrutura de Categorias

### 📦 Tokens e ciclo de identidade seguro - Base criptográfica para verificação e reset

#### Objetivo

Eliminar armazenamento/validação de token em plaintext e reduzir risco de comprometimento de conta em caso de vazamento de banco. A categoria cobre geração, hash, expiração e consumo de tokens de verificação/reset.

#### SEC.1 - Token lifecycle seguro

- [x] **S05-SEC-001** - Migrar token de verificação de email para geração criptográfica com persistência por hash

  **Descrição curta:**
  - O fluxo atual usa token não criptográfico e armazenamento direto no banco.
  - A sprint exige token forte, hash persistido e validação segura no consumo.

  **Implementação sugerida:**
  - Criar utilitário central para geração de token (`crypto.randomBytes`) e hash (`sha256`/equivalente).
  - Atualizar `register` e `verify-email (POST)` para persistir apenas hash e expiração.
  - Atualizar `verify-email (GET)` para validar via hash do token recebido e limpar credenciais após uso.

  **Arquivos/áreas afetadas:** `src/lib/email.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/verify-email/route.ts`, `prisma/schema.prisma`, `prisma/migrations/*`

  **Critérios de aceitação:**
  - [x] Token de verificação não é armazenado em plaintext.
  - [x] Fluxo de verificação segue funcional e invalida token após consumo.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** nenhuma  
  **Status:** 🟢 Concluída (2026-03-11)

- [x] **S05-SEC-002** - Migrar reset de senha para token hash + consumo one-time

  **Descrição curta:**
  - O fluxo de reset ainda persiste token bruto e permite comparação direta no banco.
  - É necessário aplicar o mesmo padrão de segurança de token usado em verificação de email.

  **Implementação sugerida:**
  - Atualizar `forgot-password` para gerar token criptográfico e salvar apenas hash + expiração.
  - Atualizar `reset-password` para validar hash do token, expiração e invalidar imediatamente após sucesso.
  - Garantir retorno consistente para token inválido, expirado ou já utilizado.

  **Arquivos/áreas afetadas:** `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `prisma/schema.prisma`, `prisma/migrations/*`

  **Critérios de aceitação:**
  - [x] Reset de senha funciona apenas com token válido e não reutilizável.
  - [x] Banco não armazena token de reset em plaintext.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S05-SEC-001  
  **Status:** 🟢 Concluída (2026-03-11)

- [x] **S05-SEC-003** - Padronizar invalidação e limpeza de tokens expirados

  **Descrição curta:**
  - A limpeza/invalidação precisa ser previsível para evitar acúmulo de credenciais expiradas.
  - O objetivo é consolidar regras de expiração para verificação e reset.

  **Implementação sugerida:**
  - Definir estratégia de limpeza (on-read/on-write + rotina periódica opcional).
  - Garantir que reenvio de verificação invalide token anterior sem estado ambíguo.
  - Documentar limites de TTL e comportamento de invalidação nos fluxos auth.

  **Arquivos/áreas afetadas:** `src/app/api/auth/verify-email/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `scripts/*` (se necessário), `docs/ROADMAP/SPRINTS/sprint-05-hardening-identidade-seguranca.md`

  **Critérios de aceitação:**
  - [x] Tokens expirados são tratados de forma determinística e segura.
  - [x] Reenvio de token não deixa múltiplos tokens válidos concorrentes.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S05-SEC-001, S05-SEC-002  
  **Status:** 🟢 Concluída (2026-03-11)

### 📦 Política de senha e anti-enumeração - Contrato de autenticação consistente

#### Objetivo

Remover divergência de regras entre cadastro e reset e bloquear vazamento de sinais sobre existência de conta. Esta categoria cobre validação de senha compartilhada, resposta uniforme e impacto na UX de autenticação.

#### AUT.1 - Regras de autenticação e privacidade de conta

- [ ] **S05-AUT-001** - Unificar política de senha em módulo compartilhado (register + reset)

  **Descrição curta:**
  - Cadastro exige senha forte, mas reset aceita regra mais fraca.
  - A política precisa ser única e reutilizável em todos os pontos de entrada.

  **Implementação sugerida:**
  - Extrair validador para módulo compartilhado de domínio (`password-policy`).
  - Reusar validação em `register` e `reset-password` com mensagens padronizadas.
  - Adicionar testes unitários para os cenários válidos/inválidos principais.

  **Arquivos/áreas afetadas:** `src/app/api/auth/register/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/lib/*password*` (novo), `src/**/*.test.ts`

  **Critérios de aceitação:**
  - [ ] Cadastro e reset usam exatamente a mesma política de senha.
  - [ ] Casos inválidos são bloqueados no backend com resposta consistente.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** nenhuma  
  **Status:** 🔴 Pendente

- [ ] **S05-AUT-002** - Alinhar UX de redefinição de senha com política única

  **Descrição curta:**
  - A UI de reset ainda comunica regra mínima antiga e pode divergir do backend.
  - O fluxo de frontend deve orientar corretamente e reduzir erro de tentativa.

  **Implementação sugerida:**
  - Atualizar formulário de reset com validação cliente alinhada ao backend.
  - Padronizar feedback de erro/sucesso no fluxo de redefinição.
  - Validar experiência para evitar loop de erro entre cliente e API.

  **Arquivos/áreas afetadas:** `src/app/auth/reset-password/components/ResetPasswordForm.tsx`, `src/app/auth/register/**`, `src/components/auth/**`

  **Critérios de aceitação:**
  - [ ] Mensagens e validações de senha no frontend refletem regra oficial.
  - [ ] Erros de validação são acionáveis e consistentes entre UI e API.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 4h  
  **Dependências:** S05-AUT-001  
  **Status:** 🔴 Pendente

- [ ] **S05-AUT-003** - Remover enumeração de conta em endpoints públicos de auth

  **Descrição curta:**
  - O endpoint `/api/auth/user-info` e fluxos correlatos podem expor sinais de existência de conta.
  - A resposta precisa ser neutra sem quebrar experiência de login/recuperação.

  **Implementação sugerida:**
  - Revisar contrato de `/api/auth/user-info` para resposta genérica ou proteção adicional.
  - Ajustar `verify-email (POST)` e demais rotas para não diferenciar usuário existente/inexistente em superfície pública.
  - Ajustar UI que consome esses endpoints para operar sem depender de enumeração.

  **Arquivos/áreas afetadas:** `src/app/api/auth/user-info/route.ts`, `src/app/api/auth/verify-email/route.ts`, `src/app/auth/error/components/ErrorContent.tsx`, `src/components/auth/**`

  **Critérios de aceitação:**
  - [ ] Endpoints públicos não revelam existência de conta por código/mensagem.
  - [ ] Fluxo de UX continua funcional sem regressão de login/recuperação.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 5h  
  **Dependências:** S05-AUT-001  
  **Status:** 🔴 Pendente

### 📦 Hardening de transporte, anti-abuso e logs - Segurança operacional em runtime

#### Objetivo

Reduzir superfície de abuso em produção com transporte seguro, proteção de taxa e logs sem vazamento. Esta categoria cobre SMTP/TLS, rate limiting de rotas sensíveis e proteção de endpoint custoso externo.

#### HRD.1 - Runtime security e proteção de API

- [ ] **S05-HRD-001** - Aplicar TLS estrito e centralizar configuração de transporte de email

  **Descrição curta:**
  - Fluxos de email ainda usam configuração que aceita certificados não confiáveis.
  - Precisamos padronizar transporte seguro para verificação e reset.

  **Implementação sugerida:**
  - Remover `rejectUnauthorized: false` dos transporters de email.
  - Centralizar criação de transporter para evitar divergência entre módulos.
  - Atualizar configuração/documentação de ambiente para setup seguro em dev/prod.

  **Arquivos/áreas afetadas:** `src/lib/email.ts`, `src/app/api/auth/forgot-password/route.ts`, `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md`

  **Critérios de aceitação:**
  - [ ] Não há configuração TLS insegura nos fluxos de email da aplicação.
  - [ ] Verificação e reset continuam operando com configuração centralizada.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 3h  
  **Dependências:** nenhuma  
  **Status:** 🔴 Pendente

- [ ] **S05-HRD-002** - Implementar rate limiting nas rotas sensíveis de autenticação

  **Descrição curta:**
  - Endpoints públicos de auth estão sujeitos a abuso por alta taxa de tentativas.
  - É necessário limitar por IP/identidade com contrato claro de `429`.

  **Implementação sugerida:**
  - Criar utilitário de rate limit reutilizável para rotas da aplicação.
  - Aplicar limite em `/api/auth/forgot-password`, `/api/auth/reset-password` e `/api/auth/verify-email`.
  - Retornar `429` com metadados básicos (`retryAfter`) e logging estruturado.

  **Arquivos/áreas afetadas:** `src/lib/rate-limit.ts` (novo), `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/auth/verify-email/route.ts`

  **Critérios de aceitação:**
  - [ ] Rotas sensíveis de auth limitam abuso com resposta previsível.
  - [ ] Tentativas dentro da janela normal continuam funcionando sem falso bloqueio.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S05-AUT-003  
  **Status:** 🔴 Pendente

- [ ] **S05-HRD-003** - Hardening de `/api/remove-bg` com autenticação, limite de taxa e logs seguros

  **Descrição curta:**
  - O endpoint público de remove-bg pode ser abusado para consumo indevido de API externa.
  - A proteção deve ficar alinhada ao fluxo administrativo da aplicação.

  **Implementação sugerida:**
  - Exigir autenticação e autorização explícita no endpoint sensível.
  - Aplicar rate limiting dedicado para evitar exaustão de créditos/recursos.
  - Migrar `console.*` para logger estruturado com redaction em erros operacionais.

  **Arquivos/áreas afetadas:** `src/app/api/remove-bg/route.ts`, `src/app/api/admin/remove-bg/route.ts`, `src/lib/logger.ts`, `src/lib/log-redaction.ts`, `src/middleware.ts`

  **Critérios de aceitação:**
  - [ ] Endpoint remove-bg não é acessível anonimamente para operação custosa.
  - [ ] Excesso de chamadas retorna `429` e logs não vazam dados sensíveis.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S05-HRD-002  
  **Status:** 🔴 Pendente

### 📦 Testes, homologação e governança de release - Go/no-go seguro da Sprint 05

#### Objetivo

Converter as mudanças de segurança em critérios objetivos de release com cobertura automatizada e validação operacional. A categoria cobre testes críticos, monitoramento pós-deploy e formalização de rollback.

#### QA.1 - Qualidade e operação de segurança

- [ ] **S05-QA-001** - Cobrir integração dos fluxos de token, senha e anti-enumeração

  **Descrição curta:**
  - A sprint altera contratos sensíveis de auth e precisa de cobertura para regressão.
  - Devemos validar geração/expiração/consumo de token e respostas neutras de segurança.

  **Implementação sugerida:**
  - Criar/expandir suites de integração para `register`, `verify-email`, `forgot-password` e `reset-password`.
  - Cobrir cenários de token expirado, token reutilizado e senha fora da política.
  - Cobrir comportamento anti-enumeração para email existente/inexistente.

  **Arquivos/áreas afetadas:** `src/app/api/auth/**/__tests__/*.integration.test.ts`, `vitest.integration.config.ts`

  **Critérios de aceitação:**
  - [ ] Regras críticas de token e senha estão cobertas por testes de integração.
  - [ ] Cenários de enumeração falham com segurança sem quebrar UX.

  **Prioridade:** 🔴 Crítica  
  **Estimativa:** 6h  
  **Dependências:** S05-SEC-002, S05-AUT-003  
  **Status:** 🔴 Pendente

- [ ] **S05-QA-002** - Validar rate limiting e hardening de remove-bg em testes de carga leve

  **Descrição curta:**
  - Precisamos garantir defesa a abuso sem bloquear tráfego legítimo.
  - A validação deve cobrir autenticação, limites de taxa e resposta operacional.

  **Implementação sugerida:**
  - Criar cenários de burst controlado para endpoints de auth/remove-bg.
  - Validar resposta `429`, cabeçalhos de retry e recuperação após janela.
  - Atualizar pipeline para executar suíte crítica de segurança no gate da sprint.

  **Arquivos/áreas afetadas:** `src/app/api/auth/**/__tests__/*.integration.test.ts`, `src/app/api/remove-bg/**/__tests__/*.integration.test.ts`, `.github/workflows/ci.yml`, `package.json`

  **Critérios de aceitação:**
  - [ ] Endpoints limitados por taxa respondem de forma consistente sob carga leve.
  - [ ] CI detecta regressão de hardening antes de merge em branch protegida.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 5h  
  **Dependências:** S05-HRD-002, S05-HRD-003  
  **Status:** 🔴 Pendente

- [ ] **S05-QA-003** - Executar checklist de homologação e plano de rollback da Sprint 05

  **Descrição curta:**
  - A liberação exige evidências operacionais e decisão formal de go/no-go.
  - O fechamento da sprint deve registrar resultado técnico e responsabilidades.

  **Implementação sugerida:**
  - Executar checklist manual definido na Sprint 05 para token, enumeração e rate limit.
  - Consolidar evidências e decisão operacional em log da sprint.
  - Validar RTO de rollback e atualizar status final da fase.

  **Arquivos/áreas afetadas:** `docs/ROADMAP/SPRINTS/sprint-05-hardening-identidade-seguranca.md`, `docs/ROADMAP/Logs/S05-SEC-003.md` (novo), `docs/development/tasks/PHASE-05-hardening-identidade-seguranca.md`

  **Critérios de aceitação:**
  - [ ] Checklist de homologação executado com evidências rastreáveis.
  - [ ] Plano de rollback validado com responsáveis e decisão de go/no-go.

  **Prioridade:** 🟡 Alta  
  **Estimativa:** 3h  
  **Dependências:** S05-QA-001, S05-QA-002  
  **Status:** 🔴 Pendente

---

## 🧪 Testes e Validações

- **Suites necessárias:** Unitário (Vitest) para política de senha/token; integração (Vitest) para auth/remove-bg; E2E crítico (Playwright) para regressão de login/reset; smoke pós-deploy.
- **Cobertura alvo:** 100% dos cenários P0 da Sprint 05 e >=80% de branches nos módulos críticos de auth.
- **Comandos de verificação:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:unit`, `npm run test:integration`, `npm run test:integration:critical`, `npm run test:e2e:critical:ci`.
- **Estado atual:** ⚠️ Planejado para execução na Sprint 05.

---

## 📚 Documentação e Comunicação

- Atualizar `docs/development/TASKS.md` com status da Fase 05 quando arquivo índice existir.
- Atualizar `docs/development/CHANGELOG.md` com entregas de segurança da Sprint 05 (quando criado).
- Registrar evidências por tarefa em `docs/ROADMAP/Logs/S05-*.md`.
- Atualizar `docs/03-seguranca-governanca/01-hardening-backlog.md` com decisões finais da sprint.
- Atualizar `docs/04-setup-e-integracoes/ENVIRONMENT_VARIABLES.md` caso novas variáveis de rate limit/SMTP sejam adicionadas.

---

## ✅ Checklist de Encerramento da Fase

- [ ] Todas as tarefas da Fase 05 marcadas como concluídas.
- [ ] Migrações de schema aplicadas e versionadas (se houver mudança de token hash/índices).
- [ ] Testes unitários, integração e suites críticas executados e passando.
- [ ] Endpoints públicos de auth sem enumeração e com rate limiting ativo.
- [ ] Logs de segurança sem exposição de PII/token em texto puro.
- [ ] Checklist de homologação e plano de rollback da Sprint 05 evidenciados.
- [ ] Aprovação final registrada (engenharia, QA e produto).
