"use client";

import { useEffect, useState } from "react";
import { Product } from "@prisma/client";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

import CardProducts from "@/components/ui/card-products";
import ButtonBack from "@/components/ui/ButtonBack";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";

interface WishlistItem {
  id: string;
  productId: string;
  product: Product | null;
  createdAt: string;
}

export default function WishlistPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [wishlistData, setWishlistData] = useState<WishlistItem[]>([]);
  const [isWishlistDataLoading, setIsWishlistDataLoading] = useState(true);
  const router = useRouter();
  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist();
  const { loadingCart, handleAddToCart } = useAddToCart();

  useEffect(() => {
    const loadWishlistData = async () => {
      if (!isAuthenticated) {
        setIsWishlistDataLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          const validItems = (data.wishlist as WishlistItem[]).filter(
            (item) => item?.product && item?.productId,
          );
          setWishlistData(validItems);
        }
      } catch (error) {
        console.error("Erro ao carregar wishlist:", error);
      } finally {
        setIsWishlistDataLoading(false);
      }
    };

    loadWishlistData();
  }, [isAuthenticated]);

  const buttonCardProduct = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  if (isLoading || isWishlistDataLoading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Acesso não autorizado
          </h1>
          <p className="text-gray-400">
            Você precisa estar logado para acessar sua lista de desejos.
          </p>
        </div>
      </div>
    );
  }

  if (wishlistItems.size === 0 || wishlistData.length === 0) {
    return (
      <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--button-primary)]">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--button-primary)]">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white">
            Lista de Desejos
          </h1>
          <p className="text-gray-400">Seus produtos favoritos</p>
        </div>
        <ButtonBack />

        {wishlistData.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistData.map((item) => (
              <div
                key={item.id || item.productId}
                className="flex flex-col gap-2 rounded-xl bg-[var(--card-product)] px-4 py-3 text-[var(--text-primary)]"
              >
                <CardProducts
                  product={item.product}
                  wishlistItems={wishlistItems}
                  loadingWishlist={loadingWishlist}
                  handleAddToWishlist={handleAddToWishlist}
                  handleAddToCart={handleAddToCart}
                  loadingCart={loadingCart}
                  buttonCardProduct={buttonCardProduct}
                  buttonCardProductName="Ver"
                  displayButtonCart="flex"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-[var(--card-product)] p-8 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Sua lista está vazia
            </h2>
            <p className="text-gray-400">
              Adicione produtos à sua lista de desejos para vê-los aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
