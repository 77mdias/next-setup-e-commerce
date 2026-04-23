import type { Prisma } from "@prisma/client";
import { db } from "@/lib/prisma";

/**
 * IRepository - Protected Variations pattern
 * Interface that abstracts data access, allowing different implementations
 * (Prisma, mock, in-memory, cache, etc.) without changing consuming code.
 *
 * GRASP: Information Expert - Repository holds data access logic
 */
export interface IRepository<T, TId> {
  findById(id: TId): Promise<T | null>;
  findMany(filter?: RepositoryFilter): Promise<T[]>;
  create(data: unknown): Promise<T>;
  update(id: TId, data: unknown): Promise<T>;
  delete(id: TId): Promise<void>;
  count(filter?: RepositoryFilter): Promise<number>;
}

/**
 * Pagination & Filter interfaces
 * GRASP: Information Expert - Filter object encapsulates query criteria
 */
export interface RepositoryFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * BaseRepository abstract class
 * GRASP: Creator - BaseRepository creates and manages repository instances
 * GRASP: Protected Variations - Provides stable interface, implementation can vary
 */
export abstract class BaseRepository<
  T,
  TId,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TWhereInput = Record<string, unknown>,
> implements IRepository<T, TId>
{
  /**
   * Get Prisma model name (e.g., 'Product', 'Order')
   */
  protected abstract getModelName(): string;

  /**
   * Get the unique identifier field name (e.g., 'id', 'slug')
   */
  protected abstract getUniqueField(): keyof T;

  /**
   * Get default relations to include
   */
  protected abstract getIncludeRelations(): Record<string, boolean>;

  /**
   * Build where clause from filter (override in subclasses)
   */
  protected buildWhereClause(_filter?: RepositoryFilter): TWhereInput {
    return {} as TWhereInput;
  }

  protected get db() {
    return db;
  }

  /**
   * Default implementation for findById
   * Subclasses can override for custom includes
   */
  async findById(id: TId): Promise<T | null> {
    const result = await (this.db as any)[this.getModelName()].findUnique({
      where: { [this.getUniqueField()]: id },
      include: this.getIncludeRelations(),
    });
    return result as T | null;
  }

  /**
   * Default implementation for findMany with pagination
   * Subclasses override to add specific filters
   */
  async findMany(filter?: RepositoryFilter): Promise<T[]> {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = filter || {};

    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder };

    const result = await (this.db as any)[this.getModelName()].findMany({
      where: this.buildWhereClause(filter),
      include: this.getIncludeRelations(),
      skip,
      take: limit,
      orderBy,
    });
    return result as T[];
  }

  /**
   * Paginated findMany with total count
   */
  async findManyPaginated(filter?: RepositoryFilter): Promise<PaginationResult<T>> {
    const { page = 1, limit = 20 } = filter || {};
    const items = await this.findMany(filter);
    const total = await this.count(filter);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: TCreateInput): Promise<T> {
    const result = await (this.db as any)[this.getModelName()].create({
      data,
      include: this.getIncludeRelations(),
    });
    return result as T;
  }

  async update(id: TId, data: TUpdateInput): Promise<T> {
    const result = await (this.db as any)[this.getModelName()].update({
      where: { [this.getUniqueField()]: id },
      data,
      include: this.getIncludeRelations(),
    });
    return result as T;
  }

  async delete(id: TId): Promise<void> {
    await (this.db as any)[this.getModelName()].delete({
      where: { [this.getUniqueField()]: id },
    });
  }

  async count(filter?: RepositoryFilter): Promise<number> {
    const result = await (this.db as any)[this.getModelName()].count({
      where: this.buildWhereClause(filter),
    });
    return result;
  }
}