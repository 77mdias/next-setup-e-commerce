# Configuração do Google OAuth

## Problema Identificado

A autenticação do Google está redirecionando para a página de login ao invés da página da loja.

## Soluções Implementadas

### 1. Configuração do Callback de Redirecionamento

O callback de redirecionamento foi ajustado para:

- Extrair o `callbackUrl` da URL quando presente
- Redirecionar corretamente para a página da loja após autenticação
- Adicionar logs para debug

### 2. Configuração do Google Console

#### URLs de Redirecionamento Autorizadas

No Google Cloud Console, configure as seguintes URLs de redirecionamento:

**Para desenvolvimento:**

```
http://localhost:3000/api/auth/callback/google
```

**Para produção:**

```
https://seudominio.com/api/auth/callback/google
```

#### URLs JavaScript Autorizadas

**Para desenvolvimento:**

```
http://localhost:3000
```

**Para produção:**

```
https://seudominio.com
```

### 3. Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no arquivo `.env.local`:

```env
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-nextauth-secret"
```

### 4. Configurações do NextAuth

As seguintes configurações foram ajustadas:

- **Callback de redirecionamento**: Melhorado para lidar com `callbackUrl`
- **Páginas personalizadas**: Ajustadas para redirecionamento correto
- **Middleware**: Modificado para não interferir durante OAuth
- **Configuração do Google Provider**: Adicionados parâmetros de autorização

### 5. Debug

Logs foram adicionados para debug:

- Verificação das variáveis de ambiente
- Logs no callback de redirecionamento
- Verificação do processo de autenticação

## Como Testar

1. Certifique-se de que todas as variáveis de ambiente estão configuradas
2. Reinicie o servidor de desenvolvimento
3. Acesse a página da loja
4. Clique no botão de login
5. Escolha "Continuar com Google"
6. Verifique se o redirecionamento funciona corretamente

## Logs de Debug

Verifique o console do servidor para ver os logs de debug que ajudarão a identificar problemas específicos.

## Problemas Comuns

1. **URLs de redirecionamento incorretas**: Verifique se as URLs no Google Console estão corretas
2. **Variáveis de ambiente não configuradas**: Verifique se todas as variáveis estão no arquivo `.env.local`
3. **NEXTAUTH_URL incorreta**: Certifique-se de que a URL está correta para seu ambiente
4. **Domínio não autorizado**: Verifique se o domínio está nas URLs JavaScript autorizadas
