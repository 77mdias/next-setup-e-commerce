"use client";

import { Minus, Plus } from "lucide-react";

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
    <div className="inline-flex w-fit items-center rounded-2xl border border-[#dbe4ff] bg-white p-1 dark:border-white/10 dark:bg-[#12151a]">
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= 1}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[#64748b] transition-colors hover:bg-[#edf2ff] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#99a1af] dark:hover:bg-white/5 dark:hover:text-white"
      >
        <Minus className="h-4 w-4" />
      </button>

      <span className="w-14 text-center text-lg font-semibold text-[#0f172a] dark:text-white">
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= 99}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-[#64748b] transition-colors hover:bg-[#edf2ff] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#99a1af] dark:hover:bg-white/5 dark:hover:text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
