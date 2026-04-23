import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Product, Prisma } from "@prisma/client";

// We import the interface we want to test (will fail in RED phase - no implementation yet)
// For RED phase, we test the CONTRACT via concrete implementations

// Mock Prisma client
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  db: {
    product: {
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
      delete: mockDelete,
      count: mockCount,
    },
  },
}));

describe("IRepository<T, TId> Contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------

  describe("findById", () => {
    it("should return null when entity does not exist", async () => {
      // Given: no entity exists
      mockFindUnique.mockResolvedValue(null);

      // When: we call findById with a non-existent ID
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findById("non-existent-id");

      // Then: we expect null
      expect(result).toBeNull();
    });

    it("should return entity when found by id", async () => {
      // Given: entity exists
      const mockProduct = {
        id: "prod-123",
        name: "Test Product",
        slug: "test-product",
        description: "A test product",
        price: 99.99,
        stock: 10,
        isActive: true,
        storeId: "store-1",
        categoryId: "cat-1",
        brandId: "brand-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindUnique.mockResolvedValue(mockProduct);

      // When: we call findById with existing ID
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findById("prod-123");

      // Then: we expect the entity
      expect(result).toEqual(mockProduct);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { id: "prod-123" },
        include: expect.any(Object),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // findMany
  // ---------------------------------------------------------------------------

  describe("findMany", () => {
    it("should return empty array when no entities exist", async () => {
      // Given: no entities
      mockFindMany.mockResolvedValue([]);

      // When: we call findMany
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findMany({});

      // Then: empty array
      expect(result).toEqual([]);
    });

    it("should return paginated results", async () => {
      // Given: some entities exist
      const mockProducts = [
        { id: "1", name: "Product 1", slug: "product-1" },
        { id: "2", name: "Product 2", slug: "product-2" },
      ];
      mockFindMany.mockResolvedValue(mockProducts);

      // When: we call findMany with pagination
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findMany({ page: 1, limit: 10 });

      // Then: results match
      expect(result).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // count
  // ---------------------------------------------------------------------------

  describe("count", () => {
    it("should return 0 when no entities exist", async () => {
      mockCount.mockResolvedValue(0);

      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.count({});

      expect(result).toBe(0);
    });

    it("should return correct count", async () => {
      mockCount.mockResolvedValue(5);

      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.count({});

      expect(result).toBe(5);
    });
  });
});