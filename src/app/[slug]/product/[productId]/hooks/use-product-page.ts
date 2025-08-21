import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Product, Brand } from "@prisma/client";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";

type ProductWithBrand = Product & {
  brand: Brand;
};

export function useProductPage() {
  const [product, setProduct] = useState<ProductWithBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const params = useParams();
  const slug = params.slug as string;
  const productId = params.productId as string;

  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist(slug);
  const { loadingCart, handleAddToCart } = useAddToCart(slug);

  const isInWishlist = Array.from(wishlistItems).some(
    (item: any) => item.id === product?.id,
  );

  // Buscar dados do produto
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Produto não encontrado");
        }

        const data = await response.json();
        setProduct(data.product);
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
        setError(
          error instanceof Error ? error.message : "Erro ao carregar produto",
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (product) {
      // Adicionar múltiplas quantidades
      for (let i = 0; i < quantity; i++) {
        handleAddToCart(product);
      }
    }
  };

  const handleAddToWishlistClick = () => {
    if (product) {
      handleAddToWishlist(product);
    }
  };

  return {
    // Estado
    product,
    loading,
    error,
    quantity,
    slug,

    // Hooks
    loadingCart,
    loadingWishlist,
    isInWishlist,

    // Actions
    handleQuantityChange,
    handleAddToCartWithQuantity,
    handleAddToWishlistClick,
  };
}
