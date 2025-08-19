"use client";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Store, Product } from "@prisma/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CardProducts from "@/components/ui/card-products";

const HighlightedProducst = ({
  slug,
  store,
}: {
  slug: string;
  store: Store & { products: Product[] };
}) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loadingCart, setLoadingCart] = useState<string | null>(null);
  const [loadingWishlist, setLoadingWishlist] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set());

  // Carregar wishlist inicial do usuário
  useEffect(() => {
    const loadWishlist = async () => {
      // Se o usuário não estiver autenticado, não carrega a wishlist
      if (!isAuthenticated) return;

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
  }, [isAuthenticated, wishlistItems]);

  // Adicionar produto ao carrinho
  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/${slug}`);
      return;
    }

    setLoadingCart(product.id);
    try {
      // Aqui você pode implementar a lógica do carrinho
      // Por enquanto, vamos simular um delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Implementar API do carrinho
      console.log("Produto adicionado ao carrinho:", product.name);

      // Feedback visual ou toast notification aqui

      alert(`${product.name} foi adicionado ao carrinho!`);
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert("Erro ao adicionar produto ao carrinho");
    } finally {
      setLoadingCart(null);
    }
  };

  // Adicionar produto à wishlist
  const handleAddToWishlist = async (product: Product) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/${slug}`);
      return;
    }

    setLoadingWishlist(product.id);
    // CHAMAR API DO WISHLIST
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

      // Se a resposta não for ok, lança um erro
      if (!response.ok) {
        throw new Error("Erro ao adicionar à wishlist");
      }

      // Se a resposta for ok, atualiza o estado visual
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
      // Se ocorrer um erro, exibe uma mensagem de erro
    } catch (error) {
      console.error("Erro ao gerenciar wishlist:", error);
      alert("Erro ao gerenciar lista de favoritos");
      // Finalmente, limpa o estado de loading
    } finally {
      setLoadingWishlist(null);
    }
  };

  return (
    <section className="container mx-auto px-4 py-8 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">Produtos em Destaque</h2>
        <Link
          href={`/${slug}/menu`}
          className="text-primary hover:text-primary/80 font-medium"
        >
          Ver todos →
        </Link>
      </div>

      {store.products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {store.products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-2 rounded-xl bg-[var(--card-product)] px-4 py-3"
            >
              <CardProducts
                product={product}
                wishlistItems={wishlistItems}
                loadingWishlist={loadingWishlist}
                handleAddToWishlist={handleAddToWishlist}
                handleAddToCart={handleAddToCart}
                loadingCart={loadingCart}
                slug={slug}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground py-12 text-center">
          <p>Nenhum produto disponível no momento.</p>
        </div>
      )}
    </section>
  );
};

export default HighlightedProducst;
