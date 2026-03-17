"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AdminAuditFilters,
  AdminAuditListResponse,
} from "@/lib/admin/audit-contract";

const ADMIN_AUDIT_FALLBACK_ERROR =
  "Nao foi possivel carregar a trilha administrativa agora. Tente novamente em instantes.";

type UseAdminAuditResult = {
  data: AdminAuditListResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

function buildAuditQueryString(filters: AdminAuditFilters) {
  const searchParams = new URLSearchParams({
    action: filters.action,
    limit: String(filters.limit),
    page: String(filters.page),
    resource: filters.resource,
  });

  if (filters.query.trim().length > 0) {
    searchParams.set("query", filters.query.trim());
  }

  if (filters.storeId) {
    searchParams.set("storeId", filters.storeId);
  }

  return searchParams.toString();
}

function isAdminAuditListResponse(
  payload: AdminAuditListResponse | { error?: string; success?: boolean },
): payload is AdminAuditListResponse {
  return (
    payload.success === true &&
    "events" in payload &&
    Array.isArray(payload.events)
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

async function readAdminAudit(
  filters: AdminAuditFilters,
  signal: AbortSignal,
): Promise<AdminAuditListResponse> {
  const response = await fetch(
    `/api/admin/audit?${buildAuditQueryString(filters)}`,
    {
      cache: "no-store",
      signal,
    },
  );

  const payload = (await response.json()) as
    | AdminAuditListResponse
    | { error?: string; success?: boolean };

  if (!response.ok || !isAdminAuditListResponse(payload)) {
    throw new Error(ADMIN_AUDIT_FALLBACK_ERROR);
  }

  return payload;
}

export function useAdminAudit(filters: AdminAuditFilters): UseAdminAuditResult {
  const [data, setData] = useState<AdminAuditListResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminAuditListResponse | null>(null);

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

    void readAdminAudit(filters, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setErrorMessage(
          normalizeRequestError(error, ADMIN_AUDIT_FALLBACK_ERROR),
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
