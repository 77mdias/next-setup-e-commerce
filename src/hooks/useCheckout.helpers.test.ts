import { describe, expect, it } from "vitest";

import {
  mapCheckoutErrorMessage,
  normalizeCheckoutItems,
  resolveStoreIdFromCart,
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
