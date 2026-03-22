import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeaturedProductCard } from "@/components/home/featured-product-card";
import type { FeaturedProduct } from "@/components/home/types";
import { cn } from "@/lib/utils";

type FeaturedSectionProps = {
  title: string;
  subtitle: string;
  viewAllHref: string;
  products: FeaturedProduct[];
  className?: string;
};

export function FeaturedSection({
  title,
  subtitle,
  viewAllHref,
  products,
  className,
}: FeaturedSectionProps) {
  return (
    <section
      className={cn(
        "w-full border-b border-[#11100d]/14 pb-16 sm:pb-20 dark:border-[#f2eee8]/12",
        className,
      )}
    >
      <div className="mb-10 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <span className="[font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#6f6254] uppercase dark:text-[#998d7f]">
            Select Shelf
          </span>
          <h2 className="[font-family:var(--font-space-grotesk)] text-3xl leading-tight font-bold text-[#11100d] sm:text-[2.15rem] dark:text-[#f2eee8]">
            {title}
          </h2>
          <p className="[font-family:var(--font-arimo)] text-base text-[#4f463c] dark:text-[#afa598]">
            {subtitle}
          </p>
        </div>

        <Link
          href={viewAllHref}
          className="inline-flex w-fit items-center gap-2 border-b border-[#11100d]/45 pb-1 [font-family:var(--font-arimo)] text-sm tracking-[0.14em] text-[#11100d] uppercase transition-colors hover:border-[#7b5429]/50 hover:text-[#7b5429] dark:border-[#f2eee8]/50 dark:text-[#f2eee8] dark:hover:border-[#d6a56f]/45 dark:hover:text-[#d6a56f]"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
