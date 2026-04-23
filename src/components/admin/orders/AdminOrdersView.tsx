import { LoaderCircle } from "lucide-react";

import type {
  AdminOrderDetail,
  AdminOrderPeriodPreset,
  AdminOrderStatus,
  AdminOrderStatusFilter,
  AdminOrdersListFilters,
  AdminOrdersListResponse,
  AdminPaymentStatusFilter,
} from "@/lib/admin/orders-contract";

import { OrderFilters } from "./OrderFilters";
import { OrderTable } from "./OrderTable";
import { OrderDetail } from "./OrderDetail";

export type AdminOrdersViewProps = {
  detail: AdminOrderDetail | null;
  detailErrorMessage: string | null;
  filters: AdminOrdersListFilters;
  isDetailLoading: boolean;
  isDetailRefreshing: boolean;
  isOrdersLoading: boolean;
  isOrdersRefreshing: boolean;
  isSubmitting: boolean;
  onPageChange: (page: number) => void;
  onPaymentStatusChange: (value: AdminPaymentStatusFilter) => void;
  onPendingStatusChange: (value: AdminOrderStatus | null) => void;
  onPeriodChange: (value: AdminOrderPeriodPreset) => void;
  onRetryDetail: () => void;
  onRetryOrders: () => void;
  onSearchChange: (value: string) => void;
  onSearchReset: () => void;
  onSearchSubmit: () => void;
  onSelectOrder: (orderId: number | null) => void;
  onStatusChange: (value: AdminOrderStatusFilter) => void;
  onSubmitStatusUpdate: () => void;
  orders: AdminOrdersListResponse | null;
  ordersErrorMessage: string | null;
  pendingStatus: AdminOrderStatus | null;
  searchInput: string;
  selectedOrderId: number | null;
};

export default function AdminOrdersView({
  detail,
  detailErrorMessage,
  filters,
  isDetailLoading,
  isDetailRefreshing,
  isOrdersLoading,
  isOrdersRefreshing,
  isSubmitting,
  onPageChange,
  onPaymentStatusChange,
  onPendingStatusChange,
  onPeriodChange,
  onRetryDetail,
  onRetryOrders,
  onSearchChange,
  onSearchReset,
  onSearchSubmit,
  onSelectOrder,
  onStatusChange,
  onSubmitStatusUpdate,
  orders,
  ordersErrorMessage,
  pendingStatus,
  searchInput,
  selectedOrderId,
}: AdminOrdersViewProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="[font-family:var(--font-arimo)] text-sm text-[#9f9383]">
            {orders?.pagination.total ?? 0} pedido(s) no recorte atual
          </p>
          {isOrdersRefreshing || isDetailRefreshing ? (
            <span className="inline-flex items-center gap-2 [font-family:var(--font-arimo)] text-xs text-[#59627a]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Atualizando
            </span>
          ) : null}
        </div>

        <OrderFilters
          filters={filters}
          searchInput={searchInput}
          onPaymentStatusChange={onPaymentStatusChange}
          onPeriodChange={onPeriodChange}
          onSearchChange={onSearchChange}
          onSearchReset={onSearchReset}
          onSearchSubmit={onSearchSubmit}
          onStatusChange={onStatusChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section
          className={`rounded-2xl border border-white/6 bg-[#1b1712] p-5 ${selectedOrderId !== null ? "hidden xl:block" : "block"}`}
        >
          <OrderTable
            filters={filters}
            isOrdersLoading={isOrdersLoading}
            isOrdersRefreshing={isOrdersRefreshing}
            onPageChange={onPageChange}
            onRetryOrders={onRetryOrders}
            onSelectOrder={onSelectOrder}
            orders={orders}
            ordersErrorMessage={ordersErrorMessage}
            selectedOrderId={selectedOrderId}
          />
        </section>

        <div className={selectedOrderId !== null ? "block" : "hidden xl:block"}>
          <button
            className="mb-4 flex items-center gap-2 rounded-full border border-white/6 bg-[#17140f] px-4 py-2 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition hover:border-white/10 xl:hidden"
            type="button"
            onClick={() => onSelectOrder(null)}
          >
            ← Voltar à lista
          </button>
          <OrderDetail
            detail={detail}
            detailErrorMessage={detailErrorMessage}
            isDetailLoading={isDetailLoading}
            isDetailRefreshing={isDetailRefreshing}
            isSubmitting={isSubmitting}
            onPendingStatusChange={onPendingStatusChange}
            onRetryDetail={onRetryDetail}
            onSubmitStatusUpdate={onSubmitStatusUpdate}
            pendingStatus={pendingStatus}
            selectedOrderId={selectedOrderId}
          />
        </div>
      </div>
    </section>
  );
}
