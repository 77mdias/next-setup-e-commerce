"use client";

import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < 99) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">Quantidade:</label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecrease}
          disabled={quantity <= 1}
          className="h-10 w-10 p-0 text-[var(--text-primary)]"
        >
          -
        </Button>
        <span className="w-16 text-center text-lg font-medium text-white">
          {quantity}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleIncrease}
          disabled={quantity >= 99}
          className="h-10 w-10 p-0 text-[var(--text-primary)]"
        >
          +
        </Button>
      </div>
    </div>
  );
}
