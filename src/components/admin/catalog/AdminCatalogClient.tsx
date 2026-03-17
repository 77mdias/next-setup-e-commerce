"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Boxes,
  History,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/helpers/format-currency";
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
import type {
  AdminCatalogCategorySummary,
  AdminCatalogProductDetail,
  AdminCatalogProductPayload,
  AdminCatalogStockAdjustmentPayload,
} from "@/lib/admin/catalog-contract";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";
import { cn } from "@/lib/utils";

type ProductFormState = {
  brandId: string;
  categoryId: string;
  costPrice: string;
  description: string;
  dimensionsText: string;
  imagesText: string;
  isActive: boolean;
  isFeatured: boolean;
  isOnSale: boolean;
  name: string;
  originalPrice: string;
  price: string;
  saleEndsAt: string;
  saleStartsAt: string;
  shortDesc: string;
  sku: string;
  specificationsText: string;
  storeId: string;
  warranty: string;
  weight: string;
};

type CategoryFormState = {
  description: string;
  isActive: boolean;
  name: string;
  parentId: string;
  slug: string;
  sortOrder: string;
};

type StockAdjustmentFormState = {
  delta: string;
  maxStock: string;
  minStock: string;
  reason: string;
  reference: string;
  targetType: "product" | "variant";
  variantId: string;
};

const DEFAULT_FILTERS: AdminCatalogProductsFilters = {
  limit: 8,
  page: 1,
  query: "",
  storeId: null,
};

const fieldClassName =
  "min-h-10 w-full rounded-2xl border border-white/10 bg-slate-950/55 px-3 py-2 text-sm text-slate-100 shadow-sm outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20";

function createEmptyProductForm(
  defaults?: Partial<Pick<ProductFormState, "brandId" | "categoryId" | "storeId">>,
): ProductFormState {
  return {
    brandId: defaults?.brandId ?? "",
    categoryId: defaults?.categoryId ?? "",
    costPrice: "",
    description: "",
    dimensionsText: "",
    imagesText: "",
    isActive: true,
    isFeatured: false,
    isOnSale: false,
    name: "",
    originalPrice: "",
    price: "",
    saleEndsAt: "",
    saleStartsAt: "",
    shortDesc: "",
    sku: "",
    specificationsText: "{\n  \n}",
    storeId: defaults?.storeId ?? "",
    warranty: "",
    weight: "",
  };
}

function createEmptyCategoryForm(): CategoryFormState {
  return {
    description: "",
    isActive: true,
    name: "",
    parentId: "",
    slug: "",
    sortOrder: "0",
  };
}

function createEmptyStockAdjustmentForm(): StockAdjustmentFormState {
  return {
    delta: "",
    maxStock: "",
    minStock: "",
    reason: "",
    reference: "",
    targetType: "product",
    variantId: "",
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalizedDate = new Date(date.getTime() - offset * 60 * 1000);

  return normalizedDate.toISOString().slice(0, 16);
}

function mapProductDetailToForm(detail: AdminCatalogProductDetail): ProductFormState {
  return {
    brandId: detail.brand.id,
    categoryId: detail.category.id,
    costPrice: detail.costPrice === null ? "" : String(detail.costPrice),
    description: detail.description,
    dimensionsText: detail.dimensions
      ? JSON.stringify(detail.dimensions, null, 2)
      : "",
    imagesText: detail.images.join("\n"),
    isActive: detail.isActive,
    isFeatured: detail.isFeatured,
    isOnSale: detail.isOnSale,
    name: detail.name,
    originalPrice:
      detail.originalPrice === null ? "" : String(detail.originalPrice),
    price: String(detail.price),
    saleEndsAt: toDateTimeLocalValue(detail.saleEndsAt),
    saleStartsAt: toDateTimeLocalValue(detail.saleStartsAt),
    shortDesc: detail.shortDesc ?? "",
    sku: detail.sku,
    specificationsText: JSON.stringify(detail.specifications, null, 2),
    storeId: detail.store.id,
    warranty: detail.warranty ?? "",
    weight: detail.weight === null ? "" : String(detail.weight),
  };
}

function mapCategoryToForm(category: AdminCatalogCategorySummary): CategoryFormState {
  return {
    description: category.description ?? "",
    isActive: category.isActive,
    name: category.name,
    parentId: category.parentId ?? "",
    slug: category.slug,
    sortOrder: String(category.sortOrder),
  };
}

function buildProductPayload(form: ProductFormState): AdminCatalogProductPayload {
  const images = form.imagesText
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const specifications = JSON.parse(form.specificationsText || "{}") as Record<
    string,
    unknown
  >;
  const dimensions =
    form.dimensionsText.trim().length > 0
      ? (JSON.parse(form.dimensionsText) as Record<string, unknown>)
      : null;

  return {
    brandId: form.brandId,
    categoryId: form.categoryId,
    costPrice:
      form.costPrice.trim().length > 0 ? Number(form.costPrice.trim()) : null,
    description: form.description,
    dimensions,
    images,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isOnSale: form.isOnSale,
    name: form.name,
    originalPrice:
      form.originalPrice.trim().length > 0
        ? Number(form.originalPrice.trim())
        : null,
    price: Number(form.price.trim()),
    saleEndsAt: form.saleEndsAt.trim().length > 0 ? form.saleEndsAt : null,
    saleStartsAt:
      form.saleStartsAt.trim().length > 0 ? form.saleStartsAt : null,
    shortDesc: form.shortDesc.trim().length > 0 ? form.shortDesc : null,
    sku: form.sku,
    specifications,
    storeId: form.storeId,
    warranty: form.warranty.trim().length > 0 ? form.warranty : null,
    weight: form.weight.trim().length > 0 ? Number(form.weight.trim()) : null,
  };
}

function buildCategoryPayload(form: CategoryFormState) {
  return {
    description: form.description.trim().length > 0 ? form.description : null,
    isActive: form.isActive,
    name: form.name,
    parentId: form.parentId.trim().length > 0 ? form.parentId : null,
    slug: form.slug.trim().length > 0 ? form.slug : null,
    sortOrder: Number(form.sortOrder.trim() || "0"),
  };
}

function buildStockPayload(form: StockAdjustmentFormState): AdminCatalogStockAdjustmentPayload {
  return {
    delta: Number(form.delta.trim()),
    maxStock:
      form.maxStock.trim().length > 0 ? Number(form.maxStock.trim()) : undefined,
    minStock:
      form.minStock.trim().length > 0 ? Number(form.minStock.trim()) : undefined,
    reason: form.reason,
    reference: form.reference.trim().length > 0 ? form.reference : null,
    targetType: form.targetType,
    variantId: form.targetType === "variant" ? form.variantId : null,
  };
}

function ProductImagePreview({
  alt,
  src,
}: {
  alt: string;
  src: string;
}) {
  const normalizedSrc = normalizeProductImageSrc(src);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <Image
        alt={alt}
        className="h-28 w-full object-cover"
        height={160}
        src={normalizedSrc}
        unoptimized={shouldUseUnoptimizedImage(normalizedSrc) || true}
        width={240}
      />
    </div>
  );
}

export default function AdminCatalogClient() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
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
  } = useAdminCatalogProductDetail(isCreatingProduct ? null : selectedProductId);
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
      categoriesData?.categories.find((category) => category.id === selectedCategoryId) ??
      null,
    [categoriesData, selectedCategoryId],
  );
  const stockTargets = useMemo(() => {
    if (!selectedProduct) {
      return [];
    }

    return [
      {
        id: "",
        label: `Produto base · ${selectedProduct.name}`,
        type: "product" as const,
      },
      ...selectedProduct.variants.map((variant) => ({
        id: variant.id,
        label: `${variant.name}: ${variant.value}`,
        type: "variant" as const,
      })),
    ];
  }, [selectedProduct]);

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

    if (
      !window.confirm(`Remover a categoria "${selectedCategory.name}"?`)
    ) {
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
    <div className="space-y-8 text-slate-100">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(96,165,250,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(2,6,23,0.92))] p-8 shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              S06-OPS-002
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Catálogo admin com mídia segura e ajuste de estoque
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Operação de catálogo unificada para manter produto, categoria,
                imagens processadas e trilha de estoque sem sair do escopo
                autorizado da loja.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Produtos visíveis
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {productsData?.total ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Categorias
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {categoriesData?.categories.length ?? 0}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Lojas no escopo
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {meta?.stores.length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Fila operacional
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Produtos por loja
                  </h2>
                </div>
                <Button
                  className="border-white/15 bg-white/10 hover:bg-white/15"
                  type="button"
                  variant="outline"
                  onClick={resetForNewProduct}
                >
                  <Plus className="h-4 w-4" />
                  Novo produto
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-11 rounded-2xl border-white/10 bg-slate-950/55 pl-9 text-slate-100"
                    placeholder="Buscar por nome ou SKU"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                </label>
                <Button
                  className="h-11 rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        page: 1,
                        query: searchInput.trim(),
                      }));
                    });
                  }}
                >
                  Buscar
                </Button>
              </div>

              {meta?.stores.length ? (
                <select
                  className={fieldClassName}
                  value={filters.storeId ?? ""}
                  onChange={(event) => {
                    startTransition(() => {
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        page: 1,
                        storeId: event.target.value || null,
                      }));
                    });
                  }}
                >
                  <option value="">Todas as lojas do escopo</option>
                  {meta.stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            <div className="mt-5 space-y-3">
              {isProductsLoading && !productsData ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`product-skeleton-${index}`}
                    className="h-28 animate-pulse rounded-[1.4rem] border border-white/8 bg-white/5"
                  />
                ))
              ) : productsData?.products.length ? (
                productsData.products.map((product) => {
                  const isSelected =
                    !isCreatingProduct && selectedProductId === product.id;

                  return (
                    <button
                      key={product.id}
                      className={cn(
                        "w-full rounded-[1.5rem] border px-4 py-4 text-left transition",
                        isSelected
                          ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_18px_45px_rgba(34,211,238,0.12)]"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8",
                      )}
                      type="button"
                      onClick={() => {
                        setIsCreatingProduct(false);
                        setSelectedProductId(product.id);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
                          {product.images[0] ? (
                            <Image
                              alt={product.name}
                              className="h-full w-full object-cover"
                              height={80}
                              src={normalizeProductImageSrc(product.images[0])}
                              unoptimized
                              width={80}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-500">
                              <Boxes className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-white">
                              {product.name}
                            </h3>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                              {product.sku}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300">
                            {product.store.name} · {product.category.name} ·{" "}
                            {product.brand.name}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
                            <span>{formatCurrency(product.price)}</span>
                            <span>Disponível: {product.availableQuantity}</span>
                            <span>Mínimo: {product.inventory.minStock}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
                  Nenhum produto encontrado para o escopo e filtros atuais.
                </div>
              )}
            </div>

            {(productsErrorMessage || categoriesErrorMessage) && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                {productsErrorMessage ?? categoriesErrorMessage}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
              <span>
                Página {productsData?.page ?? filters.page} de{" "}
                {productsData?.totalPages ?? 1}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  className="border-white/10 bg-transparent hover:bg-white/10"
                  disabled={(productsData?.page ?? filters.page) <= 1}
                  type="button"
                  variant="outline"
                  onClick={() => {
                    startTransition(() => {
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        page: Math.max(currentFilters.page - 1, 1),
                      }));
                    });
                  }}
                >
                  Anterior
                </Button>
                <Button
                  className="border-white/10 bg-transparent hover:bg-white/10"
                  disabled={
                    (productsData?.page ?? filters.page) >=
                    (productsData?.totalPages ?? 1)
                  }
                  type="button"
                  variant="outline"
                  onClick={() => {
                    startTransition(() => {
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        page: currentFilters.page + 1,
                      }));
                    });
                  }}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Categorias
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  CRUD administrativo
                </h2>
              </div>
              <Button
                className="border-white/15 bg-white/10 hover:bg-white/15"
                disabled={!meta?.canManageCategories}
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedCategoryId(null);
                  setCategoryForm(createEmptyCategoryForm());
                }}
              >
                <Plus className="h-4 w-4" />
                Nova categoria
              </Button>
            </div>

            {!meta?.canManageCategories ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Admin de loja pode consultar categorias, mas a mutação global foi
                restrita a perfis administrativos centrais para evitar impacto
                cruzado entre lojas.
              </div>
            ) : null}

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-2">
                {isCategoriesLoading && !categoriesData ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`category-skeleton-${index}`}
                      className="h-16 animate-pulse rounded-2xl border border-white/8 bg-white/5"
                    />
                  ))
                ) : (
                  categoriesData?.categories.map((category) => (
                    <button
                      key={category.id}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition",
                        selectedCategoryId === category.id
                          ? "border-cyan-400/40 bg-cyan-400/10"
                          : "border-white/10 bg-white/5 hover:bg-white/8",
                      )}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(category.id);
                        setCategoryForm(mapCategoryToForm(category));
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{category.name}</p>
                          <p className="text-xs text-slate-400">{category.slug}</p>
                        </div>
                        <div className="text-right text-xs text-slate-300">
                          <p>{category.productCount} produto(s)</p>
                          <p>{category.childrenCount} filho(s)</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Nome
                    </label>
                    <Input
                      className={fieldClassName}
                      disabled={!meta?.canManageCategories}
                      value={categoryForm.name}
                      onChange={(event) =>
                        setCategoryForm((currentValue) => ({
                          ...currentValue,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Slug
                    </label>
                    <Input
                      className={fieldClassName}
                      disabled={!meta?.canManageCategories}
                      value={categoryForm.slug}
                      onChange={(event) =>
                        setCategoryForm((currentValue) => ({
                          ...currentValue,
                          slug: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Ordem
                    </label>
                    <Input
                      className={fieldClassName}
                      disabled={!meta?.canManageCategories}
                      value={categoryForm.sortOrder}
                      onChange={(event) =>
                        setCategoryForm((currentValue) => ({
                          ...currentValue,
                          sortOrder: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Categoria pai
                    </label>
                    <select
                      className={fieldClassName}
                      disabled={!meta?.canManageCategories}
                      value={categoryForm.parentId}
                      onChange={(event) =>
                        setCategoryForm((currentValue) => ({
                          ...currentValue,
                          parentId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Sem categoria pai</option>
                      {categoriesData?.categories
                        .filter((category) => category.id !== selectedCategoryId)
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    checked={categoryForm.isActive}
                    className="h-4 w-4 rounded border-white/20 bg-slate-950/70"
                    disabled={!meta?.canManageCategories}
                    type="checkbox"
                    onChange={(event) =>
                      setCategoryForm((currentValue) => ({
                        ...currentValue,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Categoria ativa
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Descrição
                  </label>
                  <textarea
                    className={cn(fieldClassName, "min-h-28 resize-y")}
                    disabled={!meta?.canManageCategories}
                    value={categoryForm.description}
                    onChange={(event) =>
                      setCategoryForm((currentValue) => ({
                        ...currentValue,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    disabled={!meta?.canManageCategories || isSavingCategory}
                    type="button"
                    onClick={handleCategorySubmit}
                  >
                    {isSavingCategory ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salvar categoria
                  </Button>
                  <Button
                    className="border-white/10 bg-transparent hover:bg-white/10"
                    disabled={!selectedCategoryId || isDeletingCategory}
                    type="button"
                    variant="outline"
                    onClick={handleCategoryDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                  <Button
                    className="border-white/10 bg-transparent hover:bg-white/10"
                    type="button"
                    variant="outline"
                    onClick={retryCategories}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        isCategoriesRefreshing && "animate-spin",
                      )}
                    />
                    Atualizar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Editor de catálogo
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {isCreatingProduct
                    ? "Criar produto"
                    : selectedProduct
                      ? selectedProduct.name
                      : "Selecione um produto"}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  Produto, mídia e preços seguem o mesmo contrato validado do
                  backend. Mudanças inválidas retornam mensagem uniforme antes de
                  persistir qualquer alteração.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isCreatingProduct && selectedProduct ? (
                  <Button
                    className="border-white/10 bg-transparent hover:bg-white/10"
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
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                {detailErrorMessage}
              </div>
            ) : null}

            {isDetailLoading && !isCreatingProduct ? (
              <div className="mt-6 h-72 animate-pulse rounded-[1.6rem] border border-white/8 bg-white/5" />
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Nome
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.name}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      SKU
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.sku}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          sku: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Loja
                    </label>
                    <select
                      className={fieldClassName}
                      disabled={!isCreatingProduct}
                      value={productForm.storeId}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          storeId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione a loja</option>
                      {meta?.stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Marca
                    </label>
                    <select
                      className={fieldClassName}
                      value={productForm.brandId}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          brandId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione a marca</option>
                      {meta?.brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Categoria
                    </label>
                    <select
                      className={fieldClassName}
                      value={productForm.categoryId}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          categoryId: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione a categoria</option>
                      {meta?.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Preço
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.price}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          price: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Preço original
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.originalPrice}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          originalPrice: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Custo
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.costPrice}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          costPrice: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Peso
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.weight}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          weight: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Descrição curta
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.shortDesc}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          shortDesc: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Garantia
                    </label>
                    <Input
                      className={fieldClassName}
                      value={productForm.warranty}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          warranty: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                    Descrição
                  </label>
                  <textarea
                    className={cn(fieldClassName, "min-h-32 resize-y")}
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((currentValue) => ({
                        ...currentValue,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Especificações JSON
                    </label>
                    <textarea
                      className={cn(fieldClassName, "min-h-48 resize-y font-mono")}
                      value={productForm.specificationsText}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          specificationsText: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Dimensões JSON
                    </label>
                    <textarea
                      className={cn(fieldClassName, "min-h-48 resize-y font-mono")}
                      value={productForm.dimensionsText}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          dimensionsText: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                    <input
                      checked={productForm.isActive}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950/70"
                      type="checkbox"
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          isActive: event.target.checked,
                        }))
                      }
                    />
                    Produto ativo
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                    <input
                      checked={productForm.isFeatured}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950/70"
                      type="checkbox"
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          isFeatured: event.target.checked,
                        }))
                      }
                    />
                    Destaque
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100">
                    <input
                      checked={productForm.isOnSale}
                      className="h-4 w-4 rounded border-white/20 bg-slate-950/70"
                      type="checkbox"
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          isOnSale: event.target.checked,
                        }))
                      }
                    />
                    Em promoção
                  </label>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Promoção a partir de
                    </label>
                    <Input
                      className={fieldClassName}
                      type="datetime-local"
                      value={productForm.saleStartsAt}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          saleStartsAt: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Promoção até
                    </label>
                    <Input
                      className={fieldClassName}
                      type="datetime-local"
                      value={productForm.saleEndsAt}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          saleEndsAt: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Imagens
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        Lista validada e processamento seguro
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="border-white/10 bg-transparent hover:bg-white/10"
                        disabled={
                          isCreatingProduct ||
                          !selectedProduct ||
                          selectedProduct.images.length === 0 ||
                          isRemovingBackground ||
                          isPersistingImages
                        }
                        type="button"
                        variant="outline"
                        onClick={handleProcessImages}
                      >
                        {isRemovingBackground || isPersistingImages ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Processar com Remove.bg
                      </Button>
                      <Button
                        asChild
                        className="border-white/10 bg-transparent hover:bg-white/10"
                        type="button"
                        variant="outline"
                      >
                        <Link href="/admin/remove-bg">
                          <ImagePlus className="h-4 w-4" />
                          Abrir laboratório dedicado
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {isRemovingBackground ? (
                    <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
                      Processando imagens com Remove.bg...{" "}
                      {Math.round(removeBgProgress)}%
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Uma imagem por linha
                    </label>
                    <textarea
                      className={cn(fieldClassName, "min-h-32 resize-y font-mono")}
                      value={productForm.imagesText}
                      onChange={(event) =>
                        setProductForm((currentValue) => ({
                          ...currentValue,
                          imagesText: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {productForm.imagesText
                      .split("\n")
                      .map((value) => value.trim())
                      .filter((value) => value.length > 0)
                      .slice(0, 8)
                      .map((image, index) => (
                        <ProductImagePreview
                          key={`${image}-${index}`}
                          alt={`Preview ${index + 1}`}
                          src={image}
                        />
                      ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                    disabled={isSavingProduct}
                    type="button"
                    onClick={handleProductSubmit}
                  >
                    {isSavingProduct ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isCreatingProduct ? "Criar produto" : "Salvar produto"}
                  </Button>
                  {!isCreatingProduct && selectedProduct ? (
                    <Button
                      className="border-white/10 bg-transparent hover:bg-white/10"
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setProductForm(mapProductDetailToForm(selectedProduct))
                      }
                    >
                      Restaurar último estado salvo
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Estoque
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Ajuste com trilha
                  </h2>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                  {selectedProduct
                    ? `${selectedProduct.availableQuantity} disponível`
                    : "Sem produto"}
                </div>
              </div>

              {selectedProduct ? (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Quantidade
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {selectedProduct.inventory.quantity}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Reservado
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {selectedProduct.inventory.reserved}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                        Estoque mínimo
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {selectedProduct.inventory.minStock}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                        Alvo do ajuste
                      </label>
                      <select
                        className={fieldClassName}
                        value={
                          stockForm.targetType === "variant"
                            ? stockForm.variantId
                            : ""
                        }
                        onChange={(event) =>
                          setStockForm((currentValue) => ({
                            ...currentValue,
                            targetType: event.target.value ? "variant" : "product",
                            variantId: event.target.value,
                          }))
                        }
                      >
                        {stockTargets.map((target) => (
                          <option key={`${target.type}-${target.id}`} value={target.id}>
                            {target.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                        Delta
                      </label>
                      <Input
                        className={fieldClassName}
                        placeholder="Ex.: 5 ou -3"
                        value={stockForm.delta}
                        onChange={(event) =>
                          setStockForm((currentValue) => ({
                            ...currentValue,
                            delta: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                        Estoque mínimo alvo
                      </label>
                      <Input
                        className={fieldClassName}
                        value={stockForm.minStock}
                        onChange={(event) =>
                          setStockForm((currentValue) => ({
                            ...currentValue,
                            minStock: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                        Estoque máximo alvo
                      </label>
                      <Input
                        className={fieldClassName}
                        value={stockForm.maxStock}
                        onChange={(event) =>
                          setStockForm((currentValue) => ({
                            ...currentValue,
                            maxStock: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Motivo
                    </label>
                    <Input
                      className={fieldClassName}
                      value={stockForm.reason}
                      onChange={(event) =>
                        setStockForm((currentValue) => ({
                          ...currentValue,
                          reason: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400">
                      Referência
                    </label>
                    <Input
                      className={fieldClassName}
                      value={stockForm.reference}
                      onChange={(event) =>
                        setStockForm((currentValue) => ({
                          ...currentValue,
                          reference: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <Button
                    className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                    disabled={isAdjustingStock}
                    type="button"
                    onClick={handleStockAdjustment}
                  >
                    {isAdjustingStock ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Warehouse className="h-4 w-4" />
                    )}
                    Registrar ajuste
                  </Button>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
                  Selecione um produto para ajustar estoque.
                </div>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Histórico
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    Trilha operacional
                  </h2>
                </div>
                <History className="h-5 w-5 text-slate-400" />
              </div>

              <div className="mt-5 space-y-3">
                {selectedProduct?.inventoryHistory.length ? (
                  selectedProduct.inventoryHistory.map((movement) => (
                    <div
                      key={movement.id}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">
                            {movement.reason}
                          </p>
                          <p className="text-xs text-slate-400">
                            {movement.userLabel} · {formatDateTime(movement.createdAt)}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-xs text-slate-200">
                          {movement.quantity > 0 ? "+" : ""}
                          {movement.quantity}
                        </span>
                      </div>
                      {movement.reference ? (
                        <p className="mt-2 text-xs text-slate-400">
                          Referência: {movement.reference}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-8 text-center text-sm text-slate-300">
                    Nenhum ajuste registrado para este produto ainda.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
