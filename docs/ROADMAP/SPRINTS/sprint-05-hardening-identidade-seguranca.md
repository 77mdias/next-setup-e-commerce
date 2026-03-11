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

## Etapa 4 - Testes e homologacao (S05-SEC-003)

- Testes de integracao para fluxos de token (geracao, expiracao, invalidacao e reuso).
- Testes de contrato para respostas anti-enumeracao.
- Testes de carga leve para validar limite por IP e resposta `429`.
- Janela recomendada de deploy: dias uteis 10:00-12:00 (America/Sao_Paulo), com monitoramento por 60 minutos.

### Checklist manual de homologacao (S05-SEC-003)

| Cenario | Resultado esperado | Evidencia tecnica | Status |
| --- | --- | --- | --- |
| Reset de senha com token valido | Senha alterada uma unica vez e token invalidado | Suite `src/app/api/auth/reset-password/__tests__/*.integration.test.ts` | [ ] |
| Reuso de token de reset/verificacao | Endpoint rejeita token usado/expirado sem detalhe sensivel | Suites de `reset-password` e `verify-email` | [ ] |
| Enumeracao de conta via endpoint publico | Resposta generica independente de email existente | Suite `src/app/api/auth/__tests__/*` + smoke manual | [ ] |
| Rate limiting de auth/remove-bg | Excesso de tentativas retorna `429` e nao quebra fluxo legitimo | Suite de integracao + log operacional da release | [ ] |

### Plano de rollback (S05-SEC-003)

- **RTO alvo:** ate 20 minutos apos decisao de rollback.
- **Gatilhos:**
  - aumento anormal de falha em login/reset;
  - bloqueio indevido de usuarios legitimos por rate limit;
  - falha em envio de email transacional.
- **Passos de rollback:**
  1. Reverter release para versao estavel anterior.
  2. Desativar temporariamente regras novas de rate limit via configuracao.
  3. Validar smoke de login, reset e verificacao de email.
  4. Registrar incidente e causa raiz no log da sprint.
- **Responsaveis:** engenharia backend/auth, QA e produto.

## Criterios de aceite

- Tokens de verificacao/reset sao gerados com criptografia forte e nao ficam em plaintext no banco.
- Politica de senha e unificada entre cadastro e reset.
- Endpoints publicos de auth nao permitem enumeracao de conta.
- Rate limiting aplicado e validado em rotas sensiveis.
- Checklist e plano de rollback executaveis com evidencia.
