import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetCurrentUser, mockDb } = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockDb: {
    $transaction: vi.fn(),
    address: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("@/lib/prisma", () => ({
  db: mockDb,
}));

import { DELETE, GET, POST, PUT } from "@/app/api/addresses/route";

function createJsonRequest(method: "POST" | "PUT", payload: unknown) {
  return new NextRequest("http://localhost:3000/api/addresses", {
    method,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function createDeleteRequest(id?: string) {
  const search = id ? `?id=${id}` : "";

  return new NextRequest(`http://localhost:3000/api/addresses${search}`, {
    method: "DELETE",
  });
}

const createdAddress = {
  city: "São Paulo",
  complement: null,
  country: "Brasil",
  id: "address-1",
  isDefault: true,
  label: "Casa",
  neighborhood: "Centro",
  number: "100",
  state: "SP",
  street: "Rua das Flores",
  zipCode: "12345-678",
};

describe("API /api/addresses integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetCurrentUser.mockResolvedValue({
      id: "user-1",
    });

    mockDb.address.findMany.mockResolvedValue([]);
    mockDb.address.count.mockResolvedValue(0);
    mockDb.address.create.mockResolvedValue(createdAddress);
    mockDb.address.findFirst.mockResolvedValue(createdAddress);
    mockDb.address.updateMany.mockResolvedValue({ count: 1 });
    mockDb.address.deleteMany.mockResolvedValue({ count: 1 });
    mockDb.$transaction.mockImplementation(async (operation: unknown) => {
      if (typeof operation === "function") {
        return operation(mockDb);
      }

      throw new Error("Unsupported transaction operation in test");
    });
  });

  it("returns 401 when unauthenticated on GET", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Não autorizado");
  });

  it("returns 401 when unauthenticated on POST", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      createJsonRequest("POST", {
        city: "São Paulo",
        label: "Casa",
        neighborhood: "Centro",
        number: "100",
        state: "SP",
        street: "Rua das Flores",
        zipCode: "12345-678",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Não autorizado");
    expect(mockDb.address.create).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated on PUT", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await PUT(
      createJsonRequest("PUT", {
        id: "address-1",
        city: "Campinas",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Não autorizado");
    expect(mockDb.address.updateMany).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated on DELETE", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const response = await DELETE(createDeleteRequest("address-1"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Não autorizado");
    expect(mockDb.address.deleteMany).not.toHaveBeenCalled();
  });

  it("lists only authenticated user addresses in GET", async () => {
    mockDb.address.findMany.mockResolvedValue([createdAddress]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.addresses).toEqual([createdAddress]);
    expect(mockDb.address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      }),
    );
  });

  it("returns 503 when Prisma pool is exhausted during GET", async () => {
    mockDb.address.findMany.mockRejectedValueOnce({ code: "P2024" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.message).toBe(
      "Serviço temporariamente sobrecarregado. Tente novamente.",
    );
    expect(response.headers.get("retry-after")).toBe("5");
  });

  it("creates first address as default and binds user ownership in POST", async () => {
    const response = await POST(
      createJsonRequest("POST", {
        city: "São Paulo",
        label: "Casa",
        neighborhood: "Centro",
        number: "100",
        state: "sp",
        street: "Rua das Flores",
        zipCode: "12345678",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.address).toEqual(createdAddress);
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
    expect(mockDb.address.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          isDefault: true,
          state: "SP",
          zipCode: "12345-678",
        }),
      }),
    );
  });

  it("keeps new address as non-default when user already has addresses in POST", async () => {
    mockDb.address.count.mockResolvedValueOnce(2);
    mockDb.address.create.mockResolvedValueOnce({
      ...createdAddress,
      id: "address-2",
      isDefault: false,
    });

    const response = await POST(
      createJsonRequest("POST", {
        city: "São Paulo",
        isDefault: false,
        label: "Escritório",
        neighborhood: "Centro",
        number: "200",
        state: "SP",
        street: "Av. Paulista",
        zipCode: "12345-678",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.address.isDefault).toBe(false);
    expect(mockDb.address.updateMany).not.toHaveBeenCalled();
    expect(mockDb.address.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isDefault: false,
          userId: "user-1",
        }),
      }),
    );
  });

  it("rejects invalid postal code in POST", async () => {
    const response = await POST(
      createJsonRequest("POST", {
        city: "São Paulo",
        label: "Casa",
        neighborhood: "Centro",
        number: "100",
        state: "SP",
        street: "Rua das Flores",
        zipCode: "invalid",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("Dados inválidos para endereço");
    expect(mockDb.address.create).not.toHaveBeenCalled();
  });

  it("returns 404 when trying to update a non-owned address in PUT", async () => {
    mockDb.address.findFirst.mockResolvedValueOnce(null);

    const response = await PUT(
      createJsonRequest("PUT", {
        id: "address-unknown",
        city: "Recife",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe("Endereço não encontrado");
    expect(mockDb.address.updateMany).not.toHaveBeenCalled();
  });

  it("sets selected address as default and removes previous default in PUT", async () => {
    mockDb.address.findFirst
      .mockResolvedValueOnce({
        id: "address-2",
        isDefault: false,
      })
      .mockResolvedValueOnce({
        ...createdAddress,
        id: "address-2",
        city: "Campinas",
      });

    const response = await PUT(
      createJsonRequest("PUT", {
        id: "address-2",
        isDefault: true,
        city: "Campinas",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.address.id).toBe("address-2");
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        isDefault: true,
        id: { not: "address-2" },
      },
      data: {
        isDefault: false,
      },
    });
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        id: "address-2",
        userId: "user-1",
      },
      data: expect.objectContaining({
        city: "Campinas",
        isDefault: true,
      }),
    });
  });

  it("promotes another owned address when unsetting current default in PUT", async () => {
    mockDb.address.findFirst
      .mockResolvedValueOnce({
        id: "address-1",
        isDefault: true,
      })
      .mockResolvedValueOnce({
        id: "address-2",
      })
      .mockResolvedValueOnce({
        ...createdAddress,
        id: "address-1",
        isDefault: false,
      });

    const response = await PUT(
      createJsonRequest("PUT", {
        id: "address-1",
        isDefault: false,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.address.isDefault).toBe(false);
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        id: "address-2",
        userId: "user-1",
      },
      data: {
        isDefault: true,
      },
    });
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        id: "address-1",
        userId: "user-1",
      },
      data: expect.objectContaining({
        isDefault: false,
      }),
    });
  });

  it("keeps address as default when unsetting current default without replacement in PUT", async () => {
    mockDb.address.findFirst
      .mockResolvedValueOnce({
        id: "address-1",
        isDefault: true,
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...createdAddress,
        id: "address-1",
        isDefault: true,
      });

    const response = await PUT(
      createJsonRequest("PUT", {
        id: "address-1",
        isDefault: false,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.address.isDefault).toBe(true);
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        id: "address-1",
        userId: "user-1",
      },
      data: expect.objectContaining({
        isDefault: true,
      }),
    });
  });

  it("removes owned default address and promotes replacement in DELETE", async () => {
    mockDb.address.findFirst
      .mockResolvedValueOnce({
        id: "address-1",
        isDefault: true,
      })
      .mockResolvedValueOnce({
        id: "address-2",
      });

    const response = await DELETE(createDeleteRequest("address-1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Endereço removido com sucesso");
    expect(mockDb.address.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "address-1",
        userId: "user-1",
      },
    });
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
      },
      data: {
        isDefault: false,
      },
    });
    expect(mockDb.address.updateMany).toHaveBeenCalledWith({
      where: {
        id: "address-2",
        userId: "user-1",
      },
      data: {
        isDefault: true,
      },
    });
  });

  it("removes non-default address without touching default flag in DELETE", async () => {
    mockDb.address.findFirst.mockResolvedValueOnce({
      id: "address-2",
      isDefault: false,
    });

    const response = await DELETE(createDeleteRequest("address-2"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe("Endereço removido com sucesso");
    expect(mockDb.address.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "address-2",
        userId: "user-1",
      },
    });
    expect(mockDb.address.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when deleting a non-owned address", async () => {
    mockDb.address.findFirst.mockResolvedValueOnce(null);

    const response = await DELETE(createDeleteRequest("address-404"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.message).toBe("Endereço não encontrado");
    expect(mockDb.address.deleteMany).not.toHaveBeenCalled();
  });
});
