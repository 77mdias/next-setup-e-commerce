"use client";

import { Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";

type WishlistToggleAction = "added" | "removed";

type WishlistToggleResponse = {
  action?: WishlistToggleAction;
};

type WishlistCollectionResponse = {
  wishlist?: Array<{
    productId?: string;
  }>;
};

function resolveCallbackPath(redirectPath?: string) {
  if (redirectPath && redirectPath.trim().length > 0) {
    return redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  }

  if (typeof window !== "undefined") {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    if (currentPath && currentPath !== "/") {
      return currentPath;
    }
  }

  return "/products";
}

export const useWishlist = (redirectPath?: string) => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loadingWishlist, setLoadingWishlist] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems(new Set());
      return;
    }

    try {
      const response = await fetch("/api/wishlist");
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as WishlistCollectionResponse;
      const productIds = new Set<string>(
        (data.wishlist ?? [])
          .map((item) => item.productId)
          .filter((productId): productId is string => Boolean(productId)),
      );
      setWishlistItems(productIds);
    } catch (error) {
      console.error("Erro ao carregar wishlist:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  // Adicionar/remover produto da wishlist
  const handleAddToWishlist = async (
    product: Product,
  ): Promise<WishlistToggleAction | null> => {
    if (!isAuthenticated) {
      const callbackPath = resolveCallbackPath(redirectPath);
      router.push(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: callbackPath,
          fromPath: callbackPath,
        }),
      );
      return null;
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

      const data = (await response.json()) as WishlistToggleResponse;
      const action = data.action;
      if (!action) {
        throw new Error("Resposta inválida ao gerenciar wishlist");
      }

      // Atualizar o estado visual
      if (action === "added") {
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

      return action;
    } catch (error) {
      console.error("Erro ao gerenciar wishlist:", error);
      alert("Erro ao gerenciar lista de favoritos");
      return null;
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
