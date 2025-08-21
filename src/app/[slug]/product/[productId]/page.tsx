"use client";

import { ProductGallery } from "./components/product-gallery";
import { ProductHeader } from "./components/product-header";
import { ProductPricing } from "./components/product-pricing";
import { QuantitySelector } from "./components/quantity-selector";
import { ActionButtons } from "./components/action-buttons";
import { ShippingInfo } from "./components/shipping-info";
import { ProductTabs } from "./components/product-tabs";
import { ProductStats } from "./components/product-stats";
import { LoadingState } from "./components/loading-state";
import { ErrorState } from "./components/error-state";
import { useProductPage } from "./hooks/use-product-page";
import { useRouter } from "next/navigation";
import ButtonBack from "@/components/ui/ButtonBack";

export default function ProductPage() {
  const router = useRouter();
  const {
    product,
    loading,
    error,
    quantity,
    slug,
    loadingCart,
    loadingWishlist,
    isInWishlist,
    handleQuantityChange,
    handleAddToCartWithQuantity,
    handleAddToWishlistClick,
  } = useProductPage();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !product) {
    return <ErrorState slug={slug || ""} error={error || ""} />;
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)]">
      {/* VOLTAR */}
      <div className="container mx-auto px-4 py-4">
        <ButtonBack />
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Galeria de Imagens */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            isOnSale={Boolean(product.isOnSale)}
            isFeatured={Boolean(product.isFeatured)}
          />

          {/* Informações do Produto */}
          <div className="space-y-6">
            {/* Cabeçalho do Produto */}
            <ProductHeader
              name={product.name}
              brandName={product.brand?.name || ""}
              shortDesc={product.shortDesc}
              rating={product.rating}
              reviewCount={product.reviewCount}
              soldCount={product.soldCount}
              viewCount={product.viewCount}
            />

            {/* Preços */}
            <ProductPricing
              price={product.price}
              originalPrice={product.originalPrice}
            />

            {/* Seletor de Quantidade */}
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
            />

            {/* Botões de Ação */}
            <ActionButtons
              onAddToCart={handleAddToCartWithQuantity}
              onAddToWishlist={handleAddToWishlistClick}
              loadingCart={Boolean(loadingCart)}
              loadingWishlist={Boolean(loadingWishlist)}
              isInWishlist={isInWishlist}
            />

            {/* Informações de Entrega */}
            <ShippingInfo />
          </div>
        </div>

        {/* Abas de Descrição e Especificações */}
        <div className="mt-12">
          <ProductTabs
            description={product.description}
            specifications={product.specifications}
            sku={product.sku}
            weight={product.weight}
            warranty={product.warranty}
            dimensions={product.dimensions}
          />
        </div>

        {/* Estatísticas do Produto */}
        <div className="mt-8">
          <ProductStats
            viewCount={product.viewCount}
            soldCount={product.soldCount}
          />
        </div>
      </div>
    </div>
  );
}
