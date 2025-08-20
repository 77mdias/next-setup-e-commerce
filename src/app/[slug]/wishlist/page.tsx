"use client";

import CardProducts from "@/components/ui/card-products";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../context/cart";
import { Product } from "@prisma/client";

export default function WishlistPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());
  const [wishlistData, setWishlistData] = useState<any[]>([]);
  const { slug } = useParams();
  const { addProductToCart } = useCart();
  const router = useRouter();
  const [loadingCart, setLoadingCart] = useState<string | null>(null);
  const { products } = useCart();

  // Carregar wishlist inicial do usuário
  useEffect(() => {
    const loadWishlist = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          const productIds = new Set<string>(
            data.wishlist.map((item: any) => item.productId as string),
          );
          setWishlistItems(productIds);
          setWishlistData(data.wishlist);
        }
      } catch (error) {
        console.error("Erro ao carregar wishlist:", error);
      }
    };

    loadWishlist();
  }, [isAuthenticated]);

  // Adicionar produto ao carrinho
  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/${slug}`);
      return;
    }

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
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

  // Se a wishlist estiver vazia, exibe uma mensagem de lista vazia
  if (wishlistItems.size === 0) {
    return (
      <div className="min-h-screen bg-[var(--all-black)] py-8">
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

  // Se a wishlist não estiver vazia, exibe os produtos
  return (
    <div className="min-h-screen bg-[var(--all-black)] py-8">
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

        {wishlistData.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistData.map((item: any) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl bg-[var(--card-product)] px-4 py-3 text-[var(--text-primary)]"
              >
                <CardProducts
                  product={item.product}
                  wishlistItems={wishlistItems}
                  loadingWishlist={null}
                  handleAddToWishlist={() => {}}
                  handleAddToCart={handleAddToCart}
                  loadingCart={loadingCart}
                  slug={slug as string}
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
