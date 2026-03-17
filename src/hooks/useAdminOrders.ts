"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AdminOrderDetailResponse,
  AdminOrdersListFilters,
  AdminOrdersListResponse,
  AdminOrderStatus,
} from "@/lib/admin/orders-contract";

const ADMIN_ORDERS_LIST_FALLBACK_ERROR =
  "Nao foi possivel carregar a fila administrativa de pedidos. Tente novamente em instantes.";
const ADMIN_ORDER_DETAIL_FALLBACK_ERROR =
  "Nao foi possivel carregar o detalhe do pedido agora. Tente novamente em instantes.";

type UseAdminOrdersResult = {
  data: AdminOrdersListResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

type UseAdminOrderDetailResult = {
  data: AdminOrderDetailResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

function buildOrdersQueryString(filters: AdminOrdersListFilters) {
  const searchParams = new URLSearchParams({
    limit: String(filters.limit),
    page: String(filters.page),
    paymentStatus: filters.paymentStatus,
    period: filters.period,
    status: filters.status,
  });

  if (filters.query.trim().length > 0) {
    searchParams.set("query", filters.query.trim());
  }

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  return searchParams.toString();
}

function isAdminOrdersListResponse(
  payload:
    | AdminOrdersListResponse
    | AdminOrderDetailResponse
    | { error?: string; success?: boolean },
): payload is AdminOrdersListResponse {
  return (
    payload.success === true &&
    "orders" in payload &&
    Array.isArray(payload.orders)
  );
}

function isAdminOrderDetailResponse(
  payload:
    | AdminOrderDetailResponse
    | AdminOrdersListResponse
    | { error?: string; success?: boolean },
): payload is AdminOrderDetailResponse {
  return (
    payload.success === true &&
    "order" in payload &&
    typeof payload.order?.id === "number"
  );
}

function normalizeRequestError(
  error: unknown,
  fallbackMessage: string,
): string {
  return error instanceof Error &&
    error.message.trim().length > 0 &&
    error.message !== "Failed to fetch"
    ? error.message
    : fallbackMessage;
}

async function readAdminOrders(
  filters: AdminOrdersListFilters,
  signal: AbortSignal,
): Promise<AdminOrdersListResponse> {
  const response = await fetch(
    `/api/admin/orders?${buildOrdersQueryString(filters)}`,
    {
      cache: "no-store",
      signal,
    },
  );

  const payload = (await response.json()) as
    | AdminOrdersListResponse
    | { error?: string; success?: boolean };

  if (!response.ok || !isAdminOrdersListResponse(payload)) {
    throw new Error(ADMIN_ORDERS_LIST_FALLBACK_ERROR);
  }

  return payload;
}

async function readAdminOrderDetail(
  orderId: number,
  signal: AbortSignal,
): Promise<AdminOrderDetailResponse> {
  const response = await fetch(`/api/admin/orders/${orderId}`, {
    cache: "no-store",
    signal,
  });

  const payload = (await response.json()) as
    | AdminOrderDetailResponse
    | { error?: string; success?: boolean };

  if (!response.ok || !isAdminOrderDetailResponse(payload)) {
    throw new Error(ADMIN_ORDER_DETAIL_FALLBACK_ERROR);
  }

  return payload;
}

export async function updateAdminOrderStatus(
  orderId: number,
  nextStatus: AdminOrderStatus,
): Promise<AdminOrderDetailResponse> {
  const response = await fetch(`/api/admin/orders/${orderId}`, {
    body: JSON.stringify({
      nextStatus,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "PATCH",
  });

  const payload = (await response.json()) as
    | AdminOrderDetailResponse
    | { code?: string; error?: string; success?: boolean };

  if (!response.ok || !isAdminOrderDetailResponse(payload)) {
    throw new Error(
      "error" in payload &&
        typeof payload.error === "string" &&
        payload.error.trim().length > 0
        ? payload.error
        : "Nao foi possivel atualizar o status do pedido.",
    );
  }

  return payload;
}

export function useAdminOrders(
  filters: AdminOrdersListFilters,
): UseAdminOrdersResult {
  const [data, setData] = useState<AdminOrdersListResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminOrdersListResponse | null>(null);

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

    void readAdminOrders(filters, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeRequestError(error, ADMIN_ORDERS_LIST_FALLBACK_ERROR),
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

export function useAdminOrderDetail(
  orderId: number | null,
): UseAdminOrderDetailResult {
  const [data, setData] = useState<AdminOrderDetailResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminOrderDetailResponse | null>(null);

  dataRef.current = data;

  useEffect(() => {
    if (!orderId) {
      setData(null);
      setErrorMessage(null);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    const abortController = new AbortController();
    const shouldKeepCurrentData = dataRef.current?.order.id === orderId;

    if (shouldKeepCurrentData) {
      setIsRefreshing(true);
    } else {
      setData(null);
      setIsLoading(true);
    }

    setErrorMessage(null);

    void readAdminOrderDetail(orderId, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeRequestError(error, ADMIN_ORDER_DETAIL_FALLBACK_ERROR),
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
  }, [orderId, retryToken]);

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
