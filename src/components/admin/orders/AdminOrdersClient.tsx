"use client";

import { startTransition, useEffect, useState } from "react";
import { toast } from "sonner";

import AdminOrdersView from "@/components/admin/orders/AdminOrdersView";
import type {
  AdminOrdersListFilters,
  AdminOrderStatus,
} from "@/lib/admin/orders-contract";
import {
  updateAdminOrderStatus,
  useAdminOrderDetail,
  useAdminOrders,
} from "@/hooks/useAdminOrders";

const DEFAULT_FILTERS: AdminOrdersListFilters = {
  limit: 12,
  page: 1,
  paymentStatus: "ALL",
  period: "30d",
  query: "",
  status: "ALL",
  storeId: null,
};

export default function AdminOrdersClient() {
  const [filters, setFilters] =
    useState<AdminOrdersListFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<AdminOrderStatus | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: ordersData,
    errorMessage: ordersErrorMessage,
    isLoading: isOrdersLoading,
    isRefreshing: isOrdersRefreshing,
    retry: retryOrders,
  } = useAdminOrders(filters);
  const {
    data: orderDetailData,
    errorMessage: detailErrorMessage,
    isLoading: isDetailLoading,
    isRefreshing: isDetailRefreshing,
    retry: retryDetail,
  } = useAdminOrderDetail(selectedOrderId);

  useEffect(() => {
    const firstOrderId = ordersData?.orders[0]?.id ?? null;

    if (!ordersData || ordersData.orders.length === 0) {
      setSelectedOrderId(null);
      return;
    }

    const hasSelectedOrder = ordersData.orders.some(
      (order) => order.id === selectedOrderId,
    );

    if (!hasSelectedOrder) {
      setSelectedOrderId(firstOrderId);
    }
  }, [ordersData, selectedOrderId]);

  useEffect(() => {
    const firstStatusOption =
      orderDetailData?.order.availableActions.statusOptions[0] ?? null;
    setPendingStatus(firstStatusOption);
  }, [orderDetailData]);

  async function handleStatusSubmit() {
    if (!selectedOrderId || !pendingStatus) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedOrder = await updateAdminOrderStatus(
        selectedOrderId,
        pendingStatus,
      );

      toast.success(
        `Pedido ${updatedOrder.order.code} atualizado com sucesso.`,
      );
      setPendingStatus(
        updatedOrder.order.availableActions.statusOptions[0] ?? null,
      );
      retryOrders();
      retryDetail();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Nao foi possivel atualizar o pedido agora.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminOrdersView
      detail={orderDetailData?.order ?? null}
      detailErrorMessage={detailErrorMessage}
      filters={filters}
      isDetailLoading={isDetailLoading}
      isDetailRefreshing={isDetailRefreshing}
      isOrdersLoading={isOrdersLoading}
      isOrdersRefreshing={isOrdersRefreshing}
      isSubmitting={isSubmitting}
      onPageChange={(page) => {
        startTransition(() => {
          setFilters((currentFilters) => ({
            ...currentFilters,
            page,
          }));
        });
      }}
      onPaymentStatusChange={(paymentStatus) => {
        startTransition(() => {
          setFilters((currentFilters) => ({
            ...currentFilters,
            page: 1,
            paymentStatus,
          }));
        });
      }}
      onPendingStatusChange={setPendingStatus}
      onPeriodChange={(period) => {
        startTransition(() => {
          setFilters((currentFilters) => ({
            ...currentFilters,
            page: 1,
            period,
          }));
        });
      }}
      onRetryDetail={retryDetail}
      onRetryOrders={retryOrders}
      onSearchChange={setSearchInput}
      onSearchReset={() => {
        setSearchInput("");

        startTransition(() => {
          setFilters((currentFilters) => ({
            ...currentFilters,
            page: 1,
            query: "",
          }));
        });
      }}
      onSearchSubmit={() => {
        startTransition(() => {
          setFilters((currentFilters) => ({
            ...currentFilters,
            page: 1,
            query: searchInput.trim(),
          }));
        });
      }}
      onSelectOrder={setSelectedOrderId}
      onStatusChange={(status) => {
        startTransition(() => {
          setFilters((currentFilters) => ({
            ...currentFilters,
            page: 1,
            status,
          }));
        });
      }}
      onSubmitStatusUpdate={handleStatusSubmit}
      orders={ordersData}
      ordersErrorMessage={ordersErrorMessage}
      pendingStatus={pendingStatus}
      searchInput={searchInput}
      selectedOrderId={selectedOrderId}
    />
  );
}
