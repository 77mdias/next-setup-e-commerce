"use client";

interface ProductPricingProps {
  price: number;
  originalPrice?: number | null;
}

export function ProductPricing({ price, originalPrice }: ProductPricingProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const savings = hasDiscount ? originalPrice - price : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold text-[var(--text-price)]">
          R$ {price.toFixed(2).replace(".", ",")}
        </span>
        {hasDiscount && (
          <span className="text-lg text-gray-500 line-through">
            R$ {originalPrice!.toFixed(2).replace(".", ",")}
          </span>
        )}
      </div>
      {hasDiscount && (
        <div className="text-sm text-green-400">
          Economia de R$ {savings.toFixed(2).replace(".", ",")}
        </div>
      )}
    </div>
  );
}
