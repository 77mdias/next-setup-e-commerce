import type {
  AdminOrderStatus,
  AdminOrdersListFilters,
  AdminOrdersListResponse,
} from "@/lib/admin/orders-contract";
import { formatCurrency } from "@/helpers/format-currency";
import { cn } from "@/lib/utils";
import { Ban, CalendarDays, LoaderCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDateTime } from "./utils";
import type { AdminPaymentStatusFilter } from "@/lib/admin/orders-contract";

export type OrderTableProps = {
  filters: AdminOrdersListFilters;
  isOrdersLoading: boolean;
  isOrdersRefreshing: boolean;
  onPageChange: (page: number) => void;
  onRetryOrders: () => void;
  onSelectOrder: (orderId: number | null) => void;
  orders: AdminOrdersListResponse | null;
  ordersErrorMessage: string | null;
  selectedOrderId: number | null;
};

export function OrderTable({
  filters,
  isOrdersLoading,
  isOrdersRefreshing,
  onPageChange,
  onRetryOrders,
  onSelectOrder,
  orders,
  ordersErrorMessage,
  selectedOrderId,
}: OrderTableProps) {
  if (isOrdersLoading && orders === null) {
    return (
      <div className="space-y-3" aria-live="polite">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`orders-loading-${index}`}
            className="h-28 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]"
          />
        ))}
      </div>
    );
  }

  if (orders === null) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 text-rose-300">
        <div className="flex items-start gap-3">
          <Ban className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-3">
            <div>
              <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
                Nao foi possivel carregar a fila operacional
              </h3>
              <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-rose-300">
                {ordersErrorMessage}
              </p>
            </div>
            <Button
              className="border-white/10 bg-[#17140f] hover:bg-[#17140f]/80"
              type="button"
              variant="outline"
              onClick={onRetryOrders}
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.orders.length === 0) {
    return (
      <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/6 bg-[#17140f] text-[#59627a]">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h3 className="mt-4 [font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
          Nenhum pedido encontrado para os filtros aplicados
        </h3>
        <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
          Ajuste periodo, status ou busca textual para recuperar outra fila
          operacional.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ordersErrorMessage ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-amber-300">
          Ultima atualizacao exibida. Nova tentativa falhou:{" "}
          {ordersErrorMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {orders.orders.map((order) => (
          <button
            key={order.id}
            type="button"
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition",
              selectedOrderId === order.id
                ? "border-[#59627a]/45 bg-[#59627a]/10"
                : "border-white/6 bg-[#17140f] hover:border-white/10 hover:bg-[#1b1712]",
            )}
            onClick={() => onSelectOrder(order.id)}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/6 bg-[#11100d] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.14em] text-[#b8ad9f] uppercase">
                    {order.code}
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <OrderStatusBadge paymentStatus={order.paymentStatus} />
                </div>

                <div>
                  <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
                    {order.customerName}
                  </h3>
                  <p className="mt-1 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                    {order.store.name} · {order.itemCount} item(ns)
                    {order.itemPreview.length > 0
                      ? ` · ${order.itemPreview.join(", ")}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-1 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f] lg:text-right">
                <p className="font-semibold text-[#f2eee8]">
                  {formatCurrency(order.total)}
                </p>
                <p>{formatDateTime(order.createdAt)}</p>
                {order.trackingCode ? (
                  <p className="text-[#59627a]">
                    Tracking: {order.trackingCode}
                  </p>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-[#17140f] p-4 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[#59627a]" />
          <span>
            Pagina {orders.pagination.page} de {orders.pagination.totalPages} ·
            {` ${orders.pagination.total}`} pedido(s) no recorte atual
          </span>
          {isOrdersRefreshing ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-[#59627a]" />
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button
            disabled={!orders.pagination.hasPrev}
            type="button"
            variant="outline"
            onClick={() => onPageChange(filters.page - 1)}
          >
            Anterior
          </Button>
          <Button
            disabled={!orders.pagination.hasNext}
            type="button"
            variant="outline"
            onClick={() => onPageChange(filters.page + 1)}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  );
}
