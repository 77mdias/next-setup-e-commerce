"use client";

import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";
import CardProducts from "@/components/ui/card-products";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";
import ButtonBack from "@/components/ui/ButtonBack";
import { Search, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductList } from "./hooks/use-product-list";

export default function ProductListPage() {
  const router = useRouter();
  const {
    loading,
    error,
    searchTerm,
    viewMode,
    sortBy,
    slug,
    filteredAndSortedProducts,
    setSearchTerm,
    setViewMode,
    setSortBy,
  } = useProductList();

  const { wishlistItems, loadingWishlist, handleAddToWishlist } =
    useWishlist(slug);
  const { loadingCart, handleAddToCart } = useAddToCart(slug);

  const handleViewProduct = (product: Product) => {
    router.push(`/${slug}/product/${product.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[var(--all-black)]">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--button-primary)]"></div>
            <span className="ml-2 text-white">Carregando produtos...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen bg-[var(--all-black)]">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center">
            <div className="mb-4 text-6xl">❌</div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Erro ao carregar produtos
            </h1>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)]">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <ButtonBack />
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Título */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Todos os Produtos</h1>
          <p className="text-gray-400">
            {filteredAndSortedProducts.length} produto
            {filteredAndSortedProducts.length !== 1 ? "s" : ""} encontrado
            {filteredAndSortedProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Controles */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {/* Busca */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-gray-700 bg-gray-800 pl-10 text-white placeholder-gray-400"
            />
          </div>

          {/* Controles de visualização */}
          <div className="flex items-center gap-2">
            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              <option value="name">Nome A-Z</option>
              <option value="price">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="rating">Melhor Avaliação</option>
              <option value="newest">Mais Recentes</option>
            </select>

            {/* Modo de visualização */}
            <div className="flex rounded-lg bg-gray-800 p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid de Produtos */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🔍</div>
            <h2 className="mb-2 text-xl font-semibold text-white">
              Nenhum produto encontrado
            </h2>
            <p className="text-gray-400">
              {searchTerm
                ? `Nenhum produto encontrado para "${searchTerm}"`
                : "Não há produtos disponíveis"}
            </p>
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm("")}
                className="mt-4 bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]"
              >
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div
            className={`grid gap-8 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {filteredAndSortedProducts.map((product) => (
              <CardProducts
                key={product.id}
                product={product}
                wishlistItems={wishlistItems}
                loadingWishlist={loadingWishlist}
                handleAddToWishlist={handleAddToWishlist}
                handleAddToCart={handleAddToCart}
                loadingCart={loadingCart}
                slug={slug}
                buttonCardProduct={handleViewProduct}
                buttonCardProductName="Ver Produto"
                displayButtonCart="flex"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
