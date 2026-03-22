import React from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Ban,
  CalendarDays,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import type {
  AdminOrderDetail,
  AdminOrderPeriodPreset,
  AdminOrdersListFilters,
  AdminOrdersListResponse,
  AdminOrderStatus,
  AdminOrderStatusFilter,
  AdminPaymentStatusFilter,
} from "@/lib/admin/orders-contract";
import { cn } from "@/lib/utils";

const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  CANCELLED: "Cancelado",
  DELIVERED: "Entregue",
  PAID: "Pago",
  PAYMENT_PENDING: "Pagamento pendente",
  PENDING: "Pendente",
  PROCESSING: "Em preparo",
  REFUNDED: "Reembolsado",
  SHIPPED: "Em transporte",
};

const ORDER_STATUS_TONES: Record<AdminOrderStatus, string> = {
  CANCELLED: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  DELIVERED: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  PAID: "border-sky-400/30 bg-sky-500/15 text-sky-300",
  PAYMENT_PENDING: "border-orange-400/30 bg-orange-500/15 text-orange-300",
  PENDING: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  PROCESSING: "border-blue-400/30 bg-blue-500/15 text-blue-300",
  REFUNDED: "border-white/6 bg-[#17140f] text-[#b8ad9f]",
  SHIPPED: "border-indigo-400/30 bg-indigo-500/15 text-indigo-300",
};

const PAYMENT_STATUS_LABELS: Record<
  Exclude<AdminPaymentStatusFilter, "ALL">,
  string
> = {
  CANCELLED: "Pagamento cancelado",
  FAILED: "Pagamento falhou",
  PAID: "Pagamento aprovado",
  PENDING: "Pagamento pendente",
  REFUNDED: "Pagamento reembolsado",
};

const PAYMENT_STATUS_TONES: Record<
  Exclude<AdminPaymentStatusFilter, "ALL">,
  string
> = {
  CANCELLED: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  FAILED: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  PAID: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  PENDING: "border-white/6 bg-[#17140f] text-[#b8ad9f]",
  REFUNDED: "border-[#59627a]/30 bg-[#59627a]/15 text-[#59627a]",
};

const PERIOD_OPTIONS: Array<{
  label: string;
  value: AdminOrderPeriodPreset;
}> = [
  { label: "Todos", value: "all" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
];

const STATUS_FILTER_OPTIONS: Array<{
  label: string;
  value: AdminOrderStatusFilter;
}> = [
  { label: "Todos os status", value: "ALL" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Pagamento pendente", value: "PAYMENT_PENDING" },
  { label: "Pagos", value: "PAID" },
  { label: "Em preparo", value: "PROCESSING" },
  { label: "Em transporte", value: "SHIPPED" },
  { label: "Entregues", value: "DELIVERED" },
  { label: "Cancelados", value: "CANCELLED" },
  { label: "Reembolsados", value: "REFUNDED" },
];

const PAYMENT_FILTER_OPTIONS: Array<{
  label: string;
  value: AdminPaymentStatusFilter;
}> = [
  { label: "Todos os pagamentos", value: "ALL" },
  { label: "Pendentes", value: "PENDING" },
  { label: "Aprovados", value: "PAID" },
  { label: "Falhos", value: "FAILED" },
  { label: "Reembolsados", value: "REFUNDED" },
  { label: "Cancelados", value: "CANCELLED" },
];

type AdminOrdersViewProps = {
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function getShippingMethodLabel(value: AdminOrderDetail["shippingMethod"]) {
  switch (value) {
    case "EXPRESS":
      return "Expresso";
    case "PICKUP":
      return "Retirada";
    default:
      return "Padrao";
  }
}

function OrdersListState({
  filters,
  isOrdersLoading,
  isOrdersRefreshing,
  onPageChange,
  onRetryOrders,
  onSelectOrder,
  orders,
  ordersErrorMessage,
  selectedOrderId,
}: Pick<
  AdminOrdersViewProps,
  | "filters"
  | "isOrdersLoading"
  | "isOrdersRefreshing"
  | "onPageChange"
  | "onRetryOrders"
  | "onSelectOrder"
  | "orders"
  | "ordersErrorMessage"
  | "selectedOrderId"
>) {
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
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
                      ORDER_STATUS_TONES[order.status],
                    )}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
                      PAYMENT_STATUS_TONES[order.paymentStatus],
                    )}
                  >
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </span>
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

function DetailFallback({
  title,
  description,
  tone = "default",
}: {
  description: string;
  title: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        tone === "danger"
          ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
          : "border-white/6 bg-[#1b1712] text-[#b8ad9f]",
      )}
    >
      <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
        {title}
      </h3>
      <p className="mt-3 [font-family:var(--font-arimo)] text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

function OrderDetailState({
  detail,
  detailErrorMessage,
  isDetailLoading,
  isDetailRefreshing,
  isSubmitting,
  onPendingStatusChange,
  onRetryDetail,
  onSubmitStatusUpdate,
  pendingStatus,
  selectedOrderId,
}: Pick<
  AdminOrdersViewProps,
  | "detail"
  | "detailErrorMessage"
  | "isDetailLoading"
  | "isDetailRefreshing"
  | "isSubmitting"
  | "onPendingStatusChange"
  | "onRetryDetail"
  | "onSubmitStatusUpdate"
  | "pendingStatus"
  | "selectedOrderId"
>) {
  if (!selectedOrderId) {
    return (
      <DetailFallback
        description="Selecione um pedido na fila ao lado para inspecionar historico, contato operacional e proximas acoes permitidas."
        title="Nenhum pedido selecionado"
      />
    );
  }

  if (isDetailLoading && detail === null) {
    return (
      <div className="space-y-3" aria-live="polite">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`detail-loading-${index}`}
            className="h-36 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]"
          />
        ))}
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-rose-300">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-3">
            <div>
              <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
                Nao foi possivel carregar o detalhe do pedido
              </h3>
              <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-rose-300">
                {detailErrorMessage}
              </p>
            </div>

            <Button
              className="border-white/10 bg-[#17140f] hover:bg-[#17140f]/80"
              type="button"
              variant="outline"
              onClick={onRetryDetail}
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar detalhe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {detailErrorMessage ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-amber-300">
          Ultimo detalhe exibido. Nova tentativa falhou: {detailErrorMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/6 bg-[#17140f] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.14em] text-[#b8ad9f] uppercase">
                {detail.code}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
                  ORDER_STATUS_TONES[detail.status],
                )}
              >
                {ORDER_STATUS_LABELS[detail.status]}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
                  PAYMENT_STATUS_TONES[detail.paymentStatus],
                )}
              >
                {PAYMENT_STATUS_LABELS[detail.paymentStatus]}
              </span>
            </div>

            <div>
              <h3 className="[font-family:var(--font-space-grotesk)] text-2xl font-semibold text-[#f2eee8]">
                {detail.customer.name}
              </h3>
              <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                Pedido criado em {formatDateTime(detail.createdAt)} · Loja{" "}
                {detail.store.name} · Total {formatCurrency(detail.total)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
            <div className="flex items-center gap-2 text-[#59627a]">
              <ArrowRightLeft className="h-4 w-4" />
              {isDetailRefreshing
                ? "Atualizando detalhe..."
                : "Detalhe carregado"}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
            <CreditCard className="h-4 w-4 text-[#59627a]" />
            Contato e pagamento
          </div>

          <div className="mt-4 grid gap-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Contato operacional
              </p>
              <p className="mt-2">{detail.customer.name}</p>
              <p className="text-[#b8ad9f]">
                {detail.customer.emailMasked ?? "Email nao informado"}
              </p>
              <p className="text-[#b8ad9f]">
                {detail.customer.phoneMasked ?? "Telefone nao informado"}
              </p>
            </div>

            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Pagamentos registrados
              </p>
              <div className="mt-3 space-y-3">
                {detail.payments.length > 0 ? (
                  detail.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-white/6 bg-[#11100d] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            PAYMENT_STATUS_TONES[payment.status],
                          )}
                        >
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </span>
                        <span>{formatCurrency(payment.amount)}</span>
                      </div>
                      <p className="mt-2 text-[#b8ad9f]">
                        Metodo: {payment.method}
                      </p>
                      <p className="text-[#9f9383]">
                        Pago em {formatDate(payment.paidAt)} · Falha em{" "}
                        {formatDate(payment.failedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#b8ad9f]">
                    Nenhum pagamento associado foi registrado para este pedido.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
            <Truck className="h-4 w-4 text-[#59627a]" />
            Fulfillment
          </div>

          <div className="mt-4 grid gap-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Metodo e tracking
              </p>
              <p className="mt-2">
                {getShippingMethodLabel(detail.shippingMethod)} · Tracking{" "}
                {detail.trackingCode ?? "nao informado"}
              </p>
              <p className="text-[#b8ad9f]">
                Estimativa {formatDate(detail.estimatedDelivery)} · Envio{" "}
                {formatDate(detail.shippedAt)} · Entrega{" "}
                {formatDate(detail.deliveredAt)}
              </p>
            </div>

            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Endereco operacional
              </p>
              {detail.address ? (
                <div className="mt-3 space-y-1 text-[#f2eee8]">
                  <p>
                    {detail.address.street}, {detail.address.number}
                    {detail.address.complement
                      ? ` · ${detail.address.complement}`
                      : ""}
                  </p>
                  <p>
                    {detail.address.neighborhood} · {detail.address.city} -{" "}
                    {detail.address.state}
                  </p>
                  <p>CEP {detail.address.zipCode}</p>
                </div>
              ) : (
                <p className="mt-3 text-[#b8ad9f]">
                  Nenhum endereco de entrega vinculado a este pedido.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
            <Package className="h-4 w-4 text-[#59627a]" />
            Itens do pedido
          </div>

          <div className="mt-4 space-y-3">
            {detail.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/6 bg-[#17140f] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="[font-family:var(--font-arimo)] font-semibold text-[#f2eee8]">
                      {item.productName}
                    </p>
                    <p className="mt-1 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
            <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
              <ArrowRightLeft className="h-4 w-4 text-[#59627a]" />
              Acao operacional
            </div>

            {detail.availableActions.canUpdateStatus ? (
              <div className="mt-4 space-y-4">
                <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                  Atualize apenas status internos permitidos pelo fluxo atual do
                  pedido. A validacao real continua sendo feita no backend com
                  RBAC e escopo por loja.
                </p>

                <label className="block space-y-2">
                  <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                    Proximo status
                  </span>
                  <select
                    className="w-full rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition outline-none focus:border-[#59627a]/60"
                    value={pendingStatus ?? ""}
                    onChange={(event) =>
                      onPendingStatusChange(
                        event.target.value
                          ? (event.target.value as AdminOrderStatus)
                          : null,
                      )
                    }
                  >
                    {detail.availableActions.statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  disabled={!pendingStatus || isSubmitting}
                  type="button"
                  onClick={onSubmitStatusUpdate}
                >
                  {isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  Atualizar status
                </Button>
              </div>
            ) : (
              <p className="mt-4 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                Nenhuma acao operacional adicional esta liberada para o status
                atual deste pedido.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
            <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
              <MapPin className="h-4 w-4 text-[#59627a]" />
              Historico de transicoes
            </div>

            <div className="mt-4 space-y-3">
              {detail.history.map((historyEntry) => (
                <div
                  key={historyEntry.id}
                  className="rounded-xl border border-white/6 bg-[#17140f] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
                        ORDER_STATUS_TONES[historyEntry.status],
                      )}
                    >
                      {ORDER_STATUS_LABELS[historyEntry.status]}
                    </span>
                    <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.14em] text-[#9f9383] uppercase">
                      {historyEntry.actorLabel}
                    </span>
                  </div>
                  <p className="mt-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
                    {historyEntry.description ??
                      "Atualizacao registrada sem observacao adicional."}
                  </p>
                  <p className="mt-2 [font-family:var(--font-arimo)] text-xs text-[#9f9383]">
                    {formatDateTime(historyEntry.createdAt)}
                    {historyEntry.isFallback ? " · fallback historico" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

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

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.35fr))]">
          <label className="space-y-2">
            <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
              Busca textual
            </span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#9f9383]" />
                <input
                  className="w-full rounded-2xl border border-white/6 bg-[#17140f] py-3 pr-4 pl-11 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition outline-none placeholder:text-[#9f9383] focus:border-[#59627a]/60"
                  placeholder="Pedido, cliente, loja ou tracking"
                  value={searchInput}
                  onChange={(event) => onSearchChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSearchSubmit();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={onSearchSubmit}>
                Buscar
              </Button>
              <Button type="button" variant="outline" onClick={onSearchReset}>
                Limpar
              </Button>
            </div>
          </label>

          <label className="space-y-2">
            <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
              Status
            </span>
            <select
              className="w-full rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition outline-none focus:border-[#59627a]/60"
              value={filters.status}
              onChange={(event) =>
                onStatusChange(event.target.value as AdminOrderStatusFilter)
              }
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
              Pagamento
            </span>
            <select
              className="w-full rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition outline-none focus:border-[#59627a]/60"
              value={filters.paymentStatus}
              onChange={(event) =>
                onPaymentStatusChange(
                  event.target.value as AdminPaymentStatusFilter,
                )
              }
            >
              {PAYMENT_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
              Periodo
            </span>
            <select
              className="w-full rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition outline-none focus:border-[#59627a]/60"
              value={filters.period}
              onChange={(event) =>
                onPeriodChange(event.target.value as AdminOrderPeriodPreset)
              }
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section
          className={`rounded-2xl border border-white/6 bg-[#1b1712] p-5 ${selectedOrderId !== null ? "hidden xl:block" : "block"}`}
        >
          <OrdersListState
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
          <OrderDetailState
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
