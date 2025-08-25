"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";

export const useWishlist = (slug: string) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loadingWishlist, setLoadingWishlist] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  // Carregar wishlist inicial do usuário
  useEffect(() => {
    const loadWishlist = async () => {
      // Se o usuário não estiver autenticado, limpa a wishlist e não carrega
      if (!isAuthenticated) {
        setWishlistItems(new Set());
        return;
      }

      try {
        // Carregar wishlist do usuário
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          // Atualizar o estado visual com os IDs dos produtos na wishlist
          const productIds = new Set<string>(
            data.wishlist.map((item: any) => item.productId as string),
          );
          setWishlistItems(productIds);
        }
      } catch (error) {
        console.error("Erro ao carregar wishlist:", error);
      }
    };

    // Carregar wishlist do usuário
    loadWishlist();
  }, [isAuthenticated]);

  // Recarregar wishlist quando a autenticação mudar
  useEffect(() => {
    if (isAuthenticated) {
      const loadWishlist = async () => {
        try {
          const response = await fetch("/api/wishlist");
          if (response.ok) {
            const data = await response.json();
            const productIds = new Set<string>(
              data.wishlist.map((item: any) => item.productId as string),
            );
            setWishlistItems(productIds);
          }
        } catch (error) {
          console.error("Erro ao recarregar wishlist:", error);
        }
      };
      loadWishlist();
    }
  }, [isAuthenticated]);

  // Adicionar/remover produto da wishlist
  const handleAddToWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/${slug}`);
      return;
    }

    setLoadingWishlist(product.id);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar à wishlist");
      }

      const data = await response.json();

      // Atualizar o estado visual
      if (data.action === "added") {
        // Adicionar o produto à wishlist
        setWishlistItems((prev) => new Set([...prev, product.id]));
      } else {
        // Remover o produto da wishlist
        setWishlistItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Erro ao gerenciar wishlist:", error);
      alert("Erro ao gerenciar lista de favoritos");
    } finally {
      setLoadingWishlist(null);
    }
  };

  return {
    wishlistItems,
    loadingWishlist,
    handleAddToWishlist,
  };
};
