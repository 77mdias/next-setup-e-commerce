import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Order, OrderItem, Prisma } from "@prisma/client";
import { OrderStatus, PaymentStatus, ShippingMethod } from "@prisma/client";

// Mock functions - use directly instead of vi.mocked()
const mockOrderFindUnique = vi.fn();
const mockOrderFindMany = vi.fn();
const mockOrderCount = vi.fn();
const mockOrderCreate = vi.fn();
const mockOrderUpdate = vi.fn();
const mockTransaction = vi.fn((operations) => Promise.all(operations));

vi.mock("../../prisma", () => ({
  db: {
    order: {
      findUnique: mockOrderFindUnique,
      findMany: mockOrderFindMany,
      count: mockOrderCount,
      create: mockOrderCreate,
      update: mockOrderUpdate,
    },
    $transaction: mockTransaction,
  },
}));

describe("OrderRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- findById tests ---

  it("findById should return order with items, shipping, payment", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    const mockOrderItem: OrderItem = {
      id: "item-1",
      orderId: 1,
      productId: "prod-1",
      variantId: null,
      quantity: 2,
      unitPrice: 50,
      totalPrice: 100,
      productName: "Test Product",
      productImage: "image.jpg",
      specifications: null,
      createdAt: new Date(),
    };

    const mockOrderWithRelations = {
      id: 1,
      userId: "user-1",
      storeId: "store-1",
      addressId: "addr-1",
      customerName: "John Doe",
      customerPhone: "123456789",
      customerEmail: null,
      customerCpf: null,
      status: OrderStatus.PENDING,
      shippingMethod: ShippingMethod.STANDARD,
      subtotal: 100,
      shippingFee: 10,
      serviceFee: 0,
      discount: 0,
      total: 110,
      paymentMethod: null,
      paymentStatus: PaymentStatus.PENDING,
      stripePaymentId: null,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      trackingCode: null,
      notes: null,
      estimatedDelivery: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [mockOrderItem],
      address: {
        id: "addr-1",
        userId: "user-1",
        label: "Home",
        street: "123 Main St",
        number: "1",
        complement: null,
        neighborhood: "Center",
        city: "City",
        state: "ST",
        zipCode: "12345",
        country: "Brasil",
        latitude: null,
        longitude: null,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      payments: [
        {
          id: "pay-1",
          orderId: 1,
          method: "pix",
          amount: 110,
          status: PaymentStatus.PENDING,
          stripePaymentId: null,
          stripeClientSecret: null,
          pixCode: null,
          pixExpiresAt: null,
          boletoUrl: null,
          boletoBarcode: null,
          paidAt: null,
          failedAt: null,
          failureReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      store: {
        id: "store-1",
        ownerId: "owner-1",
        name: "Store",
        slug: "store",
        description: "Store desc",
        phone: "123456789",
        email: "store@example.com",
        cnpj: null,
        website: null,
        shippingFee: 10,
        freeShipping: 0,
        processingTime: 1,
        isActive: true,
        rating: 0,
        totalSales: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      statusHistory: [],
    };

    mockOrderFindUnique.mockResolvedValue(mockOrderWithRelations as any);

    const result = await repository.findById(1);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(1);
    expect((result as any).items).toHaveLength(1);
    expect((result as any).address).toBeDefined();
    expect((result as any).payments).toHaveLength(1);
    expect(mockOrderFindUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        items: true,
        address: true,
        payments: true,
        store: true,
        statusHistory: true,
      },
    });
  });

  it("findById should return null when order not found", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    mockOrderFindUnique.mockResolvedValue(null);

    const result = await repository.findById(999);

    expect(result).toBeNull();
    expect(mockOrderFindUnique).toHaveBeenCalledWith({
      where: { id: 999 },
      include: {
        items: true,
        address: true,
        payments: true,
        store: true,
        statusHistory: true,
      },
    });
  });

  // --- findByUserId tests ---

  it("findByUserId should return paginated orders for user", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    const mockOrders = [
      {
        id: 1,
        userId: "user-1",
        storeId: "store-1",
        status: OrderStatus.PENDING,
        total: 110,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockOrderFindMany.mockResolvedValue(mockOrders as any);
    mockOrderCount.mockResolvedValue(1);

    const result = await repository.findByUserId("user-1", { page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it("findByUserId should filter by userId correctly", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    mockOrderFindMany.mockResolvedValue([]);
    mockOrderCount.mockResolvedValue(0);

    await repository.findByUserId("user-specific", { page: 1, limit: 10 });

    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-specific",
        }),
      })
    );
  });

  // --- findMany with filters tests ---

  it("findMany with filters should filter by status", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    mockOrderFindMany.mockResolvedValue([]);
    mockOrderCount.mockResolvedValue(0);

    await repository.findMany({ status: OrderStatus.SHIPPED });

    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: OrderStatus.SHIPPED,
        }),
      })
    );
  });

  it("findMany with filters should filter by dateRange", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");

    mockOrderFindMany.mockResolvedValue([]);
    mockOrderCount.mockResolvedValue(0);

    await repository.findMany({ dateFrom: startDate, dateTo: endDate });

    expect(mockOrderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: startDate,
            lte: endDate,
          }),
        }),
      })
    );
  });

  it("findMany with filters should return empty when no orders match", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    mockOrderFindMany.mockResolvedValue([]);
    mockOrderCount.mockResolvedValue(0);

    const result = await repository.findMany({ status: OrderStatus.CANCELLED });

    expect(result).toHaveLength(0);
  });

  // --- create tests ---

  it("create should create order with items", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    const createData = {
      userId: "user-1",
      storeId: "store-1",
      status: OrderStatus.PENDING,
      total: 110,
      items: [{ productId: "prod-1", quantity: 2, unitPrice: 50, totalPrice: 100 }],
    };

    mockOrderCreate.mockResolvedValue({ id: 1, ...createData } as any);
    mockTransaction.mockImplementation(async (operations: any[]) => {
      const results = await Promise.all(operations);
      return results;
    });

    const result = await repository.create(createData as any);

    expect(result).not.toBeNull();
    expect(mockTransaction).toHaveBeenCalled();
  });

  // --- updateStatus tests ---

  it("updateStatus should update order status", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    const updatedOrder = {
      id: 1,
      status: OrderStatus.SHIPPED,
      updatedAt: new Date(),
    };

    mockOrderUpdate.mockResolvedValue(updatedOrder as any);

    const result = await repository.updateStatus(1, OrderStatus.SHIPPED);

    expect(result).not.toBeNull();
    expect(mockOrderUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: OrderStatus.SHIPPED },
    });
  });

  // --- count tests ---

  it("count should return total for filter", async () => {
    const { OrderRepository } = await import("../../repositories/order.repository");
    const repository = new OrderRepository();

    mockOrderCount.mockResolvedValue(5);

    const result = await repository.count({ status: OrderStatus.PENDING });

    expect(result).toBe(5);
    expect(mockOrderCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status: OrderStatus.PENDING,
      }),
    });
  });
});
