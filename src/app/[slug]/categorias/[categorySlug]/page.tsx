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
  ChevronLeft,
  Filter,
  Sparkles,
  ShoppingCart,
} from "lucide-react";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  children: Subcategory[];
}

export default function CategoryPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "products" | "sortOrder">(
    "sortOrder",
  );

  const params = useParams();
  const slug = params.slug as string;
  const categorySlug = params.categorySlug as string;

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(
          `/api/categories/${categorySlug}?storeSlug=${slug}`,
        );
        if (response.ok) {
          const data = await response.json();
          setCategory(data);
          setFilteredSubcategories(data.children || []);
        }
      } catch (error) {
        console.error("Erro ao buscar categoria:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug, categorySlug]);

  useEffect(() => {
    if (!category?.children) return;

    let filtered = category.children.filter(
      (subcategory) =>
        subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );

    // Ordenação
    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "products":
          return b._count.products - a._count.products;
        case "sortOrder":
        default:
          return a.sortOrder - b.sortOrder;
      }
    });

    setFilteredSubcategories(filtered);
  }, [searchTerm, category, sortBy]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--button-primary)]"></div>
          <p className="text-white">Carregando subcategorias...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h3 className="mb-2 text-xl font-semibold text-white">
            Categoria não encontrada
          </h3>
          <p className="mb-6 text-gray-400">
            A categoria que você está procurando não existe
          </p>
          <Link href={`/${slug}/categorias`}>
            <Button className="bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]">
              Voltar às Categorias
            </Button>
          </Link>
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
                <h1 className="text-3xl font-bold text-white">
                  {category.name}
                </h1>
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
              placeholder="Buscar subcategorias..."
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

            {/* Filtro de Ordenação */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-md border border-gray-700 bg-[var(--card-product)] px-3 py-1 text-sm text-white focus:ring-2 focus:ring-[var(--button-primary)] focus:outline-none"
              >
                <option value="sortOrder">Ordenar por</option>
                <option value="name">Nome A-Z</option>
                <option value="products">Mais Produtos</option>
                <option value="sortOrder">Padrão</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-white/60">
            {filteredSubcategories.length} subcategoria
            {filteredSubcategories.length !== 1 ? "s" : ""} encontrada
            {filteredSubcategories.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Grid de Subcategorias */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSubcategories.map((subcategory, index) => (
              <Link
                key={subcategory.id}
                href={`/${slug}/produtos?categoria=${subcategory.slug}`}
                className="group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
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
                      className="w-full bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
                      size="sm"
                    >
                      Ver Produtos
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Lista de Subcategorias */
          <div className="space-y-4">
            {filteredSubcategories.map((subcategory, index) => (
              <Link
                key={subcategory.id}
                href={`/${slug}/produtos?categoria=${subcategory.slug}`}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                        <span className="text-2xl">
                          {subcategory.iconUrl || "📁"}
                        </span>
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
                        className="bg-[var(--button-primary)] transition-all duration-200 hover:bg-[var(--text-price-secondary)]"
                        size="sm"
                      >
                        Ver Produtos
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Estado Vazio */}
        {filteredSubcategories.length === 0 && !loading && (
          <div className="animate-in fade-in py-12 text-center">
            <div className="mb-4 animate-bounce text-6xl">🔍</div>
            <h3 className="mb-2 text-xl font-semibold text-white">
              Nenhuma subcategoria encontrada
            </h3>
            <p className="mb-6 text-gray-400">
              Tente ajustar sua busca ou explore outras categorias
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
