"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Product } from "@prisma/client";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";
import CardProducts from "@/components/ui/card-products";
import ButtonBack from "@/components/ui/ButtonBack";

const ProductPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist(slug);
  const { loadingCart, handleAddToCart } = useAddToCart(slug);

  const buttonCardProduct = (product: Product) => {
    handleAddToCart(product);
  };

  // Buscar dados do produto
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log("Buscando produto com ID:", productId);

        const response = await fetch(`/api/products/${productId}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erro na API:", errorData);
          throw new Error(errorData.error || "Produto não encontrado");
        }

        const data = await response.json();
        console.log("Dados do produto:", data);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center text-white">
          <h1 className="mb-4 text-2xl font-bold">Produto não encontrado</h1>
          <p className="mb-4 text-gray-400">
            {error || "O produto solicitado não existe"}
          </p>
          <div className="text-sm text-gray-500">
            <p>Slug: {slug}</p>
            <p>Product ID: {productId}</p>
            <p>URL da API: /api/products/{productId}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <ButtonBack />
        <CardProducts
          product={product}
          wishlistItems={wishlistItems}
          loadingWishlist={loadingWishlist}
          handleAddToWishlist={handleAddToWishlist}
          handleAddToCart={handleAddToCart}
          loadingCart={loadingCart}
          slug={slug}
          buttonCardProduct={buttonCardProduct}
          buttonCardProductName="Adicionar ao carrinho"
          displayButtonCart="hidden"
        />
      </div>
    </div>
  );
};

export default ProductPage;
