import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import AdminOrdersView from "@/components/admin/orders/AdminOrdersView";
import type {
  AdminOrderDetail,
  AdminOrdersListFilters,
  AdminOrdersListResponse,
} from "@/lib/admin/orders-contract";

const noop = vi.fn();

const baseFilters: AdminOrdersListFilters = {
  limit: 12,
  page: 1,
  paymentStatus: "ALL",
  period: "30d",
  query: "",
  status: "ALL",
  storeId: null,
};

const baseOrdersResponse: AdminOrdersListResponse = {
  filters: baseFilters,
  orders: [
    {
      code: "ORD-00153",
      createdAt: "2026-03-16T11:00:00.000Z",
      customerName: "Maria Souza",
      id: 153,
      itemCount: 2,
      itemPreview: ["Notebook Pro", "Mouse RGB"],
      paymentStatus: "PAID",
      status: "PROCESSING",
      store: {
        id: "store-1",
        name: "Loja Centro",
      },
      total: 3599.9,
      trackingCode: "BR123",
    },
  ],
  pagination: {
    hasNext: false,
    hasPrev: false,
    limit: 12,
    page: 1,
    total: 1,
    totalPages: 1,
  },
  success: true,
};

const baseOrderDetail: AdminOrderDetail = {
  address: {
    city: "Sao Paulo",
    complement: null,
    neighborhood: "Centro",
    number: "123",
    state: "SP",
    street: "Rua das Flores",
    zipCode: "01000-000",
  },
  availableActions: {
    canUpdateStatus: true,
    statusOptions: ["SHIPPED"],
  },
  cancelReason: null,
  cancelledAt: null,
  code: "ORD-00153",
  createdAt: "2026-03-16T11:00:00.000Z",
  customer: {
    emailMasked: "ma***@example.com",
    name: "Maria Souza",
    phoneMasked: "*** *** 1234",
  },
  customerName: "Maria Souza",
  deliveredAt: null,
  estimatedDelivery: "2026-03-20T12:00:00.000Z",
  history: [
    {
      actorLabel: "Operacao admin",
      createdAt: "2026-03-16T11:10:00.000Z",
      description: "Atualizacao operacional registrada pelo painel admin.",
      id: "history-1",
      isFallback: false,
      status: "PROCESSING",
    },
  ],
  id: 153,
  itemCount: 2,
  itemPreview: ["Notebook Pro", "Mouse RGB"],
  items: [
    {
      id: "item-1",
      productImage: null,
      productName: "Notebook Pro",
      quantity: 1,
      totalPrice: 3400,
      unitPrice: 3400,
    },
  ],
  notes: "Separar embalagem reforcada",
  paymentStatus: "PAID",
  payments: [
    {
      amount: 3599.9,
      failedAt: null,
      id: "payment-1",
      method: "credit_card",
      paidAt: "2026-03-16T11:05:00.000Z",
      status: "PAID",
    },
  ],
  shippedAt: null,
  shippingMethod: "STANDARD",
  status: "PROCESSING",
  store: {
    id: "store-1",
    name: "Loja Centro",
  },
  total: 3599.9,
  trackingCode: "BR123",
};

describe("AdminOrdersView", () => {
  it("renders loading state for the order list", () => {
    const html = renderToStaticMarkup(
      createElement(AdminOrdersView, {
        detail: null,
        detailErrorMessage: null,
        filters: baseFilters,
        isDetailLoading: false,
        isDetailRefreshing: false,
        isOrdersLoading: true,
        isOrdersRefreshing: false,
        isSubmitting: false,
        onPageChange: noop,
        onPaymentStatusChange: noop,
        onPendingStatusChange: noop,
        onPeriodChange: noop,
        onRetryDetail: noop,
        onRetryOrders: noop,
        onSearchChange: noop,
        onSearchReset: noop,
        onSearchSubmit: noop,
        onSelectOrder: noop,
        onStatusChange: noop,
        onSubmitStatusUpdate: noop,
        orders: null,
        ordersErrorMessage: null,
        pendingStatus: null,
        searchInput: "",
        selectedOrderId: null,
      }),
    );

    expect(html).toContain("Operacao de pedidos");
    expect(html).toContain("Nenhum pedido selecionado");
  });

  it("renders populated list and detail for the selected order", () => {
    const html = renderToStaticMarkup(
      createElement(AdminOrdersView, {
        detail: baseOrderDetail,
        detailErrorMessage: null,
        filters: baseFilters,
        isDetailLoading: false,
        isDetailRefreshing: false,
        isOrdersLoading: false,
        isOrdersRefreshing: false,
        isSubmitting: false,
        onPageChange: noop,
        onPaymentStatusChange: noop,
        onPendingStatusChange: noop,
        onPeriodChange: noop,
        onRetryDetail: noop,
        onRetryOrders: noop,
        onSearchChange: noop,
        onSearchReset: noop,
        onSearchSubmit: noop,
        onSelectOrder: noop,
        onStatusChange: noop,
        onSubmitStatusUpdate: noop,
        orders: baseOrdersResponse,
        ordersErrorMessage: null,
        pendingStatus: "SHIPPED",
        searchInput: "maria",
        selectedOrderId: 153,
      }),
    );

    expect(html).toContain("ORD-00153");
    expect(html).toContain("Maria Souza");
    expect(html).toContain("Atualizar status");
    expect(html).toContain("Historico de transicoes");
    expect(html).toContain("Loja Centro");
  });

  it("renders an empty state when no order matches the filters", () => {
    const html = renderToStaticMarkup(
      createElement(AdminOrdersView, {
        detail: null,
        detailErrorMessage: null,
        filters: baseFilters,
        isDetailLoading: false,
        isDetailRefreshing: false,
        isOrdersLoading: false,
        isOrdersRefreshing: false,
        isSubmitting: false,
        onPageChange: noop,
        onPaymentStatusChange: noop,
        onPendingStatusChange: noop,
        onPeriodChange: noop,
        onRetryDetail: noop,
        onRetryOrders: noop,
        onSearchChange: noop,
        onSearchReset: noop,
        onSearchSubmit: noop,
        onSelectOrder: noop,
        onStatusChange: noop,
        onSubmitStatusUpdate: noop,
        orders: {
          ...baseOrdersResponse,
          orders: [],
          pagination: {
            ...baseOrdersResponse.pagination,
            total: 0,
          },
        },
        ordersErrorMessage: null,
        pendingStatus: null,
        searchInput: "",
        selectedOrderId: null,
      }),
    );

    expect(html).toContain(
      "Nenhum pedido encontrado para os filtros aplicados",
    );
  });
});
