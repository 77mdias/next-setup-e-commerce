# Sistema de Notificações para Autenticação OAuth

## Visão Geral

Implementamos um sistema completo de notificações responsivas e elegantes para lidar com erros de autenticação OAuth, especialmente quando um usuário tenta fazer login com Google usando um email que já existe no sistema.

## Componentes Implementados

### 1. Modal (`src/components/ui/modal.tsx`)

- Modal responsivo com backdrop
- Suporte a diferentes tipos (success, error, warning, info)
- Animações suaves de entrada e saída
- Suporte a ações customizadas
- Fechamento com ESC ou clique no backdrop

### 2. Toast (`src/components/ui/toast.tsx`)

- Notificações temporárias no canto superior direito
- Auto-dismiss configurável
- Diferentes tipos visuais
- Animações de slide

### 3. Notification (`src/components/ui/notification.tsx`)

- Notificação modal especializada para erros de autenticação
- Hook `useNotification` para gerenciamento fácil
- Tipos específicos: `email_exists`, `oauth_error`, `general`

## Funcionalidades Implementadas

### Detecção de Email Já Existente

- Verificação no callback `signIn` do NextAuth
- Detecção quando usuário tenta OAuth com email já cadastrado
- Lançamento do erro `OAuthAccountNotLinked`

### Tratamento de Erros

1. **Página de Erro** (`/auth/error`):
   - Modal elegante para erro `OAuthAccountNotLinked`
   - Explicação clara do problema
   - Opções de ação (tentar novamente, voltar ao início)

2. **Notificação em Tempo Real**:
   - Notificação imediata durante tentativa de login
   - Opções para fazer login com senha ou criar nova conta
   - Feedback visual durante o processo

### Melhorias na UX

- Estados de loading nos botões OAuth
- Feedback visual durante conexão
- Mensagens claras e acionáveis
- Design responsivo e acessível

## Como Usar

### No Componente de Login

```tsx
import { useNotification } from "@/components/ui/notification";

const { showNotification, NotificationContainer } = useNotification();

// Mostrar notificação de email já existente
showNotification({
  type: "email_exists",
  title: "Email já cadastrado",
  message: "Este email já está cadastrado em nossa plataforma...",
  actions: [
    {
      label: "Fazer login com senha",
      onClick: () => router.push("/auth/signin"),
      variant: "default",
    },
    {
      label: "Criar nova conta",
      onClick: () => router.push("/auth/signup"),
      variant: "outline",
    },
  ],
});

// Renderizar o container
<NotificationContainer />;
```

### No Callback de Autenticação

```tsx
async signIn({ user, account, profile }) {
  if (account?.provider !== "credentials") {
    const existingUser = await db.user.findUnique({
      where: { email: user.email! },
      include: { accounts: true },
    });

    if (existingUser && !existingUser.accounts.some(acc => acc.provider === account?.provider)) {
      throw new Error("OAuthAccountNotLinked");
    }
  }
  return true;
}
```

## Fluxo de Usuário

1. **Usuário clica em "Continuar com Google"**
2. **Sistema verifica se email já existe**
3. **Se existir e não estiver vinculado ao Google:**
   - Mostra notificação elegante
   - Explica o problema
   - Oferece opções de ação
4. **Usuário pode:**
   - Fazer login com email/senha
   - Criar nova conta
   - Tentar com outro provedor

## Benefícios

- **Segurança**: Previne conflitos de conta
- **UX**: Feedback claro e acionável
- **Responsividade**: Funciona em todos os dispositivos
- **Acessibilidade**: Suporte a teclado e leitores de tela
- **Manutenibilidade**: Código modular e reutilizável

## Configuração

O sistema funciona automaticamente após a implementação. Certifique-se de que:

1. As variáveis de ambiente do Google OAuth estão configuradas
2. O banco de dados tem as tabelas `users` e `accounts` do NextAuth
3. O middleware está configurado corretamente

## Testando

Para testar o sistema:

1. Crie uma conta com email/senha
2. Tente fazer login com Google usando o mesmo email
3. Verifique se a notificação aparece corretamente
4. Teste as diferentes opções de ação
