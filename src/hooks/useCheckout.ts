import { useState } from "react";
import { useCart } from "@/context/cart";
import { useAuth } from "@/hooks/useAuth";
import {
  mapCheckoutErrorMessage,
  normalizeCheckoutItems,
  resolveStoreIdFromCart,
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

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { products, total } = useCart();
  const { user } = useAuth();

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
        addressId: params.addressId,
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
        throw new Error("Erro ao buscar status do pedido");
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
    error,
    clearError: () => setError(null),
    products,
    total,
    user,
  };
}
