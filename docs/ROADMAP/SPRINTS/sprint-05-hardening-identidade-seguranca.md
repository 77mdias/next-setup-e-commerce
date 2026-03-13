# Sprint 05 - Hardening de Identidade e Seguranca

## Objetivo

Fechar riscos remanescentes de autenticacao, tokens, transporte e abuso de API para preparar a base do painel administrativo e operacao em ambiente real.

## Etapa 1 - Discovery

- Revisar fluxos de `register`, `forgot-password`, `reset-password`, `verify-email` e contratos de erro.
- Mapear endpoints publicos com potencial de enumeracao e abuso (`auth` e `remove-bg`).
- Revisar politica de senha atual e divergencias entre cadastro e reset.

## Etapa 2 - Design

- Definir estrategia de token seguro:
  - geracao com `crypto.randomBytes`;
  - persistencia apenas do hash do token;
  - expiracao curta e invalidacao one-time use.
- Definir politica unica de senha para cadastro e reset (mesmos criterios de forca).
- Definir contrato anti-enumeracao para endpoints de recuperacao/descoberta de conta.
- Definir rate limiting por rota sensivel e por IP/identidade.

## Etapa 3 - Implementacao

- Migrar geracao de token para criptografia forte.
- Armazenar somente hash de tokens de reset/verificacao.
- Unificar validadores de senha em modulo compartilhado.
- Remover respostas que revelam existencia de conta em endpoints publicos.
- Ativar verificacao TLS estrita por padrao em transporte SMTP e integracoes externas.
- Aplicar rate limiting em:
  - `/api/auth/forgot-password`;
  - `/api/auth/reset-password`;
  - `/api/auth/verify-email`;
  - `/api/remove-bg`.
- Padronizar logging de seguranca sem PII sensivel.

### Politica de TTL e invalidacao de tokens (S05-SEC-003)

- TTL oficial:
  - `email verification`: 24 horas.
  - `reset password`: 1 hora.
- Regras de invalidacao no backend:
  - Emissao/reenvio (`register`, `verify-email POST`, `forgot-password`) sempre sobrescreve hash + expiracao anteriores.
  - Consumo (`verify-email GET`, `reset-password POST`) aceita apenas token com hash correspondente e expiracao maior que `now`.
  - Tentativa com token expirado aciona limpeza imediata do hash expirado correspondente.
- Rotina periodica opcional:
  - dry-run: `node scripts/cleanup-expired-auth-tokens.js`
  - apply: `npm run tokens:cleanup-expired`
  - automacao recomendada: GitHub Actions em `.github/workflows/auth-token-cleanup.yml` (schedule diario + execucao manual)

## Etapa 4 - Testes e homologacao (S05-QA-003)

- Testes de integracao para fluxos de token (geracao, expiracao, invalidacao e reuso).
- Testes de contrato para respostas anti-enumeracao.
- Testes de carga leve para validar limite por IP e resposta `429`.
- Janela recomendada de deploy: dias uteis 10:00-12:00 (America/Sao_Paulo), com monitoramento por 60 minutos.
- Janela executada de homologacao: 2026-03-13 (America/Sao_Paulo), com consolidacao de evidencias em `docs/ROADMAP/Logs/S05-QA-003.md`.

### Checklist manual de homologacao (S05-QA-003)

| Cenario                                  | Resultado esperado                                              | Evidencia tecnica                                                                                               | Status |
| ---------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| Reset de senha com token valido          | Senha alterada uma unica vez e token invalidado                 | `docs/ROADMAP/Logs/S05-QA-001.md` + suite `src/app/api/auth/reset-password/__tests__/route.integration.test.ts` | [x]    |
| Reuso de token de reset/verificacao      | Endpoint rejeita token usado/expirado sem detalhe sensivel      | `docs/ROADMAP/Logs/S05-QA-001.md` + suites `reset-password` e `verify-email`                                    | [x]    |
| Enumeracao de conta via endpoint publico | Resposta generica independente de email existente               | `docs/ROADMAP/Logs/S05-QA-001.md` + suites `forgot-password` e `verify-email`                                   | [x]    |
| Rate limiting de auth/remove-bg          | Excesso de tentativas retorna `429` e nao quebra fluxo legitimo | `docs/ROADMAP/Logs/S05-QA-002.md` + `npm run test:integration:security`                                         | [x]    |

#### Evidencias da janela de homologacao

- `npm run test:integration:security` aprovado em 2026-03-13 (7 arquivos / 42 testes).
- `npm run lint` aprovado em 2026-03-13.
- `npm run build` aprovado em 2026-03-13.
- Consolidacao operacional registrada em `docs/ROADMAP/Logs/S05-QA-003.md`.

### Plano de rollback (S05-QA-003)

- **RTO alvo:** ate 20 minutos apos decisao de rollback.
- **Escopo de reversao:** release vigente da Sprint 05 nos fluxos `register`, `forgot-password`, `reset-password`, `verify-email`, `remove-bg` e transporte de email autenticado.
- **Responsaveis:**
  - engenharia backend/auth: execucao tecnica do rollback, reversao de release e validacao dos fluxos de auth/remove-bg;
  - QA: revalidacao do smoke funcional pos-rollback;
  - produto: comunicacao da janela, decisao final de `GO`/`NO-GO` e alinhamento com stakeholders.
- **Gatilhos:**
  - aumento anormal de falha em login/reset;
  - bloqueio indevido de usuarios legitimos por rate limit;
  - falha em envio de email transacional.
- **Passos de rollback:**
  1. Reverter release para versao estavel anterior.
  2. Desativar temporariamente regras novas de rate limit via configuracao quando a regressao estiver restrita ao anti-abuso.
  3. Validar smoke de login, reset e verificacao de email.
  4. Registrar incidente e causa raiz no log da sprint.
- **Criterio de saida de rollback:**
  - release anterior restaurada com sucesso;
  - smoke de login, reset, verificacao de email e `remove-bg` aprovado;
  - sem bloqueio indevido de usuarios legitimos por rate limit;
  - incidente, causa e decisao final registrados no log operacional da sprint.

#### Matriz formal de decisao go/no-go

| Decisao                     | Condicoes objetivas                                                                                                                                 | Acao operacional                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `GO`                        | Checklist manual 100% concluido + `npm run test:integration:security`, `npm run lint` e `npm run build` verdes + sem bloqueador aberto da Sprint 05 | Prosseguir com a liberacao e encerrar a janela de homologacao                 |
| `NO-GO` (rollback imediato) | Qualquer gatilho de rollback acionado                                                                                                               | Executar sequencia de rollback e registrar incidente                          |
| `NO-GO` (hold controlado)   | Warning persistente sem gatilho critico, mas com risco operacional nao resolvido                                                                    | Congelar novos deploys e reavaliar em ate `15m` com engenharia + QA + produto |

#### Decisao final da janela de homologacao

- **Decisao:** `GO`
- **Justificativa objetiva:** checklist manual concluido, evidencias automatizadas consolidadas e gates `test:integration:security`, `lint` e `build` aprovados em 2026-03-13.

#### Aprovacao de encerramento operacional da Sprint 05

| Papel      | Escopo aprovado                                                      | Evidencia                                                                                | Status |
| ---------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| Engenharia | Gatilhos, sequencia de rollback, RTO e criterio de saida             | Secao "Plano de rollback (S05-QA-003)" + `docs/ROADMAP/Logs/S05-QA-003.md`               | ✅     |
| QA         | Checklist manual da sprint, suites de seguranca e smoke pos-rollback | Secao "Checklist manual de homologacao (S05-QA-003)" + `docs/ROADMAP/Logs/S05-QA-003.md` | ✅     |
| Produto    | Janela operacional, comunicacao e decisao final `GO`                 | `docs/ROADMAP/Logs/S05-QA-003.md`                                                        | ✅     |

## Criterios de aceite

- Tokens de verificacao/reset sao gerados com criptografia forte e nao ficam em plaintext no banco.
- Politica de senha e unificada entre cadastro e reset.
- Endpoints publicos de auth nao permitem enumeracao de conta.
- Rate limiting aplicado e validado em rotas sensiveis.
- Checklist e plano de rollback executaveis com evidencia.
