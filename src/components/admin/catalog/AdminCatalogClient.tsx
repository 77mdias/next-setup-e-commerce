"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  adjustAdminCatalogStock,
  createAdminCatalogCategory,
  createAdminCatalogProduct,
  deleteAdminCatalogCategory,
  deleteAdminCatalogProduct,
  type AdminCatalogProductsFilters,
  updateAdminCatalogCategory,
  updateAdminCatalogProduct,
  updateAdminCatalogProductImages,
  useAdminCatalogCategories,
  useAdminCatalogProductDetail,
  useAdminCatalogProducts,
} from "@/hooks/useAdminCatalog";
import { useRemoveBg } from "@/hooks/useRemoveBg";
import { cn } from "@/lib/utils";

import type { ProductFormState, CategoryFormState, StockAdjustmentFormState } from "./types";
import { DEFAULT_FILTERS } from "./types";
import {
  createEmptyProductForm,
  createEmptyCategoryForm,
  createEmptyStockAdjustmentForm,
  mapProductDetailToForm,
  mapCategoryToForm,
  buildProductPayload,
  buildCategoryPayload,
  buildStockPayload,
} from "./utils";

import { ProductFilters } from "./ProductFilters";
import { ProductList } from "./ProductList";
import { ProductForm } from "./ProductForm";
import { CategoryList } from "./CategoryList";
import { CategoryForm } from "./CategoryForm";
import { InventoryHistory } from "./InventoryHistory";
import { StockEditor } from "./StockEditor";

export default function AdminCatalogClient() {
  const [filters, setFilters] = useState<AdminCatalogProductsFilters>(DEFAULT_FILTERS);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(
    createEmptyProductForm(),
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(
    createEmptyCategoryForm(),
  );
  const [stockForm, setStockForm] = useState<StockAdjustmentFormState>(
    createEmptyStockAdjustmentForm(),
  );
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);
  const [isPersistingImages, setIsPersistingImages] = useState(false);

  const {
    data: productsData,
    errorMessage: productsErrorMessage,
    isLoading: isProductsLoading,
    isRefreshing: isProductsRefreshing,
    retry: retryProducts,
  } = useAdminCatalogProducts(filters);
  const {
    data: detailData,
    errorMessage: detailErrorMessage,
    isLoading: isDetailLoading,
    isRefreshing: isDetailRefreshing,
    retry: retryDetail,
  } = useAdminCatalogProductDetail(
    isCreatingProduct ? null : selectedProductId,
  );
  const {
    data: categoriesData,
    errorMessage: categoriesErrorMessage,
    isLoading: isCategoriesLoading,
    isRefreshing: isCategoriesRefreshing,
    retry: retryCategories,
  } = useAdminCatalogCategories();
  const {
    isProcessing: isRemovingBackground,
    processMultipleImages,
    progress: removeBgProgress,
  } = useRemoveBg();

  const meta = productsData?.meta ?? detailData?.meta ?? null;
  const selectedProduct = detailData?.product ?? null;
  const selectedCategory = useMemo(
    () =>
      categoriesData?.categories.find(
        (category) => category.id === selectedCategoryId,
      ) ?? null,
    [categoriesData, selectedCategoryId],
  );

  useEffect(() => {
    const firstProductId = productsData?.products[0]?.id ?? null;

    if (!productsData || isCreatingProduct) {
      return;
    }

    if (productsData.products.length === 0) {
      setSelectedProductId(null);
      return;
    }

    const hasSelection = productsData.products.some(
      (product) => product.id === selectedProductId,
    );

    if (!hasSelection) {
      setSelectedProductId(firstProductId);
    }
  }, [isCreatingProduct, productsData, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct || isCreatingProduct) {
      return;
    }

    setProductForm(mapProductDetailToForm(selectedProduct));
    setStockForm({
      delta: "",
      maxStock: String(selectedProduct.inventory.minStock + 1000),
      minStock: String(selectedProduct.inventory.minStock),
      reason: "",
      reference: "",
      targetType: "product",
      variantId: "",
    });
  }, [isCreatingProduct, selectedProduct]);

  useEffect(() => {
    if (!meta || !isCreatingProduct) {
      return;
    }

    setProductForm((currentForm) =>
      currentForm.storeId || currentForm.brandId || currentForm.categoryId
        ? currentForm
        : createEmptyProductForm({
            brandId: meta.brands[0]?.id ?? "",
            categoryId: meta.categories[0]?.id ?? "",
            storeId: meta.stores[0]?.id ?? "",
          }),
    );
  }, [isCreatingProduct, meta]);

  useEffect(() => {
    if (!categoriesData) {
      return;
    }

    if (categoriesData.categories.length === 0) {
      setSelectedCategoryId(null);
      setCategoryForm(createEmptyCategoryForm());
      return;
    }

    const hasSelection = categoriesData.categories.some(
      (category) => category.id === selectedCategoryId,
    );

    if (!hasSelection) {
      const firstCategory = categoriesData.categories[0];
      setSelectedCategoryId(firstCategory.id);
      setCategoryForm(mapCategoryToForm(firstCategory));
      return;
    }

    const currentCategory = categoriesData.categories.find(
      (category) => category.id === selectedCategoryId,
    );

    if (currentCategory) {
      setCategoryForm(mapCategoryToForm(currentCategory));
    }
  }, [categoriesData, selectedCategoryId]);

  function resetForNewProduct() {
    setIsCreatingProduct(true);
    setSelectedProductId(null);
    setProductForm(
      createEmptyProductForm({
        brandId: meta?.brands[0]?.id ?? "",
        categoryId: meta?.categories[0]?.id ?? "",
        storeId: meta?.stores[0]?.id ?? "",
      }),
    );
    setStockForm(createEmptyStockAdjustmentForm());
  }

  async function handleProductSubmit() {
    try {
      setIsSavingProduct(true);
      const payload = buildProductPayload(productForm);
      const response = isCreatingProduct
        ? await createAdminCatalogProduct(payload)
        : await updateAdminCatalogProduct(selectedProductId!, payload);

      toast.success(
        isCreatingProduct
          ? "Produto criado no catálogo administrativo."
          : "Produto atualizado no catálogo administrativo.",
      );

      if ("id" in response.product) {
        setSelectedProductId(response.product.id);
      }

      setIsCreatingProduct(false);
      retryProducts();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao salvar produto.",
      );
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleDeleteProduct() {
    if (!selectedProductId || !selectedProduct) {
      return;
    }

    if (
      !window.confirm(
        `Remover "${selectedProduct.name}" do catálogo administrativo?`,
      )
    ) {
      return;
    }

    try {
      setIsDeletingProduct(true);
      await deleteAdminCatalogProduct(selectedProductId);
      toast.success("Produto removido do catálogo.");
      setSelectedProductId(null);
      setIsCreatingProduct(false);
      retryProducts();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao remover produto.",
      );
    } finally {
      setIsDeletingProduct(false);
    }
  }

  async function handleProcessImages() {
    if (!selectedProduct || selectedProduct.images.length === 0) {
      toast.error("Selecione um produto com imagens para processar.");
      return;
    }

    try {
      setIsPersistingImages(true);
      const result = await processMultipleImages(selectedProduct.images);

      if (!result.success || result.processedImages.length === 0) {
        throw new Error(
          result.errors[0]?.error ?? "Nenhuma imagem foi processada.",
        );
      }

      await updateAdminCatalogProductImages(
        selectedProduct.id,
        result.processedImages.map((image) => image.processedImage),
      );
      toast.success("Imagens processadas e persistidas no produto.");
      retryProducts();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao processar imagens do produto.",
      );
    } finally {
      setIsPersistingImages(false);
    }
  }

  async function handleStockAdjustment() {
    if (!selectedProductId) {
      return;
    }

    try {
      setIsAdjustingStock(true);
      const payload = buildStockPayload(stockForm);
      await adjustAdminCatalogStock(selectedProductId, payload);
      toast.success("Ajuste de estoque registrado com trilha administrativa.");
      setStockForm((currentValue) => ({
        ...currentValue,
        delta: "",
        reason: "",
        reference: "",
      }));
      retryProducts();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao registrar ajuste de estoque.",
      );
    } finally {
      setIsAdjustingStock(false);
    }
  }

  async function handleCategorySubmit() {
    try {
      setIsSavingCategory(true);
      const payload = buildCategoryPayload(categoryForm);

      if (selectedCategoryId) {
        await updateAdminCatalogCategory(selectedCategoryId, payload);
        toast.success("Categoria atualizada.");
      } else {
        const response = await createAdminCatalogCategory(payload);
        setSelectedCategoryId(response.category.id);
        toast.success("Categoria criada.");
      }

      retryCategories();
      retryProducts();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao salvar categoria.",
      );
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function handleCategoryDelete() {
    if (!selectedCategoryId || !selectedCategory) {
      return;
    }

    if (!window.confirm(`Remover a categoria "${selectedCategory.name}"?`)) {
      return;
    }

    try {
      setIsDeletingCategory(true);
      await deleteAdminCatalogCategory(selectedCategoryId);
      toast.success("Categoria removida.");
      setSelectedCategoryId(null);
      setCategoryForm(createEmptyCategoryForm());
      retryCategories();
      retryProducts();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao remover categoria.",
      );
    } finally {
      setIsDeletingCategory(false);
    }
  }

  return (
    <div className="space-y-6 text-[#f2eee8]">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_1.45fr]">
        {/* Left Panel - Product List */}
        <div
          className={`space-y-5 ${selectedProductId !== null || isCreatingProduct ? "hidden xl:block" : "block"}`}
        >
          <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
            <ProductFilters
              filters={filters}
              onFiltersChange={setFilters}
              onNewProduct={resetForNewProduct}
              meta={meta}
              totalPages={productsData?.totalPages ?? 1}
              currentPage={productsData?.page ?? filters.page}
            />

            <div className="mt-5">
              <ProductList
                products={productsData?.products ?? []}
                selectedProductId={selectedProductId}
                isCreatingProduct={isCreatingProduct}
                isLoading={isProductsLoading}
                onSelectProduct={(productId) => {
                  setIsCreatingProduct(false);
                  setSelectedProductId(productId);
                }}
              />
            </div>

            {(productsErrorMessage || categoriesErrorMessage) && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-amber-50">
                {productsErrorMessage ?? categoriesErrorMessage}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Product Editor */}
        <div
          className={`space-y-5 ${selectedProductId !== null || isCreatingProduct ? "block" : "hidden xl:block"}`}
        >
          <button
            className="mb-4 flex items-center gap-2 rounded-full border border-white/6 bg-[#17140f] px-4 py-2 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition hover:border-white/10 xl:hidden"
            type="button"
            onClick={() => {
              setSelectedProductId(null);
              setIsCreatingProduct(false);
            }}
          >
            ← Voltar à lista
          </button>
          <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#9f9383] uppercase">
                  Editor de catálogo
                </p>
                <h2 className="mt-2 [font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f2eee8]">
                  {isCreatingProduct
                    ? "Criar produto"
                    : selectedProduct
                      ? selectedProduct.name
                      : "Selecione um produto"}
                </h2>
                <p className="mt-2 max-w-2xl [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                  Produto, mídia e preços seguem o mesmo contrato validado do
                  backend. Mudanças inválidas retornam mensagem uniforme antes
                  de persistir qualquer alteração.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isCreatingProduct && selectedProduct ? (
                  <Button
                    className="border-white/6 bg-transparent hover:bg-[#17140f]"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setProductForm(mapProductDetailToForm(selectedProduct))
                    }
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        isDetailRefreshing && "animate-spin",
                      )}
                    />
                    Recarregar rascunho
                  </Button>
                ) : null}
                {meta?.canDeleteProducts && !isCreatingProduct ? (
                  <Button
                    className="border-rose-500/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
                    disabled={!selectedProduct || isDeletingProduct}
                    type="button"
                    variant="outline"
                    onClick={handleDeleteProduct}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                ) : null}
              </div>
            </div>

            {detailErrorMessage && !isCreatingProduct ? (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-amber-50">
                {detailErrorMessage}
              </div>
            ) : null}

            {isDetailLoading && !isCreatingProduct ? (
              <div className="mt-5 h-72 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]" />
            ) : (
              <ProductForm
                form={productForm}
                onFormChange={setProductForm}
                onSubmit={handleProductSubmit}
                onReset={() => selectedProduct && setProductForm(mapProductDetailToForm(selectedProduct))}
                onProcessImages={handleProcessImages}
                isCreating={isCreatingProduct}
                isSaving={isSavingProduct}
                isDetailRefreshing={isDetailRefreshing}
                isRemovingBackground={isRemovingBackground}
                isPersistingImages={isPersistingImages}
                selectedProduct={selectedProduct}
                meta={meta}
                removeBgProgress={removeBgProgress}
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[2.8fr_1fr]">
        {/* Categories Panel */}
        <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#9f9383] uppercase">
                Categorias
              </p>
              <h2 className="mt-2 [font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f2eee8]">
                CRUD administrativo
              </h2>
            </div>
            <Button
              className="border-white/10 bg-[#17140f] hover:bg-white/15"
              disabled={!meta?.canManageCategories}
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedCategoryId(null);
                setCategoryForm(createEmptyCategoryForm());
              }}
            >
              Nova categoria
            </Button>
          </div>

          {!meta?.canManageCategories ? (
            <div className="mt-4 rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
              Admin de loja pode consultar categorias, mas a mutação global foi
              restrita a perfis administrativos centrais para evitar impacto
              cruzado entre lojas.
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <CategoryList
              categories={categoriesData?.categories ?? []}
              selectedCategoryId={selectedCategoryId}
              isLoading={isCategoriesLoading}
              canManage={meta?.canManageCategories ?? false}
              onSelectCategory={(category) => {
                setSelectedCategoryId(category.id);
                setCategoryForm(mapCategoryToForm(category));
              }}
              onNewCategory={() => {
                setSelectedCategoryId(null);
                setCategoryForm(createEmptyCategoryForm());
              }}
            />

            <CategoryForm
              form={categoryForm}
              onFormChange={setCategoryForm}
              onSubmit={handleCategorySubmit}
              onDelete={handleCategoryDelete}
              onRefresh={retryCategories}
              selectedCategoryId={selectedCategoryId}
              isSaving={isSavingCategory}
              isDeleting={isDeletingCategory}
              isRefreshing={isCategoriesRefreshing}
              canManage={meta?.canManageCategories ?? false}
              categories={categoriesData?.categories ?? []}
            />
          </div>
        </div>

        {/* Inventory History Panel */}
        <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#9f9383] uppercase">
                Histórico
              </p>
              <h2 className="mt-2 [font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f2eee8]">
                Trilha operacional
              </h2>
            </div>
          </div>

          <div className="mt-5">
            <InventoryHistory
              movements={selectedProduct?.inventoryHistory ?? []}
            />
          </div>
        </div>

        {/* Stock Editor Panel */}
        <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#9f9383] uppercase">
                Estoque
              </p>
              <h2 className="mt-2 [font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f2eee8]">
                Ajuste com trilha
              </h2>
            </div>
            <div className="rounded-full border border-[#59627a]/25 bg-[#59627a]/10 px-3 py-1 text-xs font-semibold text-[#59627a]">
              {selectedProduct
                ? `${selectedProduct.availableQuantity} disponível`
                : "Sem produto"}
            </div>
          </div>

          <div className="mt-5">
            <StockEditor
              stockForm={stockForm}
              onStockFormChange={setStockForm}
              onAdjustStock={handleStockAdjustment}
              isAdjusting={isAdjustingStock}
              selectedProduct={selectedProduct}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
