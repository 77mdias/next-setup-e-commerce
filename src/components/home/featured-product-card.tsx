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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-[#11100d]/15 bg-[#f7f4ee] shadow-[0_14px_36px_-28px_rgba(17,16,13,0.65)] transition-transform duration-300 hover:-translate-y-1 hover:border-[#11100d]/28 dark:border-[#f2eee8]/12 dark:bg-[#17140f] dark:shadow-[0_18px_40px_-30px_rgba(0,0,0,0.95)]">
      <div className="relative h-[255px] overflow-hidden bg-[#d7cfc1] dark:bg-[#2a231b]">
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
            "absolute top-4 left-4 rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-[10px] font-semibold tracking-[0.18em] uppercase",
            product.badge.tone === "pink"
              ? "border-[#11100d] bg-[#11100d] text-[#efebe3] dark:border-[#f2eee8] dark:bg-[#f2eee8] dark:text-[#11100d]"
              : "border-[#7b5429]/50 bg-[#e5d4bc] text-[#4f3419] dark:border-[#d6a56f]/45 dark:bg-[#3c2b18] dark:text-[#e8c79f]",
          )}
        >
          {product.badge.label}
        </span>
      )}

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between [font-family:var(--font-arimo)] text-[11px] tracking-[0.16em] text-[#61574c] uppercase dark:text-[#9c9080]">
          <span>{product.category}</span>
          <span className="inline-flex items-center gap-1 text-[#4f463c] dark:text-[#c0b5a7]">
            <Star size={12} className="fill-[#b7894f] text-[#b7894f]" />
            <span className="font-bold">{product.rating}</span>
          </span>
        </div>

        <h3 className="line-clamp-2 [font-family:var(--font-space-grotesk)] text-lg font-bold text-[#11100d] dark:text-[#f2eee8]">
          {product.name}
        </h3>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          <div className="flex min-h-8 items-end gap-2">
            {product.previousPrice && (
              <span className="[font-family:var(--font-arimo)] text-sm text-[#756a5f] line-through dark:text-[#9f9383]">
                {product.previousPrice}
              </span>
            )}
            <span className="[font-family:var(--font-arimo)] text-xl font-bold text-[#11100d] dark:text-[#f2eee8]">
              {product.price}
            </span>
          </div>

          <Link
            href={product.href}
            className="inline-flex w-fit border-b border-[#11100d]/30 pb-1 [font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#11100d] uppercase transition-colors hover:border-[#7b5429]/45 hover:text-[#7b5429] dark:border-[#f2eee8]/35 dark:text-[#f2eee8] dark:hover:border-[#d6a56f]/40 dark:hover:text-[#d6a56f]"
          >
            View product
          </Link>
        </div>
      </div>
    </article>
  );
}
