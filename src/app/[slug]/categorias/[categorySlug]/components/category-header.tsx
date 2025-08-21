"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Search, Sparkles, ShoppingCart } from "lucide-react";

interface CategoryHeaderProps {
  slug: string;
  category: {
    name: string;
    description: string | null;
    iconUrl: string | null;
  };
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showProducts: boolean;
}

export function CategoryHeader({
  slug,
  category,
  searchTerm,
  onSearchChange,
  showProducts,
}: CategoryHeaderProps) {
  return (
    <div className="relative overflow-hidden from-[var(--button-primary)] via-purple-600 to-[var(--text-price-secondary)] p-6">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/5 blur-2xl"></div>

      <div className="relative z-10 container mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2">
          <Link href={`/${slug}/categorias`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar às Categorias
            </Button>
          </Link>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 animate-pulse text-white" />
              <span className="text-2xl">{category.iconUrl || "📁"}</span>
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
            </div>
            <p className="text-white/80">
              {category.description || `Explore produtos em ${category.name}`}
            </p>
          </div>
          <div className="hidden items-center space-x-2 md:flex">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Barra de Busca */}
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            type="text"
            placeholder={
              showProducts ? "Buscar produtos..." : "Buscar subcategorias..."
            }
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-white/20 bg-white/10 pl-10 text-white backdrop-blur-sm placeholder:text-gray-300 focus:bg-white/20"
          />
        </div>
      </div>
    </div>
  );
}
