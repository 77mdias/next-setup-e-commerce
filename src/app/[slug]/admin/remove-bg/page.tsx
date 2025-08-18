"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import RemoveBgProcessor from "@/components/RemoveBgProcessor";

interface Product {
  id: string;
  name: string;
  images: string[];
}

export default function RemoveBgPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [slug]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/products/${slug}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
      } else {
        console.error("Erro ao buscar produtos:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagesProcessed = async (processedImages: string[]) => {
    if (!selectedProduct) return;

    try {
      const response = await fetch(`/api/products/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          processedImages: processedImages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Imagens processadas e salvas com sucesso!");
        // Atualizar a lista de produtos
        await fetchProducts();
      } else {
        alert(`Erro ao salvar imagens: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao salvar imagens:", error);
      alert("Erro ao salvar imagens processadas");
    }
  };

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

        {/* Seletor de Produtos */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Selecionar Produto
          </h2>
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
        </div>

        {/* Processador de Imagens */}
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
