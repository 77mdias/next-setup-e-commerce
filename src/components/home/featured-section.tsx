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
    <section className={cn("w-full px-4 sm:px-6 lg:px-8", className)}>
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="[font-family:var(--font-space-grotesk)] text-3xl font-bold text-[#0f172a] sm:text-[30px] dark:text-[#f1f3f5]">
            {title}
          </h2>
          <p className="mt-2 [font-family:var(--font-arimo)] text-base text-[#475569] dark:text-[#6a7282]">
            {subtitle}
          </p>
        </div>

        <Link
          href={viewAllHref}
          className="inline-flex w-fit items-center gap-2 [font-family:var(--font-arimo)] text-base text-[#4a6ff0] transition-colors hover:text-[#2f58eb] dark:text-[#5c7cfa] dark:hover:text-[#8fa3ff]"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <FeaturedProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
