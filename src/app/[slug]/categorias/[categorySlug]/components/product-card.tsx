"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart, Star, Heart } from "lucide-react";
import { useAddToCart } from "@/hooks/useAddToCart";
import { useWishlist } from "@/hooks/useWishlist";

interface Product {
  id: string;
  name: string;
  slug: string;
  storeId: string;
  brandId: string;
  categoryId: string;
  sku: string;
  description: string;
  shortDesc: string | null;
  price: number;
  originalPrice: number | null;
  costPrice: number | null;
  images: string[];
  specifications: any;
  warranty: string | null;
  weight: number | null;
  dimensions: any;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  brand: {
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
  slug: string;
  viewMode: "grid" | "list";
  index?: number;
}

export function ProductCard({
  product,
  slug,
  viewMode,
  index = 0,
}: ProductCardProps) {
  const router = useRouter();

  // Hooks para carrinho e wishlist
  const { handleAddToCart, loadingCart } = useAddToCart(slug);
  const { wishlistItems, handleAddToWishlist, loadingWishlist } =
    useWishlist(slug);

  if (viewMode === "grid") {
    return (
      <div className="group" style={{ animationDelay: `${index * 100}ms` }}>
        <div className="animate-in fade-in slide-in-from-bottom-4 transform overflow-hidden rounded-xl border border-gray-700/50 bg-[var(--card-product)] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          {/* Imagem do Produto */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--button-primary)] to-[var(--text-price-secondary)]">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="animate-pulse text-4xl">📱</span>
              </div>
            )}

            {/* Overlay com gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Badge de preço */}
            <div className="absolute top-3 right-3 rounded-full border border-white/30 bg-white/20 px-3 py-1 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">
                R$ {product.price.toFixed(2).replace(".", ",")}
              </span>
            </div>

            {/* Efeito de brilho no hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-[var(--button-primary)]">
                {product.name}
              </h3>
              <ChevronLeft className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:rotate-180 group-hover:text-[var(--button-primary)]" />
            </div>

            {product.shortDesc && (
              <p className="mb-4 line-clamp-2 text-sm text-gray-300">
                {product.shortDesc}
              </p>
            )}

            {/* Informações do produto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {product.brand.name}
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-white">{product.rating}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {product.reviewCount} avaliações
                </span>
                <span className="text-sm text-gray-400">
                  {product.soldCount} vendidos
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-4 space-y-3">
              {/* Botões de ação principais */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {/* Botão Wishlist */}
                  <Button
                    onClick={() => handleAddToWishlist(product)}
                    disabled={loadingWishlist === product.id}
                    className="flex h-10 w-10 items-center justify-center rounded-full p-0 transition-colors hover:bg-red-50"
                    variant="outline"
                    aria-label={
                      wishlistItems.has(product.id)
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                    }
                  >
                    {loadingWishlist === product.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Heart
                        className={`h-5 w-5 transition-colors duration-200 ${
                          wishlistItems.has(product.id)
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400 hover:text-red-400"
                        }`}
                      />
                    )}
                  </Button>

                  {/* Botão Carrinho */}
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={loadingCart === product.id}
                    className="h-10 w-10 items-center justify-center rounded-full p-0"
                    variant="outline"
                    aria-label="Adicionar ao carrinho"
                  >
                    {loadingCart === product.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-gray-400 hover:text-blue-400" />
                    )}
                  </Button>
                </div>

                {/* Botão Ver Produto */}
                <Button
                  onClick={() => router.push(`/${slug}/product/${product.id}`)}
                  className="flex-1 bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)] md:min-w-[100px] md:flex-none"
                  size="sm"
                >
                  <span className="hidden md:inline">Ver Produto</span>
                  <span className="md:hidden">Ver</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="group" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="animate-in fade-in slide-in-from-left-4 rounded-lg border border-gray-700/50 bg-[var(--card-product)] p-6 transition-all duration-300 hover:bg-gray-800/50">
        <div className="flex items-center space-x-4">
          {/* Ícone/Imagem */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--button-primary)] to-[var(--text-price-secondary)]">
            {product.images && product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <span className="text-2xl">📱</span>
            )}
          </div>

          {/* Informações */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="truncate text-lg font-semibold text-white transition-colors duration-300 group-hover:text-[var(--button-primary)]">
                {product.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="rounded-full border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-sm text-gray-400">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </span>
                <ChevronLeft className="h-4 w-4 text-gray-400 transition-colors duration-300 group-hover:rotate-180 group-hover:text-[var(--button-primary)]" />
              </div>
            </div>

            {product.shortDesc && (
              <p className="mb-3 line-clamp-2 text-sm text-gray-300">
                {product.shortDesc}
              </p>
            )}

            {/* Informações do produto */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {product.brand.name}
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-white">{product.rating}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {product.reviewCount} avaliações
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="mt-3 flex items-center gap-2">
              {/* Botão Wishlist */}
              <Button
                onClick={() => handleAddToWishlist(product)}
                disabled={loadingWishlist === product.id}
                className="flex h-8 w-8 items-center justify-center rounded-full p-0 transition-colors hover:bg-red-50"
                variant="outline"
                size="sm"
                aria-label={
                  wishlistItems.has(product.id)
                    ? "Remover dos favoritos"
                    : "Adicionar aos favoritos"
                }
              >
                {loadingWishlist === product.id ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                ) : (
                  <Heart
                    className={`h-4 w-4 transition-colors duration-200 ${
                      wishlistItems.has(product.id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-400 hover:text-red-400"
                    }`}
                  />
                )}
              </Button>

              {/* Botão Carrinho */}
              <Button
                onClick={() => handleAddToCart(product)}
                disabled={loadingCart === product.id}
                className="h-8 w-8 items-center justify-center rounded-full p-0"
                variant="outline"
                size="sm"
                aria-label="Adicionar ao carrinho"
              >
                {loadingCart === product.id ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                ) : (
                  <ShoppingCart className="h-4 w-4 text-gray-400 hover:text-blue-400" />
                )}
              </Button>

              {/* Botão Ver Produto */}
              <Button
                onClick={() => router.push(`/${slug}/product/${product.slug}`)}
                className="flex-1 bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
                size="sm"
              >
                Ver Produto
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
