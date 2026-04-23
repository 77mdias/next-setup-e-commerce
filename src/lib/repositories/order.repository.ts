import type { Order, Prisma } from "@prisma/client";
import { BaseRepository, type RepositoryFilter } from "./base.repository";

/**
 * OrderFilter - Filter specific to Order entity
 * GRASP: Information Expert - Filter belongs to Order domain
 */
export interface OrderFilter extends RepositoryFilter {
  userId?: string;
  storeId?: string;
  status?: import("@prisma/client").OrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

/**
 * IOrderRepository - Order-specific repository interface
 * Extends IRepository with Order-specific methods
 *
 * GRASP: Protected Variations - Stable interface, implementation can change
 */
export interface IOrderRepository {
  findById(id: number): Promise<Order | null>;
  findByUserId(
    userId: string,
    pagination?: RepositoryFilter
  ): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findMany(filter?: OrderFilter): Promise<Order[]>;
  create(
    data: Prisma.OrderUncheckedCreateInput
  ): Promise<Order>;
  updateStatus(
    id: number,
    status: import("@prisma/client").OrderStatus
  ): Promise<Order>;
}

/**
 * OrderRepository - Repository for Order entity
 *
 * GRASP: Information Expert - OrderRepository knows Order data structure
 * GRASP: Creator - OrderRepository responsible for Order CRUD operations
 */
export class OrderRepository
  extends BaseRepository<
    Order,
    number,
    Prisma.OrderUncheckedCreateInput,
    Prisma.OrderUncheckedUpdateInput,
    Prisma.OrderWhereInput
  >
  implements IOrderRepository
{
  protected getModelName(): string {
    return "order";
  }

  protected getUniqueField(): keyof Order {
    return "id";
  }

  protected getIncludeRelations(): Record<string, boolean> {
    return {
      items: true,
      address: true,
      payments: true,
      store: true,
      statusHistory: true,
    };
  }

  /**
   * findById - Find order by ID with full relations
   * GRASP: Information Expert - Order lookup is OrderRepository responsibility
   */
  async findById(id: number): Promise<Order | null> {
    return this.db.order.findUnique({
      where: { id },
      include: this.getIncludeRelations(),
    });
  }

  /**
   * findByUserId - Find orders for a specific user with pagination
   * GRASP: Information Expert - User-specific orders are Order domain knowledge
   */
  async findByUserId(
    userId: string,
    pagination?: RepositoryFilter
  ): Promise<{
    items: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = pagination || {};

    const [items, total] = await this.db.$transaction([
      this.db.order.findMany({
        where: { userId },
        include: this.getIncludeRelations(),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.db.order.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * findMany - Override with OrderFilter support
   * GRASP: Information Expert - Query construction is Order responsibility
   */
  async findMany(filter?: OrderFilter): Promise<Order[]> {
    const { page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } =
      filter || {};
    const skip = (page - 1) * limit;

    return this.db.order.findMany({
      where: this.buildWhereClause(filter),
      include: this.getIncludeRelations(),
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * count - Override with OrderFilter support
   */
  async count(filter?: OrderFilter): Promise<number> {
    return this.db.order.count({
      where: this.buildWhereClause(filter),
    });
  }

  /**
   * create - Create order with transaction
   * GRASP: Information Expert - Order creation is OrderRepository responsibility
   */
  async create(data: Prisma.OrderUncheckedCreateInput): Promise<Order> {
    return this.db.order.create({
      data,
      include: this.getIncludeRelations(),
    });
  }

  /**
   * updateStatus - Update order status
   * GRASP: Information Expert - Status update is Order domain knowledge
   */
  async updateStatus(
    id: number,
    status: import("@prisma/client").OrderStatus
  ): Promise<Order> {
    return this.db.order.update({
      where: { id },
      data: { status },
      include: this.getIncludeRelations(),
    });
  }

  /**
   * Build Prisma where clause from OrderFilter
   * GRASP: Information Expert - Where clause construction is Order's responsibility
   */
  protected buildWhereClause(filter?: OrderFilter): Prisma.OrderWhereInput {
    if (!filter) return {};

    const where: Prisma.OrderWhereInput = {};

    if (filter.userId) where.userId = filter.userId;
    if (filter.storeId) where.storeId = filter.storeId;
    if (filter.status) where.status = filter.status;

    // Date range filter
    if (filter.dateFrom || filter.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) {
        (where.createdAt as Prisma.DateTimeFilter<"Order">).gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        (where.createdAt as Prisma.DateTimeFilter<"Order">).lte = filter.dateTo;
      }
    }

    // Search by order ID (numeric only)
    if (filter.search) {
      const numericOrderId = Number.parseInt(filter.search.replace(/\D/g, ""), 10);
      if (Number.isFinite(numericOrderId) && numericOrderId > 0) {
        where.id = numericOrderId;
      }
    }

    return where;
  }
}