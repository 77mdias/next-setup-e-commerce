"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";
import { useCart } from "@/app/[slug]/context/cart";

export const useAddToCart = (slug: string) => {
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
      router.push(`/${slug}/carrinho`);
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
