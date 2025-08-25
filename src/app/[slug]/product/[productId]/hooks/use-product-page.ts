import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product, Brand } from "@prisma/client";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/app/[slug]/context/cart";

type ProductWithBrand = Product & {
  brand: Brand;
};

export function useProductPage() {
  const [product, setProduct] = useState<ProductWithBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const productId = params.productId as string;

  const { isAuthenticated } = useAuth();
  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist(slug);
  const { loadingCart, handleAddToCart } = useAddToCart(slug);
  const { addProductToCart, loading: cartLoading } = useCart();

  const isInWishlist = product ? wishlistItems.has(product.id) : false;

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

  const handleAddToCartWithQuantity = async () => {
    if (product) {
      try {
        // Adicionar produto com a quantidade selecionada
        await addProductToCart({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          images: product.images,
          specifications: product.specifications,
          quantity: quantity,
        });

        // Redirecionar para o carrinho após adicionar
        router.push(`/${slug}/carrinho`);
      } catch (error) {
        console.error("Erro ao adicionar produto ao carrinho:", error);
        alert("Erro ao adicionar produto ao carrinho. Tente novamente.");
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
    loadingCart: loadingCart || cartLoading,
    loadingWishlist,
    isInWishlist,

    // Actions
    handleQuantityChange,
    handleAddToCartWithQuantity,
    handleAddToWishlistClick,
  };
}
