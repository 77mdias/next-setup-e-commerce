# Requisitos de Deploy Seguro

## Ambiente e segredos
- `NEXTAUTH_SECRET` forte e unico por ambiente.
- Chaves Stripe validas por ambiente (dev/staging/prod).
- Credenciais SMTP seguras (senha de app, TLS valido).
- Rotacionar segredos periodicamente.

## Configuracao da aplicacao
- Desativar endpoints de teste em producao (`/api/test-stripe`).
- Definir `NEXTAUTH_URL` e `NEXT_PUBLIC_BASE_URL` corretos.
- Garantir HTTPS no ambiente de producao.
- Garantir logs com mascaramento de dados sensiveis.

## Banco de dados
- Backup automatico e testado.
- Migrations versionadas e revisadas.
- Controle de acesso minimo necessario.

## Go-live checklist
- [ ] Build e lint sem erro
- [ ] Fluxo completo de checkout validado
- [ ] Webhook Stripe validado com assinatura
- [ ] Auth (signin/signup/reset) validado
- [ ] Endpoints administrativos protegidos
- [ ] Documentacao atualizada
