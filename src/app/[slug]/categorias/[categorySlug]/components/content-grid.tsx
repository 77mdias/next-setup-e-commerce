"use client";

import { ProductCard } from "./product-card";
import { SubcategoryCard } from "./subcategory-card";

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

interface ContentGridProps {
  showProducts: boolean;
  viewMode: "grid" | "list";
  slug: string;
  products: Product[];
  subcategories: Subcategory[];
}

export function ContentGrid({
  showProducts,
  viewMode,
  slug,
  products,
  subcategories,
}: ContentGridProps) {
  if (showProducts) {
    return viewMode === "grid" ? (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            slug={slug}
            viewMode="grid"
            index={index}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-4">
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            slug={slug}
            viewMode="list"
            index={index}
          />
        ))}
      </div>
    );
  }

  return viewMode === "grid" ? (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {subcategories.map((subcategory, index) => (
        <SubcategoryCard
          key={subcategory.id}
          subcategory={subcategory}
          slug={slug}
          viewMode="grid"
          index={index}
        />
      ))}
    </div>
  ) : (
    <div className="space-y-4">
      {subcategories.map((subcategory, index) => (
        <SubcategoryCard
          key={subcategory.id}
          subcategory={subcategory}
          slug={slug}
          viewMode="list"
          index={index}
        />
      ))}
    </div>
  );
}
