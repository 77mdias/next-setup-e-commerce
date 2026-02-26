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
        className="flex-1 bg-[var(--button-primary)] text-[var(--text-primary)] hover:bg-[var(--text-price-secondary)]"
        size="lg"
      >
        {loadingCart ? (
          <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Adicionar ao Carrinho
          </>
        )}
      </Button>
      <Button
        onClick={onAddToWishlist}
        disabled={loadingWishlist}
        variant={isInWishlist ? "default" : "outline"}
        className={`h-12 w-12 p-0 text-[var(--text-primary)] ${
          isInWishlist
            ? "bg-red-500 hover:bg-red-600"
            : "border-gray-600 hover:border-gray-500"
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
