import { useCallback, useEffect, useState } from "react";
import { Product, Brand, Category } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";

import { useCart } from "@/context/cart";
import { useWishlist } from "@/hooks/useWishlist";

type ProductWithBrand = Product & {
  brand: Brand;
  category: Category;
};

export type RelatedGearProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  images: string[];
  isOnSale: boolean;
  isFeatured: boolean;
  category: {
    name: string;
  } | null;
};

type ProductsApiResponse = {
  products?: RelatedGearProduct[];
};

const MAX_RELATED_PRODUCTS = 4;

export function useProductDetailPage() {
  const [product, setProduct] = useState<ProductWithBrand | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedGearProduct[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false);
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

  const requestProducts = useCallback(
    async (queryParams: URLSearchParams, signal: AbortSignal) => {
      const response = await fetch(`/api/products?${queryParams.toString()}`, {
        signal,
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar produtos relacionados");
      }

      const payload = (await response.json()) as ProductsApiResponse;
      return Array.isArray(payload.products) ? payload.products : [];
    },
    [],
  );

  const loadRelatedProducts = useCallback(
    async (sourceProduct: ProductWithBrand, signal: AbortSignal) => {
      setLoadingRelatedProducts(true);

      try {
        const relatedByCategoryParams = new URLSearchParams({
          sort: "rating",
          limit: "8",
          includeFacets: "0",
          includeTotal: "0",
        });

        if (sourceProduct.category?.slug) {
          relatedByCategoryParams.set("category", sourceProduct.category.slug);
        }

        const sameCategory = await requestProducts(
          relatedByCategoryParams,
          signal,
        );

        const mergedById = new Map<string, RelatedGearProduct>();

        for (const candidate of sameCategory) {
          if (candidate.id === sourceProduct.id) {
            continue;
          }

          mergedById.set(candidate.id, candidate);
        }

        if (mergedById.size < MAX_RELATED_PRODUCTS) {
          const fallbackParams = new URLSearchParams({
            sort: "best-selling",
            limit: "8",
            includeFacets: "0",
            includeTotal: "0",
          });

          const fallbackProducts = await requestProducts(
            fallbackParams,
            signal,
          );

          for (const candidate of fallbackProducts) {
            if (
              candidate.id === sourceProduct.id ||
              mergedById.has(candidate.id)
            ) {
              continue;
            }

            mergedById.set(candidate.id, candidate);

            if (mergedById.size >= MAX_RELATED_PRODUCTS) {
              break;
            }
          }
        }

        if (!signal.aborted) {
          setRelatedProducts(
            [...mergedById.values()].slice(0, MAX_RELATED_PRODUCTS),
          );
        }
      } catch (relatedError) {
        if (!signal.aborted) {
          console.warn("Erro ao carregar Related Gear:", relatedError);
          setRelatedProducts([]);
        }
      } finally {
        if (!signal.aborted) {
          setLoadingRelatedProducts(false);
        }
      }
    },
    [requestProducts],
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setError(null);
        setLoading(true);
        setRelatedProducts([]);

        const response = await fetch(`/api/products/${productId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Produto não encontrado");
        }

        const data = await response.json();
        const resolvedProduct = data.product as ProductWithBrand;

        setProduct(resolvedProduct);
        void loadRelatedProducts(resolvedProduct, controller.signal);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Erro ao buscar produto:", fetchError);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Erro ao carregar produto",
        );
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (productId) {
      fetchProduct();
    }

    return () => controller.abort();
  }, [productId, loadRelatedProducts]);

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
    relatedProducts,
    loadingRelatedProducts,
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
