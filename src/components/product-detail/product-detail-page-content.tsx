"use client";

import ButtonBack from "@/components/ui/ButtonBack";

import { ActionButtons } from "@/app/[slug]/product/[productId]/components/action-buttons";
import { ErrorState } from "@/app/[slug]/product/[productId]/components/error-state";
import { LoadingState } from "@/app/[slug]/product/[productId]/components/loading-state";
import { ProductGallery } from "@/app/[slug]/product/[productId]/components/product-gallery";
import { ProductHeader } from "@/app/[slug]/product/[productId]/components/product-header";
import { ProductPricing } from "@/app/[slug]/product/[productId]/components/product-pricing";
import { ProductStats } from "@/app/[slug]/product/[productId]/components/product-stats";
import { ProductTabs } from "@/app/[slug]/product/[productId]/components/product-tabs";
import { QuantitySelector } from "@/app/[slug]/product/[productId]/components/quantity-selector";
import { ShippingInfo } from "@/app/[slug]/product/[productId]/components/shipping-info";
import { useProductDetailPage } from "@/components/product-detail/use-product-detail-page";

export function ProductDetailPageContent() {
  const {
    product,
    loading,
    error,
    quantity,
    categoriesPath,
    loadingCart,
    loadingWishlist,
    isInWishlist,
    handleQuantityChange,
    handleAddToCartWithQuantity,
    handleAddToWishlistClick,
  } = useProductDetailPage();

  if (loading) {
    return <LoadingState />;
  }

  if (error || !product) {
    return <ErrorState categoriesPath={categoriesPath} error={error || ""} />;
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)]">
      <div className="container mx-auto px-4 py-4">
        <ButtonBack />
      </div>

      <div className="container mx-auto px-4 pb-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <ProductGallery
            images={product.images}
            productName={product.name}
            isOnSale={Boolean(product.isOnSale)}
            isFeatured={Boolean(product.isFeatured)}
          />

          <div className="space-y-6">
            <ProductHeader
              name={product.name}
              brandName={product.brand?.name || ""}
              shortDesc={product.shortDesc}
              rating={product.rating}
              reviewCount={product.reviewCount}
              soldCount={product.soldCount}
              viewCount={product.viewCount}
            />

            <ProductPricing
              price={product.price}
              originalPrice={product.originalPrice}
            />

            <QuantitySelector
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
            />

            <ActionButtons
              onAddToCart={handleAddToCartWithQuantity}
              onAddToWishlist={handleAddToWishlistClick}
              loadingCart={Boolean(loadingCart)}
              loadingWishlist={Boolean(loadingWishlist)}
              isInWishlist={isInWishlist}
            />

            <ShippingInfo />
          </div>
        </div>

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
