import { useEffect, useState } from "react";
import { Product, Brand } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";

import { useCart } from "@/context/cart";
import { useWishlist } from "@/hooks/useWishlist";

type ProductWithBrand = Product & {
  brand: Brand;
};

export function useProductDetailPage() {
  const [product, setProduct] = useState<ProductWithBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const params = useParams();
  const router = useRouter();
  const productId =
    typeof params.productId === "string" ? params.productId : "";
  const cartPath = "/carrinho";
  const categoriesPath = "/products";

  const { wishlistItems, loadingWishlist, handleAddToWishlist } = useWishlist();
  const { addProductToCart, loading: cartLoading } = useCart();

  const isInWishlist = product ? wishlistItems.has(product.id) : false;

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
      } catch (fetchError) {
        console.error("Erro ao buscar produto:", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao carregar produto",
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

  const handleAddToCartWithQuantity = async () => {
    if (!product) {
      return;
    }

    try {
      await addProductToCart({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        images: product.images,
        specifications: product.specifications,
        quantity,
      });

      router.push(cartPath);
    } catch (cartError) {
      console.error("Erro ao adicionar produto ao carrinho:", cartError);
      alert("Erro ao adicionar produto ao carrinho. Tente novamente.");
    }
  };

  const handleAddToWishlistClick = () => {
    if (product) {
      handleAddToWishlist(product);
    }
  };

  return {
    product,
    loading,
    error,
    quantity,
    categoriesPath,
    loadingCart: cartLoading,
    loadingWishlist,
    isInWishlist,
    handleQuantityChange,
    handleAddToCartWithQuantity,
    handleAddToWishlistClick,
  };
}
