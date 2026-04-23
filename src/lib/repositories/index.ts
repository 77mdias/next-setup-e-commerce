/**
 * Repository Pattern - Barrel Export
 *
 * GRASP: Protected Variations - Single import point for all repositories
 */

// Base interface and class
export {
  type IRepository,
  type RepositoryFilter,
  type PaginationResult,
  BaseRepository,
} from "./base.repository";

// Product Repository
export { type IProductRepository, type ProductFilter, ProductRepository } from "./product.repository";