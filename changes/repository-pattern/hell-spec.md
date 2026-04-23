---
Project: "next-setup-e-commerce"
HELL_Phase: Requisitos
Status: 🔥 ACTIVE
Patterns_Used: [Information_Expert, Creator, Protected_Variations, Controller]
---

# HELL Specification: Repository Pattern

## Requisitos Funcionais

### Atores

| Ator | Descrição | Permissões |
|------|-----------|------------|
| API Route | Consome repository via interface | Ler/escrever dados |
| Service Layer | Usa repository para lógica de negócio | Depends on entity |
| Test Suite | Usa mocks para unit tests | Read-only |

### Casos de Uso

#### UC-01: Buscar Produto por Slug
- **Ator:** API Route / Service
- **Pré-condições:** Slug válido existe no banco
- **Fluxo principal:**
  1. Service/Route chama `productRepository.findBySlug(slug)`
  2. Repository executa `prisma.product.findUnique({ where: { slug } })`
  3. Repository aplica include para relations (images, stock)
  4. Retorna `Product | null`
- **Pós-condições:** Produto com todas as relations carregadas
- **Edge cases:**
  - Slug não existe → retorna null
  - Produto inativo → retorna null ou exclui conforme config

#### UC-02: Listar Produtos com Filtros
- **Ator:** API Route / Service
- **Pré-condições:** -
- **Fluxo principal:**
  1. Service/Route chama `productRepository.findMany(filter)`
  2. Repository constrói where clause a partir do filter
  3. Repository aplica paginação
  4. Retorna `{ items: Product[], total: number }`
- **Edge cases:**
  - Filtro inválido → ignora filtro
  - Página > total → retorna array vazio

#### UC-03: Criar Order
- **Ator:** CheckoutService
- **Pré-condições:** Items validados, estoque disponível
- **Fluxo principal:**
  1. Service chama `orderRepository.create(data)`
  2. Repository inicia transaction Prisma
  3. Repository cria Order + OrderItems
  4. Repository cria StockReservations
  5. Commits transaction
  6. Retorna Order criada
- **Edge cases:**
  - Estoque insuficiente → lança exceção antes de criar
  - Transaction falha → rollback automático

#### UC-04: Buscar Order por ID
- **Ator:** API Route
- **Pré-condições:** Order existe, user tem acesso
- **Fluxo principal:**
  1. Route chama `orderRepository.findById(orderId)`
  2. Repository verifica access control (userId ou admin)
  3. Repository executa query com includes
  4. Retorna Order com OrderItems, ShippingInfo, PaymentInfo
- **Edge cases:**
  - Order não existe → null
  - User não tem acesso → null (não expõe existência)

### Edge Cases Globais
- Database connection lost → retry com backoff, após 3 tentativas retorna 503
- Concurrent update (stale data) → Optimistic locking via `updatedAt`
- Massive query (>1000 results) → Enforce pagination limits

## Requisitos Não-Funcionais

| Requisito | Critério | Medida |
|-----------|----------|--------|
| **Performance** | Latência query simples | < 50ms p95 |
| **Performance** | Latência query com join | < 150ms p95 |
| **Escalabilidade** | Concurrency | 100+ requests simultâneos |
| **Segurança** | Acesso a dados | Apenas dados próprios ou admin |
| **Maintainability** | Acoplamento | Repository é única dependência de data |

## Constraints (Stack Obrigatória)

- **Framework:** Next.js 15 App Router
- **ORM:** Prisma Client (PostgreSQL)
- **Language:** TypeScript strict mode
- **Testing:** Vitest + mocks

## Domain Model (GRASP Analysis)

### Entidades e Information Expert

| Entidade | Repository (IE) | Justificativa |
|----------|------------------|---------------|
| **User** | `UserRepository` | Detém email, role, auth data |
| **Product** | `ProductRepository` | Detém dados de produto + images |
| **Order** | `OrderRepository` | Detém order + items + status |
| **Store** | `StoreRepository` | Detém dados de loja |
| **Cart** | `CartRepository` | Detém items do carrinho |

### Value Objects

| VO | Atributos | Uso |
|----|-----------|-----|
| `ProductFilter` | categoryId?, storeId?, search?, page?, limit? | Listagem com filtros |
| `OrderFilter` | userId?, status?, dateFrom?, dateTo? | Listagem orders |
| `Pagination` | page, limit, sortBy, sortOrder | Controle paginação |

### Aggregates

| Aggregate | Root | Boundary |
|-----------|------|----------|
| **OrderAggregate** | Order | OrderItem, ShippingInfo, PaymentInfo, StockReservation |
| **CartAggregate** | Cart | CartItem |
| **ProductAggregate** | Product | ProductImage, StockReservation, Review |

### Creator Pattern (Quem cria cada entidade)

| Entidade | Creator | Via |
|----------|---------|-----|
| User | `UserRepository.create()` | Registration flow |
| Product | `ProductRepository.create()` | Admin catalog |
| Order | `OrderRepository.create()` | Checkout flow |
| OrderItem | Criado via `Order.create()` | Inside transaction |

## Variation Points (Protected Variations)

| Ponto de Variação | Interface | Implementação Estável |
|------------------|-----------|---------------------|
| **Data source** | `IRepository<T, TId>` | `PrismaRepository<T>` |
| **Query building** | `Filter` objects | `PrismaWhereBuilder` |
| **Transactions** | `UnitOfWork` interface | `PrismaTransaction` |
| **Caching** | `ICacheRepository` (future) | Memory/in-memory |

### Interfaces Estáveis

```typescript
// Interface que NÃO muda ( Protected Variations )
interface IRepository<T, TId> {
  findById(id: TId): Promise<T | null>;
  findMany(filter?: Filter): Promise<T[]>;
  create(data: CreateInput<T>): Promise<T>;
  update(id: TId, data: UpdateInput<T>): Promise<T>;
  delete(id: TId): Promise<void>;
  count(filter?: Filter): Promise<number>;
}

// Interface variante ( pode ter múltiplas implementações )
interface IProductRepository extends IRepository<Product, string> {
  findBySlug(slug: string): Promise<Product | null>;
  findByCategory(categoryId: string): Promise<Product[]>;
  findFeatured(storeId: string, limit: number): Promise<Product[]>;
}
```

## Ubiquitous Language

| Termo | Definição | Sinônimo |
|-------|-----------|----------|
| **Repository** | Abstração que expõe interface de acesso a dados | DAO (Data Access Object) |
| **Filter** | Objeto de criteria para busca | Query params, Search criteria |
| **Include** | Relation loading no Prisma | Join, Eager loading |
| **Transaction** | Série de operações atômicas | Atomic operation |
| **Unit of Work** | Coordination de múltiplas mudanças | Transaction scope |

## Gate Check

- [x] Todos requisitos têm prioridade (MUST/SHOULD/COULD/WONT)
- [x] Domain model com Entidades, VOs, Aggregates
- [x] Information Expert aplicado a cada entidade
- [x] Creator identificado para cada entidade
- [x] Variation points identificados com interfaces
- [x] Glossary documentado

**Gate Status: PASSED ✅**

## Próximos Passos

1. → `/dos-hell:tdd` — Iniciar ciclo TDD com repository tests
2. → Implementar `BaseRepository` abstract
3. → Implementar `ProductRepository` primeiro (pilot)
4. → Migrar `/api/products` para usar repository
