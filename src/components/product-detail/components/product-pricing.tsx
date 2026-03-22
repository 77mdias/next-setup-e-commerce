"use client";

import { formatCurrency } from "@/helpers/format-currency";

interface ProductPricingProps {
  price: number;
  originalPrice?: number | null;
}

export function ProductPricing({ price, originalPrice }: ProductPricingProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const savings = hasDiscount ? originalPrice - price : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <span className="[font-family:var(--font-arimo)] text-4xl font-bold text-[#11100d] dark:text-white">
          {formatCurrency(price)}
        </span>
        {hasDiscount && (
          <span className="[font-family:var(--font-arimo)] text-lg text-[#655a4e] line-through dark:text-[#9f9383]">
            {formatCurrency(originalPrice as number)}
          </span>
        )}
      </div>
      {hasDiscount && (
        <div className="text-sm text-emerald-700 dark:text-emerald-300">
          Save {formatCurrency(savings)} on this offer
        </div>
      )}
    </div>
  );
}
