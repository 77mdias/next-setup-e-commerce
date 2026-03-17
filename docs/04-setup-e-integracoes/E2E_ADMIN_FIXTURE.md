# Fixture E2E Admin

## Objetivo

Materializar credenciais determinísticas para validar o painel admin em Playwright sem depender do seed manual do projeto.

## O que o `npm run e2e:prepare` cria

O script `scripts/prepare-e2e-data.js` agora prepara:

- usuário cliente E2E para o fluxo de checkout;
- usuário admin E2E para o fluxo do painel;
- loja, marca, categoria e produto determinísticos;
- inventário base do produto E2E.

## Credenciais padrão

### Cliente E2E

- Email: `e2e.customer@nextstore.local`
- Senha: `E2eCheckout#123`

### Admin E2E

- Email: `e2e.admin@nextstore.local`
- Senha: `E2eAdmin#123`
- Role padrão: `ADMIN`

## Por que a role padrão é `ADMIN`

O schema local já prevê `STORE_ADMIN`, mas alguns ambientes de banco ainda podem não ter o enum migrado. Para manter a fixture utilizável mesmo nesses cenários, o prepare usa `ADMIN` por padrão.

Se o banco alvo já tiver o enum atualizado, a role pode ser sobrescrita com:

```bash
E2E_ADMIN_ROLE=STORE_ADMIN npm run e2e:prepare
```

## Variáveis de ambiente suportadas

```bash
E2E_USER_EMAIL
E2E_USER_PASSWORD
E2E_ADMIN_EMAIL
E2E_ADMIN_PASSWORD
E2E_ADMIN_ROLE
E2E_STORE_SLUG
E2E_BRAND_SLUG
E2E_CATEGORY_SLUG
E2E_PRODUCT_SKU
```

## Comandos úteis

Preparar fixture:

```bash
npm run e2e:prepare
```

Rodar smoke do catálogo admin:

```bash
NEXT_PUBLIC_BASE_URL=http://127.0.0.1:3100 \
NEXTAUTH_URL=http://127.0.0.1:3100 \
NEXTAUTH_COOKIE_SECURE=false \
npx playwright test --config playwright.config.ts e2e/admin-catalog-critical-flow.spec.ts --grep @critical
```

Rodar suíte crítica completa:

```bash
npm run test:e2e:critical:ci
```

## Cobertura adicionada

O arquivo `e2e/admin-catalog-critical-flow.spec.ts` valida:

- login com credencial admin determinística;
- redirect para `/admin/catalog`;
- carregamento do módulo de catálogo;
- presença do produto E2E preparado.
