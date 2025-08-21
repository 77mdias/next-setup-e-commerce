"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Grid3X3,
  List,
  Filter,
  ChevronRight,
  Star,
  ShoppingCart,
  Sparkles,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  children: Category[];
  _count: {
    products: number;
  };
}

export default function Categorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/categories?storeSlug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          setFilteredCategories(data);
        }
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [slug]);

  useEffect(() => {
    const filtered = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--button-primary)]"></div>
          <p className="text-white">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--all-black)]">
      {/* Header da Página */}
      <div className="relative overflow-hidden from-[var(--button-primary)] via-purple-600 to-[var(--text-price-secondary)] p-6">
        {/* Elementos decorativos */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-white/5 blur-2xl"></div>

        <div className="relative z-10 container mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 animate-pulse text-white" />
                <h1 className="text-3xl font-bold text-white">📂 Categorias</h1>
              </div>
              <p className="text-white/80">
                Explore nossos produtos organizados por categoria
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
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-white/20 bg-white/10 pl-10 text-white backdrop-blur-sm placeholder:text-gray-300 focus:bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
            >
              <List className="mr-2 h-4 w-4" />
              Lista
            </Button>
          </div>

          <div className="text-sm text-white/60">
            {filteredCategories.length} categoria
            {filteredCategories.length !== 1 ? "s" : ""} encontrada
            {filteredCategories.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Grid de Categorias */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/${slug}/categorias/${category.slug}`}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="animate-in fade-in slide-in-from-bottom-4 transform overflow-hidden rounded-xl border border-gray-700/50 bg-[var(--card-product)] shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                  {/* Imagem da Categoria */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[var(--button-primary)] to-[var(--text-price-secondary)]">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="animate-pulse text-4xl">
                          {category.iconUrl || "📁"}
                        </span>
                      </div>
                    )}

                    {/* Overlay com gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Badge de produtos */}
                    <div className="absolute top-3 right-3 rounded-full border border-white/30 bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <span className="text-sm font-medium text-white">
                        {category._count.products} produtos
                      </span>
                    </div>

                    {/* Efeito de brilho no hover */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-white transition-colors duration-300 group-hover:text-[var(--button-primary)]">
                        {category.name}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 transition-colors duration-300 group-hover:translate-x-1 group-hover:text-[var(--button-primary)]" />
                    </div>

                    {category.description && (
                      <p className="mb-4 line-clamp-2 text-sm text-gray-300">
                        {category.description}
                      </p>
                    )}

                    {/* Subcategorias */}
                    {category.children && category.children.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs tracking-wide text-gray-400 uppercase">
                          Subcategorias:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {category.children.slice(0, 3).map((child) => (
                            <span
                              key={child.id}
                              className="rounded-full border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
                            >
                              {child.name}
                            </span>
                          ))}
                          {category.children.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{category.children.length - 3} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Lista de Categorias */
          <div className="space-y-4">
            {filteredCategories.map((category, index) => (
              <Link
                key={category.id}
                href={`/${slug}/categorias/${category.slug}`}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="animate-in fade-in slide-in-from-left-4 rounded-lg border border-gray-700/50 bg-[var(--card-product)] p-6 transition-all duration-300 hover:bg-gray-800/50">
                  <div className="flex items-center space-x-4">
                    {/* Ícone/Imagem */}
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[var(--button-primary)] to-[var(--text-price-secondary)]">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-2xl">
                          {category.iconUrl || "📁"}
                        </span>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="truncate text-lg font-semibold text-white transition-colors duration-300 group-hover:text-[var(--button-primary)]">
                          {category.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="rounded-full border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-sm text-gray-400">
                            {category._count.products} produtos
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 transition-colors duration-300 group-hover:translate-x-1 group-hover:text-[var(--button-primary)]" />
                        </div>
                      </div>

                      {category.description && (
                        <p className="mb-3 line-clamp-2 text-sm text-gray-300">
                          {category.description}
                        </p>
                      )}

                      {/* Subcategorias */}
                      {category.children && category.children.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {category.children.map((child) => (
                            <span
                              key={child.id}
                              className="rounded-full border border-gray-600/50 bg-gray-700/50 px-2 py-1 text-xs text-gray-300"
                            >
                              {child.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Estado Vazio */}
        {filteredCategories.length === 0 && !loading && (
          <div className="animate-in fade-in py-12 text-center">
            <div className="mb-4 animate-bounce text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Nenhuma categoria encontrada
            </h3>
            <p className="mb-6 text-gray-400">
              Tente ajustar sua busca ou explore todas as categorias
            </p>
            <Button
              onClick={() => setSearchTerm("")}
              className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
            >
              Limpar Busca
            </Button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }

        .slide-in-from-bottom-4 {
          animation: slideInFromBottom 0.5s ease-out forwards;
        }

        .slide-in-from-left-4 {
          animation: slideInFromLeft 0.5s ease-out forwards;
        }

        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
