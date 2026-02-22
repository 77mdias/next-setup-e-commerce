import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";

import type { FeaturedProduct } from "@/components/home/types";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";
import { cn } from "@/lib/utils";

type FeaturedProductCardProps = {
  product: FeaturedProduct;
};

export function FeaturedProductCard({ product }: FeaturedProductCardProps) {
  const imageSrc = normalizeProductImageSrc(product.imageSrc);
  const useUnoptimized =
    imageSrc.startsWith("http://") ||
    imageSrc.startsWith("https://") ||
    shouldUseUnoptimizedImage(imageSrc);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#cdd9ff] bg-[#f3f7ff] shadow-[0_12px_28px_rgba(76,99,173,0.14)] transition-transform duration-300 hover:-translate-y-1 hover:border-[#b9c9ff] dark:border-white/10 dark:bg-[#1b1f2b] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <div className="relative h-[267px] overflow-hidden bg-[#d6e3ff] dark:bg-[#3f5374]">
        <Image
          src={imageSrc}
          alt={product.imageAlt}
          fill
          unoptimized={useUnoptimized}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>

      {product.badge && (
        <span
          className={cn(
            "absolute top-4 left-4 rounded-[10px] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-bold tracking-[0.05em] uppercase",
            product.badge.tone === "pink"
              ? "bg-[#ff2e63] text-white dark:text-[#0b0d10]"
              : "bg-[#5c7cfa] text-white dark:text-[#0b0d10]",
          )}
        >
          {product.badge.label}
        </span>
      )}

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between [font-family:var(--font-arimo)] text-xs tracking-[0.05em] text-[#64748b] uppercase dark:text-[#6a7282]">
          <span>{product.category}</span>
          <span className="inline-flex items-center gap-1 text-[#4b5563] dark:text-[#99a1af]">
            <Star size={12} className="fill-[#f0b100] text-[#f0b100]" />
            <span className="font-bold">{product.rating}</span>
          </span>
        </div>

        <h3 className="line-clamp-2 [font-family:var(--font-space-grotesk)] text-lg font-bold text-[#0f172a] dark:text-[#f1f3f5]">
          {product.name}
        </h3>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex min-h-8 items-end gap-2">
            {product.previousPrice && (
              <span className="[font-family:var(--font-arimo)] text-sm text-[#64748b] line-through dark:text-[#99a1af]">
                {product.previousPrice}
              </span>
            )}
            <span className="[font-family:var(--font-arimo)] text-xl font-bold text-[#0f172a] dark:text-[#f1f3f5]">
              {product.price}
            </span>
          </div>

          <Link
            href={product.href}
            className="inline-flex [font-family:var(--font-arimo)] text-sm text-[#4a6ff0] transition-colors hover:text-[#2f58eb] dark:text-[#5c7cfa] dark:hover:text-[#8fa3ff]"
          >
            View product
          </Link>
        </div>
      </div>
    </article>
  );
}
