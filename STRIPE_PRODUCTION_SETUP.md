# 🔧 Configuração do Stripe em Produção

## 🚨 Problemas Comuns em Produção

### 1. **Variáveis de Ambiente Não Configuradas**

Certifique-se de que as seguintes variáveis estão configuradas no Vercel:

```bash
# Stripe (Produção)
STRIPE_SECRET_KEY=sk_live_...  # Chave de produção do Stripe
STRIPE_WEBHOOK_SECRET_KEY=whsec_...  # Webhook secret de produção

# URL Base
NEXT_PUBLIC_BASE_URL=https://seu-dominio.vercel.app

# NextAuth
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta

# Banco de Dados
DATABASE_URL=sua-url-do-banco-producao
```

### 2. **Chaves do Stripe Incorretas**

**❌ Erro comum:** Usar chave de teste em produção

- `sk_test_...` = Ambiente de teste
- `sk_live_...` = Ambiente de produção

**✅ Solução:**

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com/apikeys)
2. Copie a **chave secreta de produção** (começa com `sk_live_`)
3. Configure no Vercel

### 3. **URLs de Redirecionamento Inválidas**

**❌ Problema:** URLs de sucesso/cancelamento não funcionam

**✅ Solução:**

1. Configure `NEXT_PUBLIC_BASE_URL` corretamente
2. URLs devem ser HTTPS em produção
3. Domínio deve estar registrado no Stripe

### 4. **Webhooks Não Configurados**

**❌ Problema:** Pedidos não são atualizados após pagamento

**✅ Solução:**

1. Configure webhook no Stripe Dashboard
2. URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
3. Eventos necessários:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

## 🔍 Debug em Produção

### 1. **Verificar Logs no Vercel**

```bash
# Acesse o dashboard do Vercel
# Vá para Functions > api/checkout
# Verifique os logs de erro
```

### 2. **Testar Configuração**

Crie uma rota de teste temporária:

```typescript
// src/app/api/test-stripe/route.ts
export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-07-30.basil",
    });

    // Testar conexão
    const account = await stripe.accounts.retrieve();

    return NextResponse.json({
      success: true,
      account: account.id,
      environment: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
```

### 3. **Verificar Variáveis de Ambiente**

```bash
# No Vercel Dashboard
# Settings > Environment Variables
# Verifique se todas estão configuradas
```

## 🛠️ Passos para Configurar Produção

### 1. **Configurar Stripe Dashboard**

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com)
2. Mude para modo **Live** (produção)
3. Copie as chaves de produção

### 2. **Configurar Vercel**

1. Acesse [Vercel Dashboard](https://vercel.com)
2. Selecione seu projeto
3. Vá para **Settings > Environment Variables**
4. Adicione todas as variáveis necessárias

### 3. **Configurar Webhooks**

1. No Stripe Dashboard > Webhooks
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
4. Eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 4. **Testar Checkout**

1. Faça um pedido de teste
2. Use cartão de teste: `4242 4242 4242 4242`
3. Verifique se redireciona corretamente

## 🚨 Troubleshooting

### Erro: "Configuração do Stripe não encontrada"

- Verifique se `STRIPE_SECRET_KEY` está configurada
- Certifique-se de usar chave de produção (`sk_live_`)

### Erro: "URL base não configurada"

- Configure `NEXT_PUBLIC_BASE_URL` no Vercel
- Use HTTPS em produção

### Erro: "Invalid API key"

- Verifique se a chave está correta
- Certifique-se de usar chave de produção

### Erro: "Invalid redirect URL"

- Configure domínio no Stripe Dashboard
- Verifique se URLs são HTTPS

## 📞 Suporte

Se ainda houver problemas:

1. Verifique os logs no Vercel
2. Teste a configuração com a rota de teste
3. Verifique se todas as variáveis estão configuradas
4. Confirme se está usando chaves de produção do Stripe
