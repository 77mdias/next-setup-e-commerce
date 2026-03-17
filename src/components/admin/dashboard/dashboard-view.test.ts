import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import AdminDashboardView, {
  isAdminDashboardEmpty,
} from "@/components/admin/dashboard/AdminDashboardView";
import type { AdminDashboardMetricsResponse } from "@/lib/admin/dashboard-metrics";

const baseDashboardResponse: AdminDashboardMetricsResponse = {
  filters: {
    lowStockLimit: 5,
    scope: {
      appliedStoreIds: ["store-1"],
      kind: "stores",
    },
    storeId: "store-1",
    window: {
      days: 7,
      from: "2026-03-10T12:00:00.000Z",
      key: "7d",
      label: "Ultimos 7 dias",
      previousFrom: "2026-03-03T12:00:00.000Z",
      previousTo: "2026-03-10T12:00:00.000Z",
      to: "2026-03-17T12:00:00.000Z",
    },
  },
  generatedAt: "2026-03-17T12:00:00.000Z",
  kpis: {
    lowStock: {
      items: [
        {
          availableQuantity: 1,
          minStock: 5,
          productId: "product-1",
          productName: "Mouse Gamer",
          reserved: 2,
          storeId: "store-1",
          storeName: "Loja Centro",
        },
      ],
      products: 1,
    },
    orders: {
      byStatus: {
        CANCELLED: 0,
        DELIVERED: 1,
        PAID: 2,
        PAYMENT_PENDING: 0,
        PENDING: 1,
        PROCESSING: 0,
        REFUNDED: 0,
        SHIPPED: 0,
      },
      comparison: {
        absolute: 2,
        percentage: 100,
        previous: 2,
        trend: "up",
      },
      total: 4,
    },
    paymentApproval: {
      approved: 2,
      byStatus: {
        CANCELLED: 0,
        FAILED: 1,
        PAID: 2,
        PENDING: 1,
        REFUNDED: 0,
      },
      comparison: {
        absolute: 0.25,
        percentage: 50,
        previous: 0.5,
        trend: "up",
      },
      rate: 0.5,
      total: 4,
    },
    revenue: {
      comparison: {
        absolute: 500,
        percentage: 100,
        previous: 500,
        trend: "up",
      },
      currency: "BRL",
      gross: 1000,
      paidOrders: 2,
    },
  },
  success: true,
};

describe("AdminDashboardView", () => {
  it("renders loading state without dashboard data", () => {
    const html = renderToStaticMarkup(
      createElement(AdminDashboardView, {
        data: null,
        errorMessage: null,
        isLoading: true,
        isRefreshing: false,
        selectedWindow: "7d",
      }),
    );

    expect(html).toContain("Carregando indicadores operacionais do dashboard");
  });

  it("renders sanitized error state when no data is available", () => {
    const html = renderToStaticMarkup(
      createElement(AdminDashboardView, {
        data: null,
        errorMessage:
          "Nao foi possivel carregar os indicadores agora. Tente novamente em instantes.",
        isLoading: false,
        isRefreshing: false,
        selectedWindow: "7d",
      }),
    );

    expect(html).toContain("Nao foi possivel carregar os KPIs do painel");
    expect(html).toContain("Tentar novamente");
  });

  it("renders four KPI cards and low stock details for a populated dashboard", () => {
    const html = renderToStaticMarkup(
      createElement(AdminDashboardView, {
        data: baseDashboardResponse,
        errorMessage: null,
        isLoading: false,
        isRefreshing: false,
        selectedWindow: "7d",
      }),
    );

    expect(html).toContain("Pedidos");
    expect(html).toContain("Aprovacao");
    expect(html).toContain("Receita");
    expect(html).toContain("Estoque baixo");
    expect(html).toContain("Mouse Gamer");
  });

  it("flags the empty state when the response has no operational movement", () => {
    const emptyData: AdminDashboardMetricsResponse = {
      ...baseDashboardResponse,
      kpis: {
        lowStock: {
          items: [],
          products: 0,
        },
        orders: {
          ...baseDashboardResponse.kpis.orders,
          total: 0,
          byStatus: {
            CANCELLED: 0,
            DELIVERED: 0,
            PAID: 0,
            PAYMENT_PENDING: 0,
            PENDING: 0,
            PROCESSING: 0,
            REFUNDED: 0,
            SHIPPED: 0,
          },
        },
        paymentApproval: {
          ...baseDashboardResponse.kpis.paymentApproval,
          approved: 0,
          byStatus: {
            CANCELLED: 0,
            FAILED: 0,
            PAID: 0,
            PENDING: 0,
            REFUNDED: 0,
          },
          rate: 0,
          total: 0,
        },
        revenue: {
          ...baseDashboardResponse.kpis.revenue,
          gross: 0,
          paidOrders: 0,
        },
      },
    };

    expect(isAdminDashboardEmpty(emptyData)).toBe(true);

    const html = renderToStaticMarkup(
      createElement(AdminDashboardView, {
        data: emptyData,
        errorMessage: null,
        isLoading: false,
        isRefreshing: false,
        selectedWindow: "7d",
      }),
    );

    expect(html).toContain("Ainda nao existe movimentacao suficiente");
    expect(html).toContain("Sem registros na janela selecionada");
  });
});
