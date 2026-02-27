"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ActionButtons } from "@/components/product-detail/components/action-buttons";
import { ErrorState } from "@/components/product-detail/components/error-state";
import { LoadingState } from "@/components/product-detail/components/loading-state";
import { ProductGallery } from "@/components/product-detail/components/product-gallery";
import { ProductHeader } from "@/components/product-detail/components/product-header";
import { ProductPricing } from "@/components/product-detail/components/product-pricing";
import { ProductTabs } from "@/components/product-detail/components/product-tabs";
import { QuantitySelector } from "@/components/product-detail/components/quantity-selector";
import { RelatedGear } from "@/components/product-detail/components/related-gear";
import { ShippingInfo } from "@/components/product-detail/components/shipping-info";
import { useProductDetailPage } from "@/components/product-detail/use-product-detail-page";

export function ProductDetailPageContent() {
  const {
    product,
    relatedProducts,
    loading,
    loadingRelatedProducts,
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
    <main className="min-h-screen w-full bg-[#f6f8ff] text-[#0f172a] dark:bg-[#0b0d10] dark:text-[#f1f3f5]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-14 md:px-6">
        <div className="py-6">
          <Link
            href={categoriesPath}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#0f172a] dark:text-[#99a1af] dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Results
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
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
              categoryName={product.category?.name || ""}
              shortDesc={product.shortDesc}
              rating={product.rating}
              reviewCount={product.reviewCount}
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

        <div className="mt-12 rounded-2xl border border-[#dbe4ff] bg-white p-6 md:p-8 dark:border-white/10 dark:bg-[#12151a]">
          <ProductTabs description={product.description} />
        </div>

        <RelatedGear
          products={relatedProducts}
          loading={loadingRelatedProducts}
        />
      </div>
    </main>
  );
}
