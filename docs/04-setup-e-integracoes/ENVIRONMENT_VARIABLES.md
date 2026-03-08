# Variáveis de Ambiente Necessárias

Para que a autenticação funcione corretamente, você precisa configurar as seguintes variáveis de ambiente:

## Banco de Dados

```
DATABASE_URL="postgresql://username:password@localhost:5432/mystore"
DIRECT_URL="postgresql://username:password@localhost:5432/mystore"
```

## NextAuth

```
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"  # ou sua URL de produção
```

## Provedores OAuth (opcionais)

```
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Stripe

```
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET_KEY="whsec_..."
```

## Automacao DEMO de pedido (opcional)

```
DEMO_ORDER_AUTOMATION_ENABLED="true"
DEMO_ORDER_PAYMENT_CONFIRMED_AFTER_MINUTES="2"
DEMO_ORDER_PROCESSING_AFTER_MINUTES="4"
DEMO_ORDER_SHIPPED_AFTER_MINUTES="6"
DEMO_ORDER_DELIVERED_AFTER_MINUTES="8"
```

- Quando `DEMO_ORDER_AUTOMATION_ENABLED=true`, pedidos com pagamento pendente evoluem automaticamente para simular fluxo completo de demonstracao.
- Timeline padrao:
  - `~2 min`: `PENDING/PAYMENT_PENDING` -> `PAID`
  - `~4 min`: `PAID` -> `PROCESSING`
  - `~6 min`: `PROCESSING` -> `SHIPPED` (com codigo de rastreio demo)
  - `~8 min`: `SHIPPED` -> `DELIVERED`
- Os tempos podem ser ajustados pelas variaveis `*_AFTER_MINUTES`.

## Remove.bg (opcional)

```
REMOVE_BG_API_KEY="your-remove-bg-api-key"
REMOVE_BG_ALLOWED_IMAGE_HOSTS="images.kabum.com.br,m.media-amazon.com,cdn.shopify.com"
REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS="https"
```

- `REMOVE_BG_API_KEY`: segredo usado apenas no servidor (não enviar no payload cliente).
- `REMOVE_BG_ALLOWED_IMAGE_HOSTS`: lista separada por vírgula com hosts permitidos para download/processamento.
- `REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS`: protocolos permitidos (ex.: `https`).

## Email (para verificação de conta)

```
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

**Nota:** Para Gmail, você precisa usar uma "senha de app" ao invés da senha normal da conta. Para criar uma senha de app:

1. Ative a verificação em duas etapas na sua conta Google
2. Vá para "Gerenciar sua Conta Google" > "Segurança"
3. Em "Como você faz login no Google", selecione "Senhas de app"
4. Gere uma nova senha de app para este projeto

## Como obter as chaves OAuth:

### GitHub:

1. Vá para https://github.com/settings/applications/new
2. Crie uma nova OAuth App
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### Google:

1. Vá para https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Ative a Google+ API
4. Crie credenciais OAuth 2.0
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

## Gerando NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```
