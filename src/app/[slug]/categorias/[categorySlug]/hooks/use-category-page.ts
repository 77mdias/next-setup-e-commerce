import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  children: Subcategory[];
  products: Product[];
  _count: {
    products: number;
  };
}

export function useCategoryPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "products" | "sortOrder">(
    "sortOrder",
  );
  const [showProducts, setShowProducts] = useState(false);

  const params = useParams();
  const slug = params.slug as string;
  const categorySlug = params.categorySlug as string;

  // Buscar dados da categoria
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
          setFilteredProducts(data.products || []);
          setShowProducts(data.children?.length === 0);
        }
      } catch (error) {
        console.error("Erro ao buscar categoria:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug, categorySlug]);

  // Filtrar e ordenar dados
  useEffect(() => {
    if (!category) return;

    if (showProducts) {
      // Filtrar produtos
      let filtered =
        category.products?.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            product.shortDesc?.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

      // Ordenar produtos
      filtered = filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "products":
            return b.soldCount - a.soldCount;
          case "sortOrder":
          default:
            return b.rating - a.rating;
        }
      });

      setFilteredProducts(filtered);
    } else {
      // Filtrar subcategorias
      let filtered =
        category.children?.filter(
          (subcategory) =>
            subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subcategory.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()),
        ) || [];

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
    }
  }, [searchTerm, category, sortBy, showProducts]);

  const hasSubcategories = Boolean(
    category?.children && category.children.length > 0,
  );
  const hasProducts = Boolean(
    category?.products && category.products.length > 0,
  );

  return {
    // Estado
    category,
    filteredSubcategories,
    filteredProducts,
    searchTerm,
    viewMode,
    loading,
    sortBy,
    showProducts,
    slug,

    // Computed
    hasSubcategories,
    hasProducts,

    // Actions
    setSearchTerm,
    setViewMode,
    setSortBy,
    setShowProducts,
  };
}
