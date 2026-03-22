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
      className="group overflow-hidden rounded-2xl border border-[#d8cfbf] bg-white transition-all hover:-translate-y-0.5 hover:border-[#c9bda8] dark:border-white/10 dark:bg-[#17140f] dark:hover:border-white/20"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f4efe5] dark:bg-[#17130f]">
        <Image
          src={imageSrc}
          alt={`Imagem do produto ${product.name}`}
          fill
          unoptimized={shouldUseUnoptimizedImage(imageSrc)}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
        />
        {(product.isOnSale || product.isFeatured) && (
          <span className="absolute top-3 left-3 rounded-full bg-[#916130] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase dark:text-[#11100d]">
            {product.isOnSale ? "Sale" : "New"}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#655a4e] uppercase dark:text-[#b8ad9f]">
            {categoryName}
          </span>
          <span className="inline-flex items-center gap-1 text-[#4f463c] dark:text-[#c7ced9]">
            <Star className="h-3.5 w-3.5 fill-[#f0b100] text-[#f0b100]" />
            {ratingValue}
          </span>
        </div>

        <h3 className="line-clamp-2 [font-family:var(--font-space-grotesk)] text-base font-bold text-[#11100d] dark:text-white">
          {product.name}
        </h3>

        <div className="flex items-end gap-2 pt-1">
          <span className="[font-family:var(--font-arimo)] text-lg font-bold text-[#11100d] dark:text-white">
            {formatCurrency(product.price)}
          </span>
          {hasDiscount && (
            <span className="[font-family:var(--font-arimo)] text-sm text-[#655a4e] line-through dark:text-[#9f9383]">
              {formatCurrency(product.originalPrice as number)}
            </span>
          )}
        </div>

        <span className="inline-flex text-sm text-[#50586c] transition-colors group-hover:text-[#3f4658] dark:text-[#9ca4ba] dark:group-hover:text-[#b7c4ff]">
          View product
        </span>
      </div>
    </Link>
  );
}

export function RelatedGear({ products, loading }: RelatedGearProps) {
  return (
    <section className="mt-12 space-y-4">
      <h2 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#11100d] dark:text-white">
        Related Gear
      </h2>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-[#d8cfbf] bg-white dark:border-white/10 dark:bg-[#17140f]"
            >
              <div className="aspect-[4/3] animate-pulse bg-[#f4efe5] dark:bg-[#17130f]" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-20 animate-pulse rounded bg-[#f4efe5] dark:bg-white/5" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-[#f4efe5] dark:bg-white/5" />
                <div className="h-4 w-2/5 animate-pulse rounded bg-[#f4efe5] dark:bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="rounded-2xl border border-[#d8cfbf] bg-white p-6 text-sm text-[#655a4e] dark:border-white/10 dark:bg-[#17140f] dark:text-[#b8ad9f]">
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
