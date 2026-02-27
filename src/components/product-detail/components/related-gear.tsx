"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import { formatCurrency } from "@/helpers/format-currency";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

import type { RelatedGearProduct } from "@/components/product-detail/use-product-detail-page";

interface RelatedGearProps {
  products: RelatedGearProduct[];
  loading: boolean;
}

function RelatedGearCard({ product }: { product: RelatedGearProduct }) {
  const imageSrc = normalizeProductImageSrc(product.images[0]);
  const categoryName = product.category?.name ?? "Gear";
  const hasDiscount =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;
  const ratingValue = product.rating > 0 ? product.rating.toFixed(1) : "—";

  return (
    <Link
      href={`/product/${product.id}`}
      className="group overflow-hidden rounded-2xl border border-[#dbe4ff] bg-white transition-all hover:-translate-y-0.5 hover:border-[#bfcff7] dark:border-white/10 dark:bg-[#12151a] dark:hover:border-white/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#edf2ff] dark:bg-[#0f1319]">
        <Image
          src={imageSrc}
          alt={`Imagem do produto ${product.name}`}
          fill
          unoptimized={shouldUseUnoptimizedImage(imageSrc)}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
        />
        {(product.isOnSale || product.isFeatured) && (
          <span className="absolute top-3 left-3 rounded-full bg-[#ff2e63] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase dark:text-[#0b0d10]">
            {product.isOnSale ? "Sale" : "New"}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748b] uppercase dark:text-[#99a1af]">
            {categoryName}
          </span>
          <span className="inline-flex items-center gap-1 text-[#475569] dark:text-[#c7ced9]">
            <Star className="h-3.5 w-3.5 fill-[#f0b100] text-[#f0b100]" />
            {ratingValue}
          </span>
        </div>

        <h3 className="line-clamp-2 [font-family:var(--font-space-grotesk)] text-base font-bold text-[#0f172a] dark:text-white">
          {product.name}
        </h3>

        <div className="flex items-end gap-2 pt-1">
          <span className="[font-family:var(--font-arimo)] text-lg font-bold text-[#0f172a] dark:text-white">
            {formatCurrency(product.price)}
          </span>
          {hasDiscount && (
            <span className="[font-family:var(--font-arimo)] text-sm text-[#64748b] line-through dark:text-[#6a7282]">
              {formatCurrency(product.originalPrice as number)}
            </span>
          )}
        </div>

        <span className="inline-flex text-sm text-[#4a6ff0] transition-colors group-hover:text-[#2f58eb] dark:text-[#8fa3ff] dark:group-hover:text-[#b7c4ff]">
          View product
        </span>
      </div>
    </Link>
  );
}

export function RelatedGear({ products, loading }: RelatedGearProps) {
  return (
    <section className="mt-12 space-y-4">
      <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#0f172a] dark:text-white">
        Related Gear
      </h2>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[#dbe4ff] bg-white dark:border-white/10 dark:bg-[#12151a]"
            >
              <div className="aspect-[4/3] animate-pulse bg-[#edf2ff] dark:bg-[#0f1319]" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-[#edf2ff] dark:bg-white/5" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-[#edf2ff] dark:bg-white/5" />
                <div className="h-4 w-2/5 animate-pulse rounded bg-[#edf2ff] dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="rounded-2xl border border-[#dbe4ff] bg-white p-6 text-sm text-[#64748b] dark:border-white/10 dark:bg-[#12151a] dark:text-[#99a1af]">
          Ainda não encontramos produtos relacionados para este item.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <RelatedGearCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
