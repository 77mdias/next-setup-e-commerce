import { useState } from "react";
import { useCart } from "@/context/cart";
import { useAuth } from "@/hooks/useAuth";

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
  storeSlug?: string;
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

      // Buscar informações da loja ativa
      const storeParams = new URLSearchParams({
        limit: "1",
      });
      if (params.storeSlug) {
        storeParams.set("storeSlug", params.storeSlug);
      }
      const storeResponse = await fetch(
        `/api/products?${storeParams.toString()}`,
      );
      if (!storeResponse.ok) {
        throw new Error("Erro ao buscar informações da loja");
      }
      const storeData = await storeResponse.json();
      const store = storeData?.store;

      if (!store?.id) {
        throw new Error("Loja ativa não encontrada");
      }

      // Preparar dados para checkout
      const checkoutData: CheckoutData = {
        storeId: store.id,
        items: products.map((product) => ({
          productId: product.id,
          quantity: product.quantity,
          variantId:
            (product as { variantId?: string | null }).variantId ?? undefined,
        })),
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
        const errorData = await response
          .json()
          .catch(() => ({ error: "Erro ao criar checkout" }));
        throw new Error(errorData.error || "Erro ao criar checkout");
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
