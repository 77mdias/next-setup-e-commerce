import type { Product, Prisma } from "@prisma/client";
import { BaseRepository, type RepositoryFilter } from "./base.repository";

/**
 * Product filter - specific to Product entity
 * GRASP: Information Expert - Filter belongs to Product domain
 */
export interface ProductFilter extends RepositoryFilter {
  categoryId?: string;
  storeId?: string;
  brandId?: string;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

/**
 * IProductRepository - Product-specific repository interface
 * Extends IRepository with Product-specific methods
 *
 * GRASP: Protected Variations - Stable interface, implementation can change
 */
export interface IProductRepository {
  findByCategory(categoryId: string, limit?: number): Promise<Product[]>;
  findFeatured(storeId: string, limit?: number): Promise<Product[]>;
  findMany(filter?: ProductFilter): Promise<Product[]>;
  findManyPaginated(filter?: ProductFilter): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

/**
 * ProductRepository - Repository for Product entity
 *
 * GRASP: Information Expert - ProductRepository knows Product data structure
 * GRASP: Creator - ProductRepository responsible for Product CRUD operations
 */
export class ProductRepository extends BaseRepository<
  Product,
  string,
  Prisma.ProductUncheckedCreateInput,
  Prisma.ProductUncheckedUpdateInput,
  Prisma.ProductWhereInput
> {
  protected getModelName(): string {
    return "product";
  }

  protected getUniqueField(): keyof Product {
    return "id";
  }

  protected getIncludeRelations(): Record<string, boolean> {
    return {
      images: true,
      category: true,
      brand: true,
      variants: true,
    };
  }

  /**
   * findByCategory - Find products in category
   * GRASP: Information Expert - Category filtering is Product responsibility
   */
  async findByCategory(categoryId: string, limit = 20): Promise<Product[]> {
    return this.db.product.findMany({
      where: { categoryId, isActive: true },
      include: this.getIncludeRelations(),
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * findFeatured - Find featured products for store
   * GRASP: Information Expert - Featured products are Product domain knowledge
   */
  async findFeatured(storeId: string, limit = 5): Promise<Product[]> {
    return this.db.product.findMany({
      where: { storeId, isFeatured: true, isActive: true },
      include: this.getIncludeRelations(),
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * findMany - Override with ProductFilter support
   */
  async findMany(filter?: ProductFilter): Promise<Product[]> {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = filter || {};
    const skip = (page - 1) * limit;

    return this.db.product.findMany({
      where: this.buildWhereClause(filter),
      include: this.getIncludeRelations(),
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * findManyPaginated - Full pagination support
   */
  async findManyPaginated(filter?: ProductFilter): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
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

  /**
   * count - Override with ProductFilter support
   */
  async count(filter?: ProductFilter): Promise<number> {
    return this.db.product.count({
      where: this.buildWhereClause(filter),
    });
  }

  /**
   * Build Prisma where clause from ProductFilter
   * GRASP: Information Expert - Where clause construction is Product's responsibility
   */
  protected buildWhereClause(filter?: ProductFilter): Prisma.ProductWhereInput {
    if (!filter) return {};

    const where: Prisma.ProductWhereInput = {};

    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.storeId) where.storeId = filter.storeId;
    if (filter.brandId) where.brandId = filter.brandId;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.isFeatured !== undefined) where.isFeatured = filter.isFeatured;

    // Price range filter
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where.price = {};
      if (filter.minPrice !== undefined) {
        (where.price as Prisma.FloatFilter<"Product">).gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        (where.price as Prisma.FloatFilter<"Product">).lte = filter.maxPrice;
      }
    }

    // Search across name and description
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: "insensitive" } },
        { description: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  /**
   * create - Override with specific Product input type
   */
  async create(data: Prisma.ProductUncheckedCreateInput): Promise<Product> {
    return this.db.product.create({
      data,
      include: this.getIncludeRelations(),
    });
  }

  /**
   * update - Override with specific Product input type
   */
  async update(id: string, data: Prisma.ProductUncheckedUpdateInput): Promise<Product> {
    return this.db.product.update({
      where: { id },
      data,
      include: this.getIncludeRelations(),
    });
  }

  /**
   * resolveCategoryIdBySlug - Find category ID by slug
   * GRASP: Information Expert - Category resolution is Product domain knowledge
   */
  async resolveCategoryIdBySlug(categorySlug: string): Promise<string | null> {
    const category = await this.db.category.findFirst({
      where: {
        slug: categorySlug,
        isActive: true,
      },
      select: {
        id: true,
      },
    });
    return category?.id ?? null;
  }

  /**
   * Product select for API responses - excludes internal fields
   */
  static readonly API_SELECT = {
    id: true,
    name: true,
    price: true,
    originalPrice: true,
    rating: true,
    images: true,
    isOnSale: true,
    isFeatured: true,
    category: {
      select: {
        name: true,
      },
    },
  } as const;

  /**
   * findManyForApi - Find products with API-specific options (custom select, dynamic orderBy, hasMore detection)
   * GRASP: Information Expert - API query construction is Product responsibility
   */
  async findManyForApi(options: {
    where: Prisma.ProductWhereInput;
    sortBy: string;
    skip: number;
    take: number;
    includeTotal?: boolean;
  }): Promise<{
    products: Prisma.ProductGetPayload<{ select: typeof ProductRepository.API_SELECT }>[];
    total: number | null;
    hasMore: boolean;
  }> {
    const { where, sortBy, skip, take, includeTotal } = options;

    const orderByMap: Record<string, Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[]> = {
      newest: { createdAt: "desc" },
      oldest: { createdAt: "asc" },
      "name-asc": { name: "asc" },
      "name-desc": { name: "desc" },
      "price-asc": { price: "asc" },
      "price-desc": { price: "desc" },
      rating: [{ rating: "desc" }, { reviewCount: "desc" }, { createdAt: "desc" }],
      "best-selling": [{ soldCount: "desc" }, { rating: "desc" }],
    };

    const orderBy = orderByMap[sortBy] ?? orderByMap.newest;

    if (includeTotal) {
      const [products, total] = await this.db.$transaction([
        this.db.product.findMany({
          where,
          select: ProductRepository.API_SELECT,
          orderBy,
          skip,
          take,
        }),
        this.db.product.count({ where }),
      ]);
      return {
        products,
        total,
        hasMore: Math.max(1, Math.ceil(total / take)) > Math.ceil(skip / take) + 1,
      };
    }

    // Fetch limit + 1 to detect hasMore
    const productsWithProbe = await this.db.product.findMany({
      where,
      select: ProductRepository.API_SELECT,
      orderBy,
      skip,
      take: take + 1,
    });

    const hasMore = productsWithProbe.length > take;
    const products = hasMore ? productsWithProbe.slice(0, take) : productsWithProbe;

    return { products, total: null, hasMore };
  }

  /**
   * buildFacets - Build product facets (categories with counts, price range)
   * GRASP: Information Expert - Facets construction is Product domain knowledge
   */
  async buildFacets(storeId: string): Promise<{
    categories: { id: string; name: string; slug: string; count: number }[];
    priceRange: { min: number; max: number };
  }> {
    const [countByCategory, priceRange] = await Promise.all([
      this.db.product.groupBy({
        by: ["categoryId"],
        where: { isActive: true, storeId },
        _count: { _all: true },
      }),
      this.db.product.aggregate({
        where: { isActive: true, storeId },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    const countsByCategoryId = new Map<string, number>(
      countByCategory.map((entry) => [entry.categoryId, entry._count._all]),
    );

    const activeCategories =
      countsByCategoryId.size === 0
        ? []
        : await this.db.category.findMany({
            where: {
              isActive: true,
              id: { in: [...countsByCategoryId.keys()] },
            },
            select: { id: true, name: true, slug: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          });

    return {
      categories: activeCategories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: countsByCategoryId.get(category.id) ?? 0,
      })),
      priceRange: {
        min: priceRange._min.price ?? 0,
        max: priceRange._max.price ?? 0,
      },
    };
  }
}