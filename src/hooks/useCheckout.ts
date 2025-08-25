import { useState } from "react";
import { useCart } from "@/app/[slug]/context/cart";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  cpf: string;
}

interface CheckoutData {
  storeId: string;
  items: any[];
  customerInfo: CustomerInfo;
  shippingMethod: string;
  addressId?: string;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { products, total, clearCart } = useCart();
  const { user } = useAuth();
  const params = useParams();
  const slug = params.slug as string;

  const createCheckoutSession = async (
    customerInfo: CustomerInfo,
    addressId?: string,
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se há produtos no carrinho
      if (products.length === 0) {
        throw new Error("Carrinho vazio");
      }

      // Buscar informações da loja pelo slug
      const storeResponse = await fetch(`/api/stores/${slug}`);
      if (!storeResponse.ok) {
        throw new Error("Erro ao buscar informações da loja");
      }
      const store = await storeResponse.json();

      // Preparar dados para checkout
      const checkoutData: CheckoutData = {
        storeId: store.id,
        items: products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description || product.name,
          price: product.price,
          quantity: product.quantity,
          images: product.images,
          specifications: product.specifications || {},
        })),
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          cpf: customerInfo.cpf,
        },
        shippingMethod: "STANDARD",
        addressId,
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
        const errorData = await response.json();
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
