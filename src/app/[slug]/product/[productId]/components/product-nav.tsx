"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "../../../context/cart";

interface ProductNavProps {
  slug: string;
}

export function ProductNav({ slug }: ProductNavProps) {
  const { wishlistItems } = useWishlist(slug);
  const { products: cartItems } = useCart();

  const wishlistCount = wishlistItems.size;
  const cartCount = cartItems.length;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Navegação Principal */}
          <div className="flex items-center gap-4">
            <Link
              href={`/${slug}`}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Tudo
            </Link>
            <Link
              href={`/${slug}/categorias`}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Categorias
            </Link>
            <Link
              href="/explore"
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Explore
            </Link>
            <Link
              href={`/${slug}/suporte`}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              Suporte
            </Link>
          </div>

          {/* Ações do Usuário */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <Link href={`/${slug}/wishlist`}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-gray-300 hover:text-white"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Carrinho */}
            <Link href={`/${slug}/carrinho`}>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-gray-300 hover:text-white"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--button-primary)] text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
