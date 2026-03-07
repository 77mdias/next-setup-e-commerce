"use client";

import { useState, useEffect, useCallback } from "react";
import RemoveBgProcessor from "@/components/RemoveBgProcessor";

interface Product {
  id: string;
  name: string;
  images: string[];
}

interface ProductsApiResponse {
  success?: boolean;
  products?: Product[];
  total?: number | null;
  page?: number;
  totalPages?: number | null;
  error?: string;
}

interface PersistImagesApiResponse {
  success?: boolean;
  error?: string;
}

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

const PAGE_SIZE = 12;

export default function RemoveBgPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoadingError(null);
      setIsFetchingProducts(true);

      const params = new URLSearchParams({
        includeFacets: "0",
        includeTotal: "1",
        limit: PAGE_SIZE.toString(),
        sort: "name-asc",
        page: currentPage.toString(),
      });

      const normalizedSearch = searchTerm.trim();
      if (normalizedSearch.length > 0) {
        params.set("query", normalizedSearch);
      }

      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as ProductsApiResponse;

      if (!response.ok || !data.success || !Array.isArray(data.products)) {
        throw new Error(data.error ?? "Falha ao carregar produtos");
      }

      setProducts(data.products);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setTotalProducts(
        typeof data.total === "number" ? data.total : data.products.length,
      );
      setSelectedProduct((currentProduct) => {
        if (!currentProduct) {
          return null;
        }

        return (
          data.products?.find((product) => product.id === currentProduct.id) ??
          null
        );
      });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setLoadingError(
        error instanceof Error
          ? error.message
          : "Erro ao buscar produtos para processamento",
      );
      setProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setSelectedProduct(null);
    } finally {
      setIsFetchingProducts(false);
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleImagesProcessed = async (processedImages: string[]) => {
    if (!selectedProduct) {
      return;
    }

    setFeedback(null);
    setIsSavingImages(true);

    try {
      const response = await fetch(
        `/api/admin/products/${selectedProduct.id}/images`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            processedImages,
          }),
        },
      );
      const data = (await response.json()) as PersistImagesApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? "Falha ao salvar imagens processadas");
      }

      setFeedback({
        type: "success",
        message: "Imagens processadas e persistidas com sucesso.",
      });
      await fetchProducts();
    } catch (error) {
      console.error("Erro ao salvar imagens:", error);
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao salvar imagens processadas",
      });
    } finally {
      setIsSavingImages(false);
    }
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedSearch = searchInput.trim();
    const isSameSearch = normalizedSearch === searchTerm;

    setCurrentPage(1);
    setSearchTerm(normalizedSearch);

    if (isSameSearch && currentPage === 1) {
      void fetchProducts();
    }
  };

  const clearSearch = () => {
    if (searchInput.length === 0 && searchTerm.length === 0) {
      return;
    }

    setSearchInput("");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const canGoToPreviousPage = currentPage > 1 && !isFetchingProducts;
  const canGoToNextPage = currentPage < totalPages && !isFetchingProducts;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Remover Fundo das Imagens
          </h1>
          <p className="text-gray-600">
            Selecione um produto para processar suas imagens com a API do
            Remove.bg
          </p>
        </div>

        {feedback && (
          <div
            className={`mb-6 rounded-md border p-4 text-sm ${
              feedback.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {isSavingImages && (
          <div className="mb-6 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Persistindo imagens processadas no produto selecionado...
          </div>
        )}

        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Selecionar Produto
          </h2>

          <form onSubmit={handleSearchSubmit} className="mb-4 flex gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar produto por nome"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isFetchingProducts}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={clearSearch}
              disabled={isFetchingProducts}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Limpar
            </button>
          </form>

          <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
            <p>
              {totalProducts} resultado(s)
              {searchTerm ? ` para "${searchTerm}"` : ""}
            </p>
            <p>
              Página {currentPage} de {totalPages}
            </p>
          </div>

          {loadingError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {loadingError}
            </div>
          )}

          {isFetchingProducts && (
            <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Atualizando lista de produtos...
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum produto disponível para os filtros atuais.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    selectedProduct?.id === product.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="mb-2 font-medium text-gray-900">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {product.images.length} imagem(ns)
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={!canGoToPreviousPage}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => page + 1)}
              disabled={!canGoToNextPage}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Próxima
            </button>
          </div>
        </div>

        {selectedProduct && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Processando: {selectedProduct.name}
              </h2>
            </div>
            <div className="p-6">
              <RemoveBgProcessor
                productId={selectedProduct.id}
                images={selectedProduct.images}
                onImagesProcessed={handleImagesProcessed}
                apiEndpoint="/api/admin/remove-bg"
              />
            </div>
          </div>
        )}

        {!selectedProduct && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="mb-4 text-gray-400">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Selecione um produto
            </h3>
            <p className="text-gray-600">
              Escolha um produto acima para começar a processar suas imagens
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
