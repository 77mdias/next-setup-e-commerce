"use client";

import { Star } from "lucide-react";

interface ProductHeaderProps {
  name: string;
  brandName?: string;
  categoryName?: string;
  shortDesc?: string | null;
  rating: number;
  reviewCount: number;
}

export function ProductHeader({
  name,
  brandName,
  categoryName,
  shortDesc,
  rating,
  reviewCount,
}: ProductHeaderProps) {
  const normalizedRating = Number.isFinite(rating)
    ? Math.max(0, Math.min(5, rating))
    : 0;
  const effectiveCategory = categoryName || brandName || "Gear";

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <span className="[font-family:var(--font-arimo)] text-xs tracking-[0.05em] text-[#64748b] uppercase dark:text-[#99a1af]">
          {effectiveCategory}
        </span>
        <h1 className="[font-family:var(--font-space-grotesk)] text-3xl leading-tight font-bold text-[#0f172a] md:text-4xl dark:text-white">
          {name}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.round(normalizedRating)
                  ? "fill-[#f0b100] text-[#f0b100]"
                  : "text-[#cbd5e1] dark:text-[#3b4252]"
              }`}
            />
          ))}
        </div>

        <span className="text-sm font-semibold text-[#0f172a] dark:text-white">
          {normalizedRating.toFixed(1)}
        </span>
        <span className="text-sm text-[#64748b] dark:text-[#99a1af]">
          ({reviewCount} reviews)
        </span>

        <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
          In Stock
        </span>
      </div>

      <p className="leading-relaxed text-[#475569] dark:text-[#99a1af]">
        {shortDesc?.trim() ||
          "Built for long sessions and precise movements. Premium ergonomics and responsive tracking for daily use and competitive play."}
      </p>

      <p className="text-xs text-[#64748b] dark:text-[#6a7282]">
        Product details and long-form content are being updated continuously.
      </p>
    </div>
  );
}
