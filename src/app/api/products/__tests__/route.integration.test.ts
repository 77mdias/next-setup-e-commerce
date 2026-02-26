import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDb, mockResolveActiveStore } = vi.hoisted(() => ({
  mockDb: {
    $transaction: vi.fn(),
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockResolveActiveStore: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

vi.mock("@/lib/store", () => ({
  resolveActiveStore: mockResolveActiveStore,
}));

import { GET } from "@/app/api/products/route";

function createRequest(query: string) {
  return new NextRequest(`http://localhost:3000/api/products${query}`);
}

function createProduct(id: string) {
  return {
    id,
    name: `Produto ${id}`,
    price: 100,
    originalPrice: null,
    rating: 4.5,
    images: ["https://cdn.example.com/product.png"],
    isOnSale: false,
    isFeatured: false,
    category: {
      name: "Categoria",
    },
  };
}

describe("GET /api/products integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockResolveActiveStore.mockResolvedValue({
      id: "store-1",
      slug: "nextstore",
      name: "Next Store",
    });

    mockDb.$transaction.mockImplementation(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    );

    mockDb.product.findMany.mockResolvedValue([createProduct("p1")]);
    mockDb.product.count.mockResolvedValue(1);
    mockDb.product.groupBy.mockResolvedValue([
      {
        categoryId: "cat-1",
        _count: {
          _all: 1,
        },
      },
    ]);
    mockDb.product.aggregate.mockResolvedValue({
      _min: {
        price: 100,
      },
      _max: {
        price: 100,
      },
    });
    mockDb.category.findFirst.mockResolvedValue({
      id: "cat-1",
    });
    mockDb.category.findMany.mockResolvedValue([
      {
        id: "cat-1",
        name: "Mouses",
        slug: "mouses",
        sortOrder: 1,
      },
    ]);
  });

  it("defaults to fast mode without total count when includeTotal is omitted", async () => {
    mockDb.product.findMany.mockResolvedValue([
      createProduct("p1"),
      createProduct("p2"),
    ]);

    const response = await GET(
      createRequest("?limit=1&page=1&includeFacets=0&sort=newest"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.product.count).not.toHaveBeenCalled();
    expect(mockDb.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      }),
    );
    expect(body.total).toBeNull();
    expect(body.totalPages).toBeNull();
    expect(body.hasMore).toBe(true);
    expect(body.products).toHaveLength(1);
  });

  it("returns total and totalPages when includeTotal=1", async () => {
    mockDb.product.findMany.mockResolvedValue([createProduct("p10")]);
    mockDb.product.count.mockResolvedValue(5);

    const response = await GET(
      createRequest("?includeTotal=1&includeFacets=0&limit=2&page=2"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockDb.product.count).toHaveBeenCalledTimes(1);
    expect(body.total).toBe(5);
    expect(body.totalPages).toBe(3);
    expect(body.hasMore).toBe(true);
  });

  it("returns only facets when facetsOnly=1", async () => {
    const response = await GET(createRequest("?facetsOnly=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.facets).toEqual({
      categories: [
        {
          id: "cat-1",
          name: "Mouses",
          slug: "mouses",
          count: 1,
        },
      ],
      priceRange: {
        min: 100,
        max: 100,
      },
    });
    expect(mockDb.product.findMany).not.toHaveBeenCalled();
    expect(mockDb.product.count).not.toHaveBeenCalled();
  });

  it("returns 404 when category slug is invalid", async () => {
    mockDb.category.findFirst.mockResolvedValue(null);

    const response = await GET(
      createRequest("?category=invalida&includeFacets=0"),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe("Categoria não encontrada");
    expect(mockDb.product.findMany).not.toHaveBeenCalled();
  });
});
