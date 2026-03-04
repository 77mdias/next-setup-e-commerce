"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";
import { useCart } from "@/context/cart";
import { resolveCanonicalCartPath } from "@/lib/routes";

export const useAddToCart = (redirectPath?: string) => {
  const router = useRouter();
  const [loadingCart, setLoadingCart] = useState<string | null>(null);
  const { addProductToCart } = useCart();

  // Adicionar produto ao carrinho
  const handleAddToCart = async (product: Product) => {
    setLoadingCart(product.id);
    try {
      await addProductToCart({
        ...product,
        images: product.images,
        quantity: 1,
      });
      // Redirecionar para o carrinho ao invés de mostrar alert
      router.push(resolveCanonicalCartPath(redirectPath));
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert("Erro ao adicionar produto ao carrinho");
    } finally {
      setLoadingCart(null);
    }
  };

  return {
    loadingCart,
    handleAddToCart,
  };
};
