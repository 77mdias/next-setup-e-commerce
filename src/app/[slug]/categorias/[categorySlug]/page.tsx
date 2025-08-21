"use client";

import { CategoryHeader } from "./components/category-header";
import { CategoryControls } from "./components/category-controls";
import { ContentGrid } from "./components/content-grid";
import { EmptyState } from "./components/empty-state";
import { LoadingState } from "./components/loading-state";
import { ErrorState } from "./components/error-state";
import { useCategoryPage } from "./hooks/use-category-page";

export default function CategoryPage() {
  const {
    category,
    filteredSubcategories,
    filteredProducts,
    searchTerm,
    viewMode,
    loading,
    sortBy,
    showProducts,
    slug,
    hasSubcategories,
    hasProducts,
    setSearchTerm,
    setViewMode,
    setSortBy,
    setShowProducts,
  } = useCategoryPage();

  // Estados de loading e erro
  if (loading) {
    return <LoadingState />;
  }

  if (!category) {
    return <ErrorState slug={slug} />;
  }

  const filteredCount = showProducts
    ? filteredProducts.length
    : filteredSubcategories.length;
  const isEmpty = filteredCount === 0;

  return (
    <div className="min-h-screen bg-[var(--all-black)]">
      {/* Header da Página */}
      <CategoryHeader
        slug={slug}
        category={category}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showProducts={showProducts}
      />

      {/* Controles */}
      <div className="container mx-auto px-4 py-6">
        <CategoryControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showProducts={showProducts}
          onToggleView={setShowProducts}
          hasSubcategories={hasSubcategories}
          hasProducts={hasProducts}
          filteredCount={filteredCount}
        />

        {/* Conteúdo - Subcategorias ou Produtos */}
        {isEmpty ? (
          <EmptyState
            showProducts={showProducts}
            onClearSearch={() => setSearchTerm("")}
          />
        ) : (
          <ContentGrid
            showProducts={showProducts}
            viewMode={viewMode}
            slug={slug}
            products={filteredProducts}
            subcategories={filteredSubcategories}
          />
        )}
      </div>

      {/* Estilos CSS */}
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
