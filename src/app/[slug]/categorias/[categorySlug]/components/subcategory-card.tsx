"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: {
    products: number;
  };
}

interface SubcategoryCardProps {
  subcategory: Subcategory;
  slug: string;
  viewMode: "grid" | "list";
  index?: number;
}

export function SubcategoryCard({
  subcategory,
  slug,
  viewMode,
  index = 0,
}: SubcategoryCardProps) {
  const router = useRouter();

  if (viewMode === "grid") {
    return (
      <div className="group" style={{ animationDelay: `${index * 100}ms` }}>
        <div className="animate-in fade-in slide-in-from-bottom-4 transform overflow-hidden rounded-xl border border-gray-700/50 bg-[var(--card-product)] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          {/* Imagem da Subcategoria */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--button-primary)] to-[var(--text-price-secondary)]">
            {subcategory.imageUrl ? (
              <img
                src={subcategory.imageUrl}
                alt={subcategory.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="animate-pulse text-4xl">
                  {subcategory.iconUrl || "📁"}
                </span>
              </div>
            )}

            {/* Overlay com gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Badge de produtos */}
            <div className="absolute top-3 right-3 rounded-full border border-white/30 bg-white/20 px-3 py-1 backdrop-blur-sm">
              <span className="text-sm font-medium text-white">
                {subcategory._count.products} produto
                {subcategory._count.products !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Efeito de brilho no hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-[var(--button-primary)]">
                {subcategory.name}
              </h3>
              <ChevronLeft className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:rotate-180 group-hover:text-[var(--button-primary)]" />
            </div>

            {subcategory.description && (
              <p className="mb-4 line-clamp-2 text-sm text-gray-300">
                {subcategory.description}
              </p>
            )}

            {/* Botão de ação */}
            <Button
              onClick={() =>
                router.push(`/${slug}/produtos?categoria=${subcategory.slug}`)
              }
              className="w-full bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
              size="sm"
            >
              Ver Produtos
            </Button>
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
            {subcategory.imageUrl ? (
              <img
                src={subcategory.imageUrl}
                alt={subcategory.name}
                className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <span className="text-2xl">{subcategory.iconUrl || "📁"}</span>
            )}
          </div>

          {/* Informações */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="truncate text-lg font-semibold text-white transition-colors duration-300 group-hover:text-[var(--button-primary)]">
                {subcategory.name}
              </h3>
              <div className="flex items-center space-x-2">
                <span className="rounded-full border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-sm text-gray-400">
                  {subcategory._count.products} produto
                  {subcategory._count.products !== 1 ? "s" : ""}
                </span>
                <ChevronLeft className="h-4 w-4 text-gray-400 transition-colors duration-300 group-hover:rotate-180 group-hover:text-[var(--button-primary)]" />
              </div>
            </div>

            {subcategory.description && (
              <p className="mb-3 line-clamp-2 text-sm text-gray-300">
                {subcategory.description}
              </p>
            )}

            {/* Botão de ação */}
            <Button
              onClick={() =>
                router.push(`/${slug}/produtos?categoria=${subcategory.slug}`)
              }
              className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
              size="sm"
            >
              Ver Produtos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
