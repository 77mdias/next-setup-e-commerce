import { useCallback, useEffect, useState } from "react";
import { useCart } from "@/context/cart";
import { useAuth } from "@/hooks/useAuth";
import {
  isAddressCheckoutError,
  mapCheckoutErrorMessage,
  mapOrderStatusError,
  normalizeCheckoutItems,
  type OrderStatusRecoveryAction,
  resolveStoreIdFromCart,
  selectPreferredAddressId,
} from "@/hooks/useCheckout.helpers";

type ShippingMethod = "STANDARD" | "EXPRESS" | "PICKUP";

interface CheckoutItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

interface CheckoutData {
  storeId: string;
  items: CheckoutItem[];
  shippingMethod: ShippingMethod;
  addressId?: string;
}

interface CreateCheckoutSessionParams {
  shippingMethod?: ShippingMethod;
  addressId?: string;
}

type CheckoutAddress = {
  city: string;
  complement?: string | null;
  country: string;
  id: string;
  isDefault: boolean;
  label: string;
  neighborhood: string;
  number: string;
  state: string;
  street: string;
  zipCode: string;
};

type AddressResponsePayload = {
  addresses?: CheckoutAddress[];
};

type AddressApiIssue = {
  message?: unknown;
};

type AddressApiErrorPayload = {
  issues?: AddressApiIssue[];
  message?: unknown;
};

export type OrderStatusRequestError = Error & {
  status: number;
  recoveryAction: OrderStatusRecoveryAction;
};

function resolveAddressApiErrorMessage(
  payload: AddressApiErrorPayload,
): string | null {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  const issueMessage = payload.issues?.find(
    (issue) => typeof issue.message === "string" && issue.message.trim(),
  )?.message;

  return typeof issueMessage === "string" ? issueMessage : null;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<CheckoutAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const { products, total } = useCart();
  const { user } = useAuth();

  const loadAddresses = useCallback(
    async ({ showLoader = true }: { showLoader?: boolean } = {}) => {
      if (!user?.id) {
        setAddresses([]);
        setSelectedAddressId(null);
        setAddressError(null);
        return [];
      }

      if (showLoader) {
        setIsLoadingAddresses(true);
      }

      setAddressError(null);

      try {
        const response = await fetch("/api/addresses", {
          cache: "no-store",
        });

        if (!response.ok) {
          const errorPayload =
            (await response
              .json()
              .catch(() => ({}) as AddressApiErrorPayload)) ??
            ({} as AddressApiErrorPayload);
          throw new Error(
            resolveAddressApiErrorMessage(errorPayload) ??
              "Não foi possível carregar seus endereços.",
          );
        }

        const data = (await response.json()) as AddressResponsePayload;
        const nextAddresses = Array.isArray(data.addresses)
          ? data.addresses
          : [];

        setAddresses(nextAddresses);
        setSelectedAddressId((currentSelection) =>
          selectPreferredAddressId(nextAddresses, currentSelection),
        );

        return nextAddresses;
      } catch (loadError) {
        console.error("❌ Erro ao carregar endereços do checkout:", loadError);
        setAddresses([]);
        setSelectedAddressId(null);
        setAddressError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar seus endereços.",
        );
        return [];
      } finally {
        if (showLoader) {
          setIsLoadingAddresses(false);
        }
      }
    },
    [user?.id],
  );

  useEffect(() => {
    if (!user?.id) {
      setAddresses([]);
      setSelectedAddressId(null);
      setAddressError(null);
      return;
    }

    void loadAddresses();
  }, [loadAddresses, user?.id]);

  const createCheckoutSession = async (
    params: CreateCheckoutSessionParams = {},
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se há produtos no carrinho
      if (products.length === 0) {
        throw new Error("Carrinho vazio");
      }

      const storeResolution = resolveStoreIdFromCart(products);
      if (storeResolution.hasMixedStores) {
        throw new Error(
          "Seu carrinho contém itens de lojas diferentes. Mantenha apenas uma loja por pedido.",
        );
      }

      const normalizedItems = normalizeCheckoutItems(
        products.map((product) => ({
          id: product.id,
          quantity: product.quantity,
          variantId:
            (product as { variantId?: string | null }).variantId ?? undefined,
        })),
      );

      if (normalizedItems.length === 0) {
        throw new Error(
          "Carrinho com itens inválidos. Revise as quantidades e tente novamente.",
        );
      }

      const effectiveAddressId = selectPreferredAddressId(
        addresses,
        params.addressId ?? selectedAddressId,
      );

      if (addresses.length > 0 && !effectiveAddressId) {
        throw new Error(
          "Selecione um endereço de entrega antes de finalizar a compra.",
        );
      }

      if (
        effectiveAddressId &&
        addresses.length > 0 &&
        !addresses.some((address) => address.id === effectiveAddressId)
      ) {
        throw new Error(
          "O endereço selecionado não está mais disponível. Escolha outro endereço e tente novamente.",
        );
      }

      let storeId = storeResolution.storeId;

      if (!storeId) {
        // Fallback para itens legados sem storeId persistido no carrinho.
        const storeParams = new URLSearchParams({
          limit: "1",
          includeTotal: "0",
          includeFacets: "0",
        });
        const storeResponse = await fetch(
          `/api/products?${storeParams.toString()}`,
        );
        if (!storeResponse.ok) {
          throw new Error("Erro ao buscar informações da loja");
        }
        const storeData = await storeResponse.json();
        storeId = storeData?.store?.id;
      }

      if (!storeId) {
        throw new Error("Loja ativa não encontrada");
      }

      // Preparar dados para checkout
      const checkoutData: CheckoutData = {
        storeId,
        items: normalizedItems,
        shippingMethod: params.shippingMethod ?? "STANDARD",
        addressId: effectiveAddressId ?? undefined,
      };

      // Criar sessão de checkout
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (isAddressCheckoutError(response.status, errorData)) {
          const refreshedAddresses = await loadAddresses({ showLoader: false });
          setSelectedAddressId((currentSelection) =>
            selectPreferredAddressId(
              refreshedAddresses,
              currentSelection ?? effectiveAddressId,
            ),
          );
        }

        throw new Error(mapCheckoutErrorMessage(response.status, errorData));
      }

      const { url } = await response.json();

      // Redirecionar para o Stripe
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error("❌ Erro no checkout:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const { message, recoveryAction } = mapOrderStatusError(
          response.status,
          errorData,
        );
        const requestError = new Error(message) as OrderStatusRequestError;
        requestError.status = response.status;
        requestError.recoveryAction = recoveryAction;
        throw requestError;
      }
      return await response.json();
    } catch (err) {
      console.error("❌ Erro ao buscar status:", err);
      throw err;
    }
  };

  return {
    createCheckoutSession,
    getOrderStatus,
    isLoading,
    addresses,
    selectedAddressId,
    selectAddress: (addressId: string) => {
      setSelectedAddressId(addressId);
      setError(null);
    },
    isLoadingAddresses,
    addressError,
    refreshAddresses: () => loadAddresses(),
    error,
    clearError: () => setError(null),
    products,
    total,
    user,
  };
}
