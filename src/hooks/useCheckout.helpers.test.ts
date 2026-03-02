import { describe, expect, it } from "vitest";

import {
  isAddressCheckoutError,
  mapCheckoutErrorMessage,
  mapOrderStatusError,
  normalizeCheckoutItems,
  resolveStoreIdFromCart,
  selectPreferredAddressId,
} from "./useCheckout.helpers";

describe("normalizeCheckoutItems", () => {
  it("groups duplicated items by product and variant", () => {
    const result = normalizeCheckoutItems([
      { id: "p-1", quantity: 1 },
      { id: "p-1", quantity: 2 },
      { id: "p-1", quantity: 1, variantId: "v-1" },
      { id: "p-1", quantity: 3, variantId: "v-1" },
      { id: "p-2", quantity: 1, variantId: "v-2" },
    ]);

    expect(result).toEqual([
      { productId: "p-1", quantity: 3, variantId: undefined },
      { productId: "p-1", quantity: 4, variantId: "v-1" },
      { productId: "p-2", quantity: 1, variantId: "v-2" },
    ]);
  });

  it("ignores invalid product ids and non-positive quantities", () => {
    const result = normalizeCheckoutItems([
      { id: "", quantity: 1 },
      { id: " ", quantity: 1 },
      { id: "p-1", quantity: 0 },
      { id: "p-1", quantity: -2 },
      { id: "p-2", quantity: 2.8 },
    ]);

    expect(result).toEqual([{ productId: "p-2", quantity: 2 }]);
  });
});

describe("mapCheckoutErrorMessage", () => {
  it("returns actionable message from first issue on 400", () => {
    const message = mapCheckoutErrorMessage(400, {
      error: "Dados inválidos para checkout",
      issues: [
        { field: "items.0.quantity", message: "Number must be greater than 0" },
      ],
    });

    expect(message).toBe("Number must be greater than 0");
  });

  it("returns stock guidance for 409", () => {
    expect(
      mapCheckoutErrorMessage(409, { error: "Estoque insuficiente" }),
    ).toBe(
      "Estoque insuficiente para um ou mais itens. Ajuste as quantidades e tente novamente.",
    );
  });

  it("returns generic fallback for unknown status", () => {
    expect(
      mapCheckoutErrorMessage(500, { error: "Erro interno do servidor" }),
    ).toBe("Erro interno do servidor");
  });

  it("returns recovery guidance when address is invalid on 400", () => {
    expect(
      mapCheckoutErrorMessage(400, {
        error: "Dados inválidos para checkout",
        issues: [{ field: "addressId", message: "Endereço inválido" }],
      }),
    ).toBe(
      "O endereço selecionado não está mais disponível. Escolha outro endereço e tente novamente.",
    );
  });

  it("returns recovery guidance when address is unavailable on 404", () => {
    expect(
      mapCheckoutErrorMessage(404, {
        error: "Endereço não encontrado para o usuário",
      }),
    ).toBe(
      "O endereço selecionado não está mais disponível. Escolha outro endereço e tente novamente.",
    );
  });
});

describe("isAddressCheckoutError", () => {
  it("returns true when payload has address issue fields", () => {
    expect(
      isAddressCheckoutError(400, {
        issues: [{ field: "addressId", message: "Required" }],
      }),
    ).toBe(true);
  });

  it("returns false for non-address 404 errors", () => {
    expect(
      isAddressCheckoutError(404, {
        error: "Produto não encontrado",
      }),
    ).toBe(false);
  });
});

describe("resolveStoreIdFromCart", () => {
  it("returns single store id when cart has one store", () => {
    expect(
      resolveStoreIdFromCart([
        { storeId: "store-1" },
        { storeId: "store-1" },
        { storeId: " store-1 " },
      ]),
    ).toEqual({
      storeId: "store-1",
      hasMixedStores: false,
    });
  });

  it("flags mixed stores when cart has more than one store", () => {
    expect(
      resolveStoreIdFromCart([{ storeId: "store-1" }, { storeId: "store-2" }]),
    ).toEqual({
      storeId: null,
      hasMixedStores: true,
    });
  });

  it("returns null store when no valid store id exists", () => {
    expect(resolveStoreIdFromCart([{ storeId: "" }, { storeId: " " }])).toEqual(
      {
        storeId: null,
        hasMixedStores: false,
      },
    );
  });
});

describe("mapOrderStatusError", () => {
  it("maps 400 with neutral recovery guidance", () => {
    expect(mapOrderStatusError(400)).toEqual({
      message:
        "Nao foi possivel validar o pedido informado. Revise o codigo e tente novamente.",
      recoveryAction: "open-orders",
    });
  });

  it("maps 401 to reauth recovery", () => {
    expect(mapOrderStatusError(401)).toEqual({
      message:
        "Sua sessao expirou. Faca login novamente para acessar o pedido.",
      recoveryAction: "reauth",
    });
  });

  it("maps 404 to ownership-safe response", () => {
    expect(mapOrderStatusError(404)).toEqual({
      message:
        "Esse pedido nao esta disponivel para esta conta. Consulte seus pedidos recentes.",
      recoveryAction: "open-orders",
    });
  });

  it("keeps fallback message for unknown status", () => {
    expect(
      mapOrderStatusError(500, { error: "Erro interno do servidor" }),
    ).toEqual({
      message: "Erro interno do servidor",
      recoveryAction: "retry",
    });
  });
});

describe("selectPreferredAddressId", () => {
  it("keeps selected address when still available", () => {
    expect(
      selectPreferredAddressId(
        [
          { id: "addr-1", isDefault: false },
          { id: "addr-2", isDefault: true },
        ],
        "addr-1",
      ),
    ).toBe("addr-1");
  });

  it("falls back to default address when current selection is unavailable", () => {
    expect(
      selectPreferredAddressId(
        [
          { id: "addr-1", isDefault: false },
          { id: "addr-2", isDefault: true },
        ],
        "addr-3",
      ),
    ).toBe("addr-2");
  });

  it("falls back to first address when there is no default", () => {
    expect(
      selectPreferredAddressId([
        { id: "addr-1", isDefault: false },
        { id: "addr-2", isDefault: false },
      ]),
    ).toBe("addr-1");
  });
});
