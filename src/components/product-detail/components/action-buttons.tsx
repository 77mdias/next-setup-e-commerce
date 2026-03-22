"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";

interface ActionButtonsProps {
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  loadingCart: boolean;
  loadingWishlist: boolean;
  isInWishlist: boolean;
}

export function ActionButtons({
  onAddToCart,
  onAddToWishlist,
  loadingCart,
  loadingWishlist,
  isInWishlist,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onAddToCart}
        disabled={loadingCart}
        className="h-12 flex-1 rounded-2xl bg-[#916130] [font-family:var(--font-arimo)] text-sm font-bold tracking-[0.02em] text-white uppercase hover:bg-[#a4753f] dark:text-[#11100d]"
        size="lg"
      >
        {loadingCart ? (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </>
        )}
      </Button>
      <Button
        onClick={onAddToWishlist}
        disabled={loadingWishlist}
        variant="outline"
        className={`h-12 w-12 rounded-2xl p-0 ${
          isInWishlist
            ? "bg-[#916130] text-white hover:bg-[#a4753f]"
            : "border-[#d8cfbf] bg-white text-[#655a4e] hover:border-[#c9bda8] hover:bg-[#f4efe5] hover:text-[#11100d] dark:border-white/10 dark:bg-[#17140f] dark:text-[#b8ad9f] dark:hover:border-white/20 dark:hover:bg-[#1a1f27] dark:hover:text-white"
        }`}
      >
        {loadingWishlist ? (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-current"></div>
        ) : (
          <Heart className={`h-5 w-5 ${isInWishlist ? "fill-white" : ""}`} />
        )}
      </Button>
    </div>
  );
}
