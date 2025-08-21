import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Product } from "@prisma/client";

export function useProductList() {
  const params = useParams();
  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");

  // Buscar todos os produtos
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products?storeSlug=${slug}`);

        if (!response.ok) {
          throw new Error("Erro ao carregar produtos");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setError("Erro ao carregar produtos");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProducts();
    }
  }, [slug]);

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = products
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating":
          return b.rating - a.rating;
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  return {
    // Estado
    products,
    loading,
    error,
    searchTerm,
    viewMode,
    sortBy,
    slug,
    filteredAndSortedProducts,

    // Actions
    setSearchTerm,
    setViewMode,
    setSortBy,
  };
}
