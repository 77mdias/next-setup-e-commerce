import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Product } from "@prisma/client";

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

describe("ProductRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // findMany with filters
  // ---------------------------------------------------------------------------

  describe("findMany with filters", () => {
    it("should apply category filter correctly", async () => {
      // Given: products exist in category
      const mockProducts = [
        { id: "1", name: "Product 1", slug: "product-1", categoryId: "cat-1" },
      ];
      mockFindMany.mockResolvedValue(mockProducts);

      // When: we filter by category
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findMany({ categoryId: "cat-1" });

      // Then: results are filtered
      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: "cat-1" }),
        })
      );
    });

    it("should apply search filter correctly", async () => {
      // Given: products match search
      const mockProducts = [
        { id: "1", name: "Blue T-Shirt", slug: "blue-t-shirt" },
      ];
      mockFindMany.mockResolvedValue(mockProducts);

      // When: we search for "blue"
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findMany({ search: "blue" });

      // Then: results match search
      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it("should apply store filter correctly", async () => {
      // Given: products exist for store
      const mockProducts = [
        { id: "1", name: "Product 1", slug: "product-1", storeId: "store-1" },
      ];
      mockFindMany.mockResolvedValue(mockProducts);

      // When: we filter by storeId
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findMany({ storeId: "store-1" });

      // Then: results are filtered
      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ storeId: "store-1" }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  describe("pagination", () => {
    it("should return paginated results with correct structure", async () => {
      // Given: products exist
      const mockProducts = [
        { id: "1", name: "Product 1" },
        { id: "2", name: "Product 2" },
      ];
      mockFindMany.mockResolvedValue(mockProducts);
      mockCount.mockResolvedValue(10);

      // When: we call findManyPaginated
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findManyPaginated({ page: 2, limit: 2 });

      // Then: structure is correct
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(5);
    });

    it("should return empty items when page exceeds total", async () => {
      // Given: no products on this page
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(5);

      // When: page > total pages
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findManyPaginated({ page: 10, limit: 10 });

      // Then: empty results but correct total
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // findFeatured
  // ---------------------------------------------------------------------------

  describe("findFeatured", () => {
    it("should return featured products for store", async () => {
      // Given: featured products exist
      const mockProducts = [
        { id: "1", name: "Featured Product", slug: "featured-product", isFeatured: true },
      ];
      mockFindMany.mockResolvedValue(mockProducts);

      // When: we call findFeatured
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.findFeatured("store-1", 5);

      // Then: featured products returned
      expect(result).toHaveLength(1);
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: "store-1",
            isFeatured: true,
            isActive: true,
          }),
          take: 5,
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------

  describe("create", () => {
    it("should create product with all fields", async () => {
      // Given: input data with required fields (sku, specifications)
      const input = {
        name: "New Product",
        slug: "new-product",
        description: "A new product",
        price: 149.99,
        stock: 20,
        storeId: "store-1",
        categoryId: "cat-1",
        brandId: "brand-1",
        sku: "SKU-NEW-001",
        specifications: {},
      };
      const createdProduct = {
        id: "prod-new",
        ...input,
        isActive: true,
        isFeatured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreate.mockResolvedValue(createdProduct);

      // When: we call create
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.create(input);

      // Then: product is created
      expect(result).toEqual(createdProduct);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "New Product",
            slug: "new-product",
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------

  describe("update", () => {
    it("should update product and return updated entity", async () => {
      // Given: existing product and update data
      const existingProduct = {
        id: "prod-123",
        name: "Old Name",
        slug: "old-name",
        price: 50,
      };
      const updateData = { name: "New Name", price: 75 };
      const updatedProduct = { ...existingProduct, ...updateData };
      mockUpdate.mockResolvedValue(updatedProduct);

      // When: we call update
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      const result = await repo.update("prod-123", updateData);

      // Then: updated product returned
      expect(result).toEqual(updatedProduct);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "prod-123" },
        data: updateData,
        include: expect.any(Object),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // delete
  // ---------------------------------------------------------------------------

  describe("delete", () => {
    it("should delete product by id", async () => {
      // Given: product exists
      mockDelete.mockResolvedValue({ id: "prod-123" });

      // When: we call delete
      const { ProductRepository } = await import("@/lib/repositories/product.repository");
      const repo = new ProductRepository();
      await repo.delete("prod-123");

      // Then: delete was called
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: "prod-123" } });
    });
  });
});