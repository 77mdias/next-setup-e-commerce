"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AdminCatalogCategoryListResponse,
  AdminCatalogCategoryMutationResponse,
  AdminCatalogCategoryPayload,
  AdminCatalogProductDetailResponse,
  AdminCatalogProductMutationResponse,
  AdminCatalogProductsResponse,
  AdminCatalogProductPayload,
  AdminCatalogStockAdjustmentPayload,
  AdminCatalogValidationErrorResponse,
} from "@/lib/admin/catalog-contract";

const ADMIN_CATALOG_PRODUCTS_FALLBACK_ERROR =
  "Nao foi possivel carregar o catalogo administrativo agora.";
const ADMIN_CATALOG_DETAIL_FALLBACK_ERROR =
  "Nao foi possivel carregar o detalhe do produto agora.";
const ADMIN_CATALOG_CATEGORIES_FALLBACK_ERROR =
  "Nao foi possivel carregar as categorias administrativas agora.";

export type AdminCatalogProductsFilters = {
  page: number;
  limit: number;
  query: string;
  storeId: string | null;
};

type UseFetchState<T> = {
  data: T | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

function buildProductsQueryString(filters: AdminCatalogProductsFilters) {
  const searchParams = new URLSearchParams({
    limit: String(filters.limit),
    page: String(filters.page),
  });

  if (filters.query.trim().length > 0) {
    searchParams.set("query", filters.query.trim());
  }

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  return searchParams.toString();
}

function normalizeErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof Error &&
    error.message.trim().length > 0 &&
    error.message !== "Failed to fetch"
    ? error.message
    : fallbackMessage;
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractValidationErrorMessage(
  payload: unknown,
  fallbackMessage: string,
) {
  if (!payload) {
    return fallbackMessage;
  }

  if (
    typeof payload === "object" &&
    "issues" in payload &&
    Array.isArray(payload.issues) &&
    payload.issues.length > 0
  ) {
    return payload.issues
      .map((issue) =>
        typeof issue === "object" && issue && "message" in issue
          ? String(issue.message)
          : "",
      )
      .filter((message) => message.length > 0)
      .join(" ");
  }

  if (
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim().length > 0
  ) {
    return payload.error;
  }

  return fallbackMessage;
}

async function readAdminCatalogProducts(
  filters: AdminCatalogProductsFilters,
  signal: AbortSignal,
): Promise<AdminCatalogProductsResponse> {
  const response = await fetch(
    `/api/admin/products?${buildProductsQueryString(filters)}`,
    {
      cache: "no-store",
      signal,
    },
  );
  const payload = await readJson<
    | AdminCatalogProductsResponse
    | AdminCatalogValidationErrorResponse
    | { error?: string }
  >(response);

  if (
    !response.ok ||
    !payload ||
    !("success" in payload) ||
    payload.success !== true
  ) {
    throw new Error(
      extractValidationErrorMessage(
        payload,
        ADMIN_CATALOG_PRODUCTS_FALLBACK_ERROR,
      ),
    );
  }

  return payload;
}

async function readAdminCatalogProductDetail(
  productId: string,
  signal: AbortSignal,
): Promise<AdminCatalogProductDetailResponse> {
  const response = await fetch(`/api/admin/products/${productId}`, {
    cache: "no-store",
    signal,
  });
  const payload = await readJson<
    | AdminCatalogProductDetailResponse
    | AdminCatalogValidationErrorResponse
    | { error?: string }
  >(response);

  if (
    !response.ok ||
    !payload ||
    !("success" in payload) ||
    payload.success !== true
  ) {
    throw new Error(
      extractValidationErrorMessage(
        payload,
        ADMIN_CATALOG_DETAIL_FALLBACK_ERROR,
      ),
    );
  }

  return payload;
}

async function readAdminCatalogCategories(
  signal: AbortSignal,
): Promise<AdminCatalogCategoryListResponse> {
  const response = await fetch("/api/admin/categories", {
    cache: "no-store",
    signal,
  });
  const payload = await readJson<
    | AdminCatalogCategoryListResponse
    | AdminCatalogValidationErrorResponse
    | { error?: string }
  >(response);

  if (
    !response.ok ||
    !payload ||
    !("success" in payload) ||
    payload.success !== true
  ) {
    throw new Error(
      extractValidationErrorMessage(
        payload,
        ADMIN_CATALOG_CATEGORIES_FALLBACK_ERROR,
      ),
    );
  }

  return payload;
}

export function useAdminCatalogProducts(
  filters: AdminCatalogProductsFilters,
): UseFetchState<AdminCatalogProductsResponse> {
  const [data, setData] = useState<AdminCatalogProductsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminCatalogProductsResponse | null>(null);

  dataRef.current = data;

  useEffect(() => {
    const abortController = new AbortController();
    const shouldKeepCurrentData = dataRef.current !== null;

    if (shouldKeepCurrentData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    void readAdminCatalogProducts(filters, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeErrorMessage(error, ADMIN_CATALOG_PRODUCTS_FALLBACK_ERROR),
        );

        if (!shouldKeepCurrentData) {
          setData(null);
        }
      })
      .finally(() => {
        if (abortController.signal.aborted) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      abortController.abort();
    };
  }, [filters, retryToken]);

  return {
    data,
    errorMessage,
    isLoading,
    isRefreshing,
    retry: () => {
      setRetryToken((currentValue) => currentValue + 1);
    },
  };
}

export function useAdminCatalogProductDetail(
  productId: string | null,
): UseFetchState<AdminCatalogProductDetailResponse> {
  const [data, setData] = useState<AdminCatalogProductDetailResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminCatalogProductDetailResponse | null>(null);

  dataRef.current = data;

  useEffect(() => {
    if (!productId) {
      setData(null);
      setErrorMessage(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const abortController = new AbortController();
    const shouldKeepCurrentData = dataRef.current?.product.id === productId;

    if (shouldKeepCurrentData) {
      setIsRefreshing(true);
    } else {
      setData(null);
      setIsLoading(true);
    }

    setErrorMessage(null);

    void readAdminCatalogProductDetail(productId, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeErrorMessage(error, ADMIN_CATALOG_DETAIL_FALLBACK_ERROR),
        );

        if (!shouldKeepCurrentData) {
          setData(null);
        }
      })
      .finally(() => {
        if (abortController.signal.aborted) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      abortController.abort();
    };
  }, [productId, retryToken]);

  return {
    data,
    errorMessage,
    isLoading,
    isRefreshing,
    retry: () => {
      setRetryToken((currentValue) => currentValue + 1);
    },
  };
}

export function useAdminCatalogCategories(): UseFetchState<AdminCatalogCategoryListResponse> {
  const [data, setData] = useState<AdminCatalogCategoryListResponse | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminCatalogCategoryListResponse | null>(null);

  dataRef.current = data;

  useEffect(() => {
    const abortController = new AbortController();
    const shouldKeepCurrentData = dataRef.current !== null;

    if (shouldKeepCurrentData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    void readAdminCatalogCategories(abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeErrorMessage(error, ADMIN_CATALOG_CATEGORIES_FALLBACK_ERROR),
        );

        if (!shouldKeepCurrentData) {
          setData(null);
        }
      })
      .finally(() => {
        if (abortController.signal.aborted) {
          return;
        }

        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      abortController.abort();
    };
  }, [retryToken]);

  return {
    data,
    errorMessage,
    isLoading,
    isRefreshing,
    retry: () => {
      setRetryToken((currentValue) => currentValue + 1);
    },
  };
}

async function sendJsonRequest<T>(input: RequestInfo, init: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await readJson<
    T | AdminCatalogValidationErrorResponse | { error?: string }
  >(response);

  if (!response.ok || payload === null) {
    throw new Error(
      extractValidationErrorMessage(payload, "Operacao administrativa falhou."),
    );
  }

  return payload as T;
}

export async function createAdminCatalogProduct(
  payload: AdminCatalogProductPayload,
) {
  return sendJsonRequest<AdminCatalogProductMutationResponse>(
    "/api/admin/products",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export async function updateAdminCatalogProduct(
  productId: string,
  payload: AdminCatalogProductPayload,
) {
  return sendJsonRequest<AdminCatalogProductMutationResponse>(
    `/api/admin/products/${productId}`,
    {
      body: JSON.stringify(payload),
      method: "PUT",
    },
  );
}

export async function deleteAdminCatalogProduct(productId: string) {
  return sendJsonRequest<{ productId: string; success: true }>(
    `/api/admin/products/${productId}`,
    {
      method: "DELETE",
    },
  );
}

export async function updateAdminCatalogProductImages(
  productId: string,
  images: string[],
) {
  return sendJsonRequest<AdminCatalogProductMutationResponse>(
    `/api/admin/products/${productId}/images`,
    {
      body: JSON.stringify({ processedImages: images }),
      method: "PUT",
    },
  );
}

export async function adjustAdminCatalogStock(
  productId: string,
  payload: AdminCatalogStockAdjustmentPayload,
) {
  return sendJsonRequest<{
    adjustment: {
      delta: number;
      targetLabel: string;
      targetType: "product" | "variant";
    };
    inventory: {
      availableQuantity: number;
      id: string;
      maxStock: number;
      minStock: number;
      quantity: number;
      reserved: number;
    };
    movement: {
      createdAt: string;
      id: string;
      quantity: number;
      reason: string;
      reference: string | null;
      type: string;
      userLabel: string;
    };
    success: true;
  }>(`/api/admin/products/${productId}/stock`, {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export async function createAdminCatalogCategory(
  payload: AdminCatalogCategoryPayload,
) {
  return sendJsonRequest<AdminCatalogCategoryMutationResponse>(
    "/api/admin/categories",
    {
      body: JSON.stringify(payload),
      method: "POST",
    },
  );
}

export async function updateAdminCatalogCategory(
  categoryId: string,
  payload: AdminCatalogCategoryPayload,
) {
  return sendJsonRequest<AdminCatalogCategoryMutationResponse>(
    `/api/admin/categories/${categoryId}`,
    {
      body: JSON.stringify(payload),
      method: "PUT",
    },
  );
}

export async function deleteAdminCatalogCategory(categoryId: string) {
  return sendJsonRequest<{ categoryId: string; success: true }>(
    `/api/admin/categories/${categoryId}`,
    {
      method: "DELETE",
    },
  );
}
