"use client";

import { startTransition, useState } from "react";

import AdminDashboardView from "@/components/admin/dashboard/AdminDashboardView";
import type { AdminDashboardWindowPreset } from "@/lib/admin/dashboard-metrics";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";

const DEFAULT_WINDOW: AdminDashboardWindowPreset = "7d";

export default function AdminDashboardClient() {
  const [window, setWindow] =
    useState<AdminDashboardWindowPreset>(DEFAULT_WINDOW);
  const { data, errorMessage, isLoading, isRefreshing, retry } =
    useAdminDashboard(window);
  const selectedWindow = data?.filters.window.key ?? window;

  return (
    <AdminDashboardView
      data={data}
      errorMessage={errorMessage}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      onRetry={retry}
      onWindowChange={(nextWindow) => {
        startTransition(() => {
          setWindow(nextWindow);
        });
      }}
      selectedWindow={selectedWindow}
    />
  );
}
