"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AdminDashboardMetricsResponse,
  AdminDashboardWindowPreset,
} from "@/lib/admin/dashboard-metrics";

const ADMIN_DASHBOARD_FALLBACK_ERROR =
  "Nao foi possivel carregar os indicadores agora. Tente novamente em instantes.";

type UseAdminDashboardResult = {
  data: AdminDashboardMetricsResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  retry: () => void;
};

function isAdminDashboardMetricsResponse(
  payload:
    | AdminDashboardMetricsResponse
    | { error?: string; success?: boolean },
): payload is AdminDashboardMetricsResponse {
  return payload.success === true;
}

async function readAdminDashboard(
  window: AdminDashboardWindowPreset,
  signal: AbortSignal,
): Promise<AdminDashboardMetricsResponse> {
  const params = new URLSearchParams({ window });
  const response = await fetch(`/api/admin/dashboard?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  const payload = (await response.json()) as
    | AdminDashboardMetricsResponse
    | { error?: string; success?: boolean };

  if (!response.ok || !isAdminDashboardMetricsResponse(payload)) {
    throw new Error(ADMIN_DASHBOARD_FALLBACK_ERROR);
  }

  return payload;
}

export function useAdminDashboard(
  window: AdminDashboardWindowPreset,
): UseAdminDashboardResult {
  const [data, setData] = useState<AdminDashboardMetricsResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const dataRef = useRef<AdminDashboardMetricsResponse | null>(null);

  dataRef.current = data;

  const retry = useCallback(() => {
    setRetryToken((currentValue) => currentValue + 1);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    const shouldKeepCurrentData = dataRef.current !== null;

    if (shouldKeepCurrentData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    void readAdminDashboard(window, abortController.signal)
      .then((nextData) => {
        setData(nextData);
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        // AIDEV-CRITICAL: o dashboard precisa manter a ultima leitura valida
        // quando uma nova tentativa falhar para evitar tela vazia em erro parcial.
        const message =
          error instanceof Error &&
          error.message.trim().length > 0 &&
          error.message !== "Failed to fetch"
            ? error.message
            : ADMIN_DASHBOARD_FALLBACK_ERROR;

        setErrorMessage(message);

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
  }, [retryToken, window]);

  return {
    data,
    errorMessage,
    isLoading,
    isRefreshing,
    retry,
  };
}
