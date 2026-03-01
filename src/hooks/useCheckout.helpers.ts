type CheckoutItem = {
  productId: string;
  quantity: number;
  variantId?: string;
};

type CheckoutErrorIssue = {
  field?: string;
  message?: string;
};

type CheckoutErrorPayload = {
  error?: string;
  issues?: CheckoutErrorIssue[];
};

type OrderStatusErrorPayload = {
  error?: string;
};

type CartItemInput = {
  id: string;
  quantity: number;
  variantId?: string | null;
};

type CartItemStoreInput = {
  storeId?: string | null;
};

function normalizeVariantId(variantId?: string | null): string | undefined {
  const trimmedVariantId = variantId?.trim();
  return trimmedVariantId ? trimmedVariantId : undefined;
}

export function normalizeCheckoutItems(items: CartItemInput[]): CheckoutItem[] {
  const groupedItems = new Map<string, CheckoutItem>();

  for (const item of items) {
    const productId = item.id?.trim();
    const quantity = Math.floor(Number(item.quantity));

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      continue;
    }

    const variantId = normalizeVariantId(item.variantId);
    const key = `${productId}:${variantId ?? ""}`;
    const existingItem = groupedItems.get(key);

    if (!existingItem) {
      groupedItems.set(key, { productId, quantity, variantId });
      continue;
    }

    groupedItems.set(key, {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
    });
  }

  return [...groupedItems.values()];
}

function getIssueMessage(payload?: CheckoutErrorPayload): string | null {
  const issueMessage = payload?.issues?.find((issue) => issue.message)?.message;
  return issueMessage?.trim() ? issueMessage : null;
}

export function mapCheckoutErrorMessage(
  status: number,
  payload?: CheckoutErrorPayload,
): string {
  const fallbackMessage =
    payload?.error?.trim() || "Erro ao criar checkout. Tente novamente.";

  if (status === 400) {
    return (
      getIssueMessage(payload) ||
      payload?.error ||
      "Dados inválidos no carrinho. Revise os itens e tente novamente."
    );
  }

  if (status === 401) {
    return "Sua sessão expirou. Faça login novamente para finalizar a compra.";
  }

  if (status === 404) {
    return "Algum item não foi encontrado. Atualize o carrinho e tente novamente.";
  }

  if (status === 409) {
    return "Estoque insuficiente para um ou mais itens. Ajuste as quantidades e tente novamente.";
  }

  return fallbackMessage;
}

export type OrderStatusRecoveryAction = "reauth" | "open-orders" | "retry";

export type OrderStatusErrorResolution = {
  message: string;
  recoveryAction: OrderStatusRecoveryAction;
};

export function mapOrderStatusError(
  status: number,
  payload?: OrderStatusErrorPayload,
): OrderStatusErrorResolution {
  if (status === 400) {
    return {
      message:
        "Nao foi possivel validar o pedido informado. Revise o codigo e tente novamente.",
      recoveryAction: "open-orders",
    };
  }

  if (status === 401) {
    return {
      message:
        "Sua sessao expirou. Faca login novamente para acessar o pedido.",
      recoveryAction: "reauth",
    };
  }

  if (status === 404) {
    return {
      message:
        "Esse pedido nao esta disponivel para esta conta. Consulte seus pedidos recentes.",
      recoveryAction: "open-orders",
    };
  }

  return {
    message:
      payload?.error?.trim() ||
      "Nao foi possivel consultar este pedido agora. Tente novamente.",
    recoveryAction: "retry",
  };
}

export function resolveStoreIdFromCart(items: CartItemStoreInput[]): {
  storeId: string | null;
  hasMixedStores: boolean;
} {
  const uniqueStoreIds = new Set<string>();

  for (const item of items) {
    const normalizedStoreId = item.storeId?.trim();
    if (normalizedStoreId) {
      uniqueStoreIds.add(normalizedStoreId);
    }
  }

  if (uniqueStoreIds.size > 1) {
    return {
      storeId: null,
      hasMixedStores: true,
    };
  }

  return {
    storeId: [...uniqueStoreIds][0] ?? null,
    hasMixedStores: false,
  };
}
