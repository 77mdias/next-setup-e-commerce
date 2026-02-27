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
        className="h-12 flex-1 rounded-2xl bg-[#ff2e63] [font-family:var(--font-arimo)] text-sm font-bold tracking-[0.02em] text-white uppercase hover:bg-[#ff4c7a] dark:text-[#0b0d10]"
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
            ? "bg-[#ff2e63] text-white hover:bg-[#ff4c7a]"
            : "border-[#dbe4ff] bg-white text-[#64748b] hover:border-[#bfcff7] hover:bg-[#edf2ff] hover:text-[#0f172a] dark:border-white/10 dark:bg-[#12151a] dark:text-[#99a1af] dark:hover:border-white/20 dark:hover:bg-[#1a1f27] dark:hover:text-white"
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
