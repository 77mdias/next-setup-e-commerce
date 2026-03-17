"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AdminCustomersFilters,
  AdminCustomersListResponse,
} from "@/lib/admin/customers-contract";

const ADMIN_CUSTOMERS_FALLBACK_ERROR =
  "Nao foi possivel carregar a base administrativa de clientes. Tente novamente em instantes.";

type UseAdminCustomersResult = {
  data: AdminCustomersListResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

function buildCustomersQueryString(filters: AdminCustomersFilters) {
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

function isAdminCustomersListResponse(
  payload: AdminCustomersListResponse | { error?: string; success?: boolean },
): payload is AdminCustomersListResponse {
  return (
    payload.success === true &&
    "customers" in payload &&
    Array.isArray(payload.customers)
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

async function readAdminCustomers(
  filters: AdminCustomersFilters,
  signal: AbortSignal,
): Promise<AdminCustomersListResponse> {
  const response = await fetch(
    `/api/admin/customers?${buildCustomersQueryString(filters)}`,
    {
      cache: "no-store",
      signal,
    },
  );

  const payload = (await response.json()) as
    | AdminCustomersListResponse
    | { error?: string; success?: boolean };

  if (!response.ok || !isAdminCustomersListResponse(payload)) {
    throw new Error(ADMIN_CUSTOMERS_FALLBACK_ERROR);
  }

  return payload;
}

export function useAdminCustomers(
  filters: AdminCustomersFilters,
): UseAdminCustomersResult {
  const [data, setData] = useState<AdminCustomersListResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminCustomersListResponse | null>(null);

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

    void readAdminCustomers(filters, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeRequestError(error, ADMIN_CUSTOMERS_FALLBACK_ERROR),
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
