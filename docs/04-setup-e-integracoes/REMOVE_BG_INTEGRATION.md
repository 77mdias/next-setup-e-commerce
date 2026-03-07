# 🎨 Integração com Remove.bg API

Esta documentação explica como usar a integração com a API do Remove.bg para remover o fundo das imagens dos produtos automaticamente.

## 📋 Pré-requisitos

1. **API Key do Remove.bg (server-side)**
   - Acesse: https://www.remove.bg/api
   - Crie uma conta gratuita (50 imagens por mês)
   - Configure no servidor via `REMOVE_BG_API_KEY`
   - Defina allowlist de origem via `REMOVE_BG_ALLOWED_IMAGE_HOSTS` e `REMOVE_BG_ALLOWED_IMAGE_PROTOCOLS`

2. **Dependências Instaladas**
   ```bash
   npm install axios form-data
   ```

## 🚀 Como Usar

### 1. Acessar a Interface

Navegue para: `https://seudominio.com/[slug-da-loja]/admin/remove-bg`

### 2. Processar Imagens

1. Selecione um produto da lista
2. Use busca por nome e paginação para localizar produtos em catálogos maiores
3. Clique em "Remover Fundo das Imagens"
4. Aguarde o processamento
5. As imagens processadas serão exibidas
6. Você pode baixar individualmente ou todas de uma vez

### 3. Salvar no Banco

- As imagens processadas são automaticamente salvas no banco
- Elas substituem as imagens originais do produto

## 🔧 Componentes Criados

### 1. API Routes

#### `/api/admin/remove-bg` (POST/PUT)

Endpoint dedicado para a tela administrativa `/${slug}/admin/remove-bg`.

- Exige sessão autenticada com role `ADMIN`.
- Retorna `401` para sessão ausente e `403` para usuário sem privilégio administrativo.
- Mantém contrato de processamento de imagem única (`POST`) e lote (`PUT`) com erros operacionais padronizados.

#### `/api/remove-bg` (POST)

Processa uma única imagem:

```typescript
{
  imageUrl: string;
}
```

#### `/api/remove-bg` (PUT)

Processa múltiplas imagens:

```typescript
{
  imageUrls: string[]
}
```

#### `/api/products` (GET)

Busca os produtos da loja ativa:

- Suporta `page`, `limit` e `query` para paginação e busca por nome.

```typescript
Response: {
  success: boolean,
  store: Store,
  products: Product[],
  total: number | null
}
```

#### `/api/admin/products/[productId]/images` (PUT)

Atualiza as imagens processadas de um produto (uso administrativo):

```typescript
{
  processedImages: string[]
}
```

### 2. Hook Customizado

#### `useRemoveBg()`

```typescript
const { isProcessing, processImage, processMultipleImages, progress } =
  useRemoveBg();
```

### 3. Componentes React

#### `RemoveBgProcessor`

```tsx
<RemoveBgProcessor
  productId={product.id}
  images={product.images}
  onImagesProcessed={(processedImages) => {
    // Callback quando imagens são processadas
  }}
/>
```

## 💰 Custos e Limites

### Plano Gratuito

- 50 imagens por mês
- Resolução até 0.25 megapixels
- Formato PNG de saída

### Planos Pagos

- A partir de $9.99/mês
- Mais imagens e melhor qualidade
- Formatos adicionais

## ⚠️ Tratamento de Erros

A integração trata os seguintes erros:

- **402**: Créditos insuficientes
- **403**: API Key inválida
- **400**: URL com origem/protocolo fora da allowlist
- **500**: Erro interno do servidor
- **Network**: Problemas de conexão

## 🎯 Exemplo de Uso Programático

```typescript
import { useRemoveBg } from '@/hooks/useRemoveBg';

function MyComponent() {
  const { processImage, isProcessing } = useRemoveBg();

  const handleRemoveBackground = async () => {
    const result = await processImage('https://example.com/image.jpg');

    if (result.success) {
      console.log('Imagem processada:', result.processedImage);
    } else {
      console.error('Erro:', result.error);
    }
  };

  return (
    <button
      onClick={handleRemoveBackground}
      disabled={isProcessing}
    >
      {isProcessing ? 'Processando...' : 'Remover Fundo'}
    </button>
  );
}
```

## 📁 Estrutura de Arquivos

```
src/
├── app/
│   ├── api/
│   │   ├── remove-bg/
│   │   │   └── route.ts
│   │   ├── products/
│   │   │   └── route.ts
│   │   └── admin/
│   │       └── products/
│   │           └── [productId]/
│   │               └── images/
│   │                   └── route.ts
│   └── [slug]/
│       └── admin/
│           └── remove-bg/
│               └── page.tsx
├── components/
│   └── RemoveBgProcessor.tsx
└── hooks/
    └── useRemoveBg.ts
```

## 🔐 Segurança

- A API Key permanece apenas no servidor (`REMOVE_BG_API_KEY`)
- As requisições são processadas no servidor (API Routes)
- O endpoint administrativo dedicado (`/api/admin/remove-bg`) valida sessão e role `ADMIN` explicitamente
- A persistência de imagens também usa endpoint administrativo dedicado (`/api/admin/products/[productId]/images`) com validação de sessão/role
- URLs de imagem são validadas por protocolo/host antes de qualquer download externo
- Validação de dados em todas as rotas
- Tratamento seguro de erros

## 🚨 Limitações

1. **Tamanho de Arquivo**: Máximo recomendado de 10MB por imagem
2. **Formatos Suportados**: JPG, PNG, WebP
3. **Rate Limiting**: 1 requisição por segundo (implementado delay)
4. **Qualidade**: Dependente do plano da API

## 🛠️ Customizações Possíveis

### 1. Adicionar Upload Direto

```typescript
// Permitir upload de novas imagens
const handleFileUpload = (files: FileList) => {
  // Processar arquivos locais
};
```

### 2. Batch Processing Avançado

```typescript
// Processar todos os produtos de uma loja
const processAllProducts = async () => {
  for (const product of products) {
    await processMultipleImages(product.images);
  }
};
```

### 3. Preview Antes/Depois

```typescript
// Mostrar comparação lado a lado
const PreviewComparison = ({ original, processed }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <img src={original} alt="Original" />
      <img src={processed} alt="Sem fundo" />
    </div>
  );
};
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique se a API Key está correta
   - Valor deve estar em `REMOVE_BG_API_KEY` no servidor
2. Verifique se a origem da imagem está permitida na allowlist
3. Confirme se há créditos suficientes
4. Teste com imagens menores primeiro
5. Verifique os logs do console para erros detalhados

## 🔄 Atualizações Futuras

- [ ] Suporte a mais formatos de imagem
- [ ] Interface de comparação antes/depois
- [ ] Processamento em lote automático
- [ ] Integração com serviços de armazenamento (AWS S3, Cloudinary)
- [ ] Cache de imagens processadas
- [ ] Histórico de processamentos
