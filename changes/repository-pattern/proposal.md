# Proposal: Repository Pattern Implementation

## Problema

O codebase atual apresenta alto acoplamento entre rotas API e Prisma. Cada rota usa `prisma.$query` ou `prisma.model.create()` diretamente, resultando em:

- **Acoplamentotight**: Lógica de negócio acoplada ao schema do Prisma
- **Testabilidade reduzida**: Unit tests precisam de Prisma mock pesado
- **Schema lock-in**: Mudanças no schema afetam todas as rotas
- **Duplicação de código**: Queries similares replicadas em 35+ rotas

## Scope

### In Scope
- Criar interface base `IRepository<T, TId>`
- Implementar `IProductRepository` com método `findBySlug()`
- Implementar `IOrderRepository`
- Implementar `IUserRepository`
- Criar `BaseRepository` abstract com implementação Prisma comum
- Migrar `/api/products` para usar repository (pilot)
- Migrar `/api/orders` para usar repository

### Out of Scope
- Migrar todas as rotas de uma vez (será feito progressivamente)
- Criar implementations alternativas (e.g., mock para tests)
- Mudar schema do Prisma
- Criar novo agregado de eventos

## Contexto

### Motivação
O HELL Review identificou este como **critical tech debt**. O padrão Repository permite:
- Evolução independente de camadas
- Testabilidade com mocks simples
- Isolamento de mudanças de schema

### Histórico
- Service Layer já extraído para `checkout` e `webhooks`
- ADR criado em Obsidian (`hell-adr-repository-pattern.md`)
- Decisão: **ACEITO** para implementar

## Critérios de Sucesso

### Deve Ter (MUST)
- [ ] Interface `IRepository<T, TId>` com métodos básicos
- [ ] `ProductRepository` implementado com `findBySlug()`
- [ ] `OrderRepository` implementado com métodos existentes
- [ ] `/api/products` migrado para repository
- [ ] Unit tests para repository com mocks

### Deveria Ter (SHOULD)
- [ ] `UserRepository` implementado
- [ ] TypeScript coverage > 80% para repository code
- [ ] Documentação de usage no README do vault

### Pode Ter (COULD)
- [ ] Integration tests com banco real
- [ ] Query builder helper para filtros complexos

### Não Terá (WONT)
- [ ] Reescrever todas as rotas de uma vez
- [ ] Alternativas non-Prisma (firestore, etc.)
