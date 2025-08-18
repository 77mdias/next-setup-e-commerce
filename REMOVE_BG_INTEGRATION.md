# 🎨 Integração com Remove.bg API

Esta documentação explica como usar a integração com a API do Remove.bg para remover o fundo das imagens dos produtos automaticamente.

## 📋 Pré-requisitos

1. **API Key do Remove.bg**
   - Acesse: https://www.remove.bg/api
   - Crie uma conta gratuita (50 imagens por mês)
   - Copie sua API Key

2. **Dependências Instaladas**
   ```bash
   npm install axios form-data
   ```

## 🚀 Como Usar

### 1. Acessar a Interface

Navegue para: `https://seudominio.com/[slug-da-loja]/admin/remove-bg`

### 2. Configurar API Key

- Clique em "Configurar API Key"
- Cole sua API Key do Remove.bg
- A chave será salva automaticamente no localStorage

### 3. Processar Imagens

1. Selecione um produto da lista
2. Clique em "Remover Fundo das Imagens"
3. Aguarde o processamento
4. As imagens processadas serão exibidas
5. Você pode baixar individualmente ou todas de uma vez

### 4. Salvar no Banco

- As imagens processadas são automaticamente salvas no banco
- Elas substituem as imagens originais do produto

## 🔧 Componentes Criados

### 1. API Routes

#### `/api/remove-bg` (POST)

Processa uma única imagem:

```typescript
{
  imageUrl: string,
  apiKey: string
}
```

#### `/api/remove-bg` (PUT)

Processa múltiplas imagens:

```typescript
{
  imageUrls: string[],
  apiKey: string
}
```

#### `/api/products/[storeSlug]` (GET)

Busca produtos de uma loja:

```typescript
Response: {
  success: boolean,
  store: Store,
  products: Product[],
  total: number
}
```

#### `/api/products/[storeSlug]` (PUT)

Atualiza imagens de um produto:

```typescript
{
  productId: string,
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
- **500**: Erro interno do servidor
- **Network**: Problemas de conexão

## 🎯 Exemplo de Uso Programático

```typescript
import { useRemoveBg } from '@/hooks/useRemoveBg';

function MyComponent() {
  const { processImage, isProcessing } = useRemoveBg();

  const handleRemoveBackground = async () => {
    const result = await processImage(
      'https://example.com/image.jpg',
      'sua-api-key-aqui'
    );

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
│   │   └── products/
│   │       └── [storeSlug]/
│   │           └── route.ts
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

- A API Key é armazenada apenas no localStorage do cliente
- As requisições são processadas no servidor (API Routes)
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
    await processMultipleImages(product.images, apiKey);
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
2. Confirme se há créditos suficientes
3. Teste com imagens menores primeiro
4. Verifique os logs do console para erros detalhados

## 🔄 Atualizações Futuras

- [ ] Suporte a mais formatos de imagem
- [ ] Interface de comparação antes/depois
- [ ] Processamento em lote automático
- [ ] Integração com serviços de armazenamento (AWS S3, Cloudinary)
- [ ] Cache de imagens processadas
- [ ] Histórico de processamentos
