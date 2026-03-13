# Backlog Priorizado

## P0 (imediato)
1. Tokens de verificacao/reset com `crypto` e persistencia somente por hash.
2. Remover enumeracao de conta em endpoints publicos de auth.
3. Corrigir transporte SMTP para TLS estrito por padrao.
4. Hardening de `/api/remove-bg` com auth, RBAC e rate limiting.
5. Fechar risco de oversell com reserva de estoque no checkout.

## P1 (alta)
1. Painel admin MVP (`/admin`) com dashboard e RBAC.
2. Modulo admin de pedidos (filtro, detalhe, acao operacional).
3. Modulo admin de catalogo/estoque com trilha de auditoria.
4. Unificacao de politica de senha entre cadastro e reset.
5. Remover dados sensiveis desnecessarios em APIs publicas de loja.

## P2 (media)
1. Completar perfil (seguranca, preferencias e metodos de pagamento MVP).
2. Remover conteudo mock de abas de produto (descricao, especificacoes, reviews).
3. Padronizar logs estruturados sem `console.*` em rotas criticas.
4. Reconciliacao automatica de estoque com relatorio operacional.

## P3 (maturidade)
1. Alertas operacionais por SLO para auth/admin/estoque.
2. Auditoria de seguranca recorrente e baseline OWASP ASVS para release.
3. Evolucao do painel para suporte operacional (refund parcial, fraude, SLA).
