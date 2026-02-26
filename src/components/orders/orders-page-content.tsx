"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  Search,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import { useAuth } from "@/hooks/useAuth";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";
import { cn } from "@/lib/utils";

type OrderStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "CANCELLED";

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage: string;
};

type Order = {
  id: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  items: OrderItem[];
  store: {
    id: string;
    name: string;
    slug: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type OrdersApiResponse = {
  orders: Order[];
  pagination: Pagination;
};

type StatusVisualConfig = {
  label: string;
  chipClassName: string;
  filterActiveClassName: string;
  filterIdleClassName: string;
};

const orderStatusConfig: Record<OrderStatus, StatusVisualConfig> = {
  PENDING: {
    label: "Pending",
    chipClassName:
      "border-amber-400/35 bg-amber-500/20 text-amber-300 dark:border-amber-400/35 dark:bg-amber-500/20 dark:text-amber-300",
    filterActiveClassName: "border-amber-400/40 bg-amber-500/20 text-amber-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-amber-400/40 hover:bg-amber-500/15 hover:text-amber-300",
  },
  PAYMENT_PENDING: {
    label: "Payment Pending",
    chipClassName:
      "border-orange-400/35 bg-orange-500/20 text-orange-300 dark:border-orange-400/35 dark:bg-orange-500/20 dark:text-orange-300",
    filterActiveClassName:
      "border-orange-400/40 bg-orange-500/20 text-orange-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-orange-400/40 hover:bg-orange-500/15 hover:text-orange-300",
  },
  PAID: {
    label: "Paid",
    chipClassName:
      "border-sky-400/35 bg-sky-500/20 text-sky-300 dark:border-sky-400/35 dark:bg-sky-500/20 dark:text-sky-300",
    filterActiveClassName: "border-sky-400/40 bg-sky-500/20 text-sky-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-sky-400/40 hover:bg-sky-500/15 hover:text-sky-300",
  },
  PROCESSING: {
    label: "Processing",
    chipClassName:
      "border-blue-400/35 bg-blue-500/20 text-blue-300 dark:border-blue-400/35 dark:bg-blue-500/20 dark:text-blue-300",
    filterActiveClassName: "border-blue-400/40 bg-blue-500/20 text-blue-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-blue-400/40 hover:bg-blue-500/15 hover:text-blue-300",
  },
  SHIPPED: {
    label: "In Transit",
    chipClassName:
      "border-indigo-400/35 bg-indigo-500/20 text-indigo-300 dark:border-indigo-400/35 dark:bg-indigo-500/20 dark:text-indigo-300",
    filterActiveClassName:
      "border-indigo-400/40 bg-indigo-500/20 text-indigo-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-indigo-400/40 hover:bg-indigo-500/15 hover:text-indigo-300",
  },
  DELIVERED: {
    label: "Delivered",
    chipClassName:
      "border-emerald-400/35 bg-emerald-500/20 text-emerald-300 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-300",
    filterActiveClassName:
      "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelled",
    chipClassName:
      "border-rose-400/35 bg-rose-500/20 text-rose-300 dark:border-rose-400/35 dark:bg-rose-500/20 dark:text-rose-300",
    filterActiveClassName: "border-rose-400/40 bg-rose-500/20 text-rose-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-300",
  },
  REFUNDED: {
    label: "Refunded",
    chipClassName:
      "border-slate-400/35 bg-slate-500/20 text-slate-300 dark:border-slate-400/35 dark:bg-slate-500/20 dark:text-slate-300",
    filterActiveClassName: "border-slate-400/40 bg-slate-500/20 text-slate-300",
    filterIdleClassName:
      "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-slate-400/40 hover:bg-slate-500/15 hover:text-slate-300",
  },
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Payment approved",
  FAILED: "Payment failed",
  REFUNDED: "Payment refunded",
  CANCELLED: "Payment cancelled",
};

const filterOptions: Array<{ value: "ALL" | OrderStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "In transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const deliverySteps = ["Processing", "Shipped", "In Transit", "Delivered"];

function resolveOrderVisual(status: OrderStatus): StatusVisualConfig {
  return orderStatusConfig[status] ?? orderStatusConfig.PENDING;
}

function formatOrderCode(orderId: number) {
  return `ORD-${String(orderId).padStart(5, "0")}`;
}

function formatPlacedDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDeliveryStage(status: OrderStatus) {
  switch (status) {
    case "PAID":
    case "PROCESSING":
      return 0;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1;
  }
}

function shouldRenderDeliveryProgress(status: OrderStatus) {
  return !["PENDING", "PAYMENT_PENDING", "CANCELLED", "REFUNDED"].includes(
    status,
  );
}

function getPaginationRange(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function DeliveryProgress({ status }: { status: OrderStatus }) {
  const stage = getDeliveryStage(status);
  const progress = stage < 0 ? 0 : (stage / (deliverySteps.length - 1)) * 100;

  return (
    <div className="rounded-xl border border-white/6 bg-[#12151a] p-4">
      <div className="relative h-1 rounded-full bg-[#0b0d10]">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-[#5c7cfa] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {deliverySteps.map((step, index) => {
          const isReached = stage >= index;
          const isCurrent = stage === index;

          return (
            <div key={step} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                  isReached
                    ? "border-[#5c7cfa] bg-[#5c7cfa]/20 text-[#5c7cfa]"
                    : "border-white/10 bg-[#0b0d10] text-[#6a7282]",
                )}
              >
                {isReached ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-current/70" />
                )}
              </div>

              <span
                className={cn(
                  "[font-family:var(--font-arimo)] text-[11px] leading-none text-[#6a7282]",
                  isReached && "text-[#f1f3f5]",
                  isCurrent && "text-[#5c7cfa]",
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const initialOrderQuery = searchParams.get("orderId")?.trim() ?? "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(initialOrderQuery);
  const [searchQuery, setSearchQuery] = useState(initialOrderQuery);
  const [isFetching, setIsFetching] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      return;
    }

    router.replace(
      buildAccessFeedbackPath({
        reason: "auth-required",
        callbackUrl: "/orders",
        fromPath: "/orders",
      }),
    );
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const controller = new AbortController();

    async function fetchOrders() {
      setIsFetching(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          status: statusFilter,
          page: String(currentPage),
          limit: "6",
        });

        if (searchQuery) {
          params.set("query", searchQuery);
        }

        const response = await fetch(`/api/orders/user?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.replace(
              buildAccessFeedbackPath({
                reason: "auth-required",
                callbackUrl: "/orders",
                fromPath: "/orders",
              }),
            );
            return;
          }

          throw new Error("Nao foi possivel carregar pedidos");
        }

        const data = (await response.json()) as OrdersApiResponse;
        setOrders(data.orders ?? []);
        setPagination(data.pagination ?? null);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Erro ao carregar pedidos:", requestError);
        setError("Nao foi possivel carregar pedidos. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) {
          setIsFetching(false);
        }
      }
    }

    void fetchOrders();

    return () => {
      controller.abort();
    };
  }, [
    currentPage,
    isAuthenticated,
    isLoading,
    reloadNonce,
    router,
    searchQuery,
    statusFilter,
  ]);

  const pageNumbers = useMemo(() => {
    if (!pagination?.totalPages || pagination.totalPages <= 1) {
      return [];
    }

    return getPaginationRange(currentPage, pagination.totalPages);
  }, [currentPage, pagination]);

  async function handleBuyAgain(item: OrderItem) {
    if (!item.productId) {
      toast.error("Product unavailable for this order item.");
      return;
    }

    setBuyingItemId(item.id);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add item to cart.");
      }

      toast.success("Item added to cart.");
    } catch (requestError) {
      console.error("Erro ao adicionar item no carrinho:", requestError);
      toast.error("Could not add the item to cart.");
    } finally {
      setBuyingItemId(null);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0b0d10] px-4 py-10 text-[#f1f3f5] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1536px] rounded-2xl border border-white/6 bg-[#171a21] p-8 [font-family:var(--font-arimo)] text-sm text-[#99a1af]">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-10 text-[#f1f3f5] sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-[1536px] flex-col gap-6">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <h1 className="[font-family:var(--font-space-grotesk)] text-3xl font-bold tracking-[-0.02em] text-[#f1f3f5]">
              My Orders
            </h1>
            <p className="[font-family:var(--font-arimo)] text-base text-[#6a7282]">
              Track and manage your recent purchases
            </p>
          </div>

          <label
            className="relative block w-full max-w-[256px]"
            htmlFor="orders-search"
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6a7282]" />
            <input
              id="orders-search"
              type="text"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Order ID..."
              className="h-[38px] w-full rounded-2xl border border-white/6 bg-[#12151a] pr-4 pl-10 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5] transition-colors outline-none placeholder:text-[#6a7282] focus:border-[#5c7cfa]/65"
            />
          </label>
        </header>

        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-4">
          <div className="flex flex-wrap items-center gap-2">
            {filterOptions.map((option) => {
              const isActive = statusFilter === option.value;
              const statusVisual =
                option.value === "ALL"
                  ? {
                      active:
                        "border-[#5c7cfa]/50 bg-[#5c7cfa]/20 text-[#b9c7ff]",
                      idle: "border-white/10 bg-[#12151a] text-[#99a1af] hover:border-[#5c7cfa]/50 hover:bg-[#5c7cfa]/15 hover:text-[#b9c7ff]",
                    }
                  : {
                      active: resolveOrderVisual(option.value)
                        .filterActiveClassName,
                      idle: resolveOrderVisual(option.value)
                        .filterIdleClassName,
                    };

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "h-8 rounded-full border px-3 [font-family:var(--font-arimo)] text-xs font-medium transition-colors",
                    isActive ? statusVisual.active : statusVisual.idle,
                  )}
                >
                  {option.label}
                </Button>
              );
            })}

            <span className="ml-auto [font-family:var(--font-arimo)] text-xs text-[#6a7282]">
              {isFetching
                ? "Updating orders..."
                : `${pagination?.total ?? orders.length} total orders`}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/35 bg-rose-500/10 p-4 text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div className="space-y-2">
              <p className="[font-family:var(--font-arimo)] text-sm">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-rose-400/40 bg-transparent [font-family:var(--font-arimo)] text-xs text-rose-300 hover:bg-rose-500/15"
                onClick={() => setReloadNonce((value) => value + 1)}
              >
                Try again
              </Button>
            </div>
          </div>
        )}

        {isFetching && orders.length === 0 ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-56 animate-pulse rounded-2xl border border-white/6 bg-[#171a21]"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-white/6 bg-[#171a21] px-6 py-14 text-center">
            <SearchX className="mx-auto mb-4 h-10 w-10 text-[#6a7282]" />
            <h2 className="[font-family:var(--font-space-grotesk)] text-2xl text-[#f1f3f5]">
              No orders found
            </h2>
            <p className="mx-auto mt-2 max-w-[420px] [font-family:var(--font-arimo)] text-sm text-[#6a7282]">
              No orders matched your current filters. Explore products and place
              a new order.
            </p>
            <Button
              asChild
              className="mt-6 h-9 rounded-2xl border border-transparent bg-[#ff2e63] [font-family:var(--font-arimo)] text-sm text-white hover:bg-[#e52858]"
            >
              <Link href="/products">
                Browse products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderVisual = resolveOrderVisual(order.status);
              const paymentLabel =
                paymentStatusLabel[order.paymentStatus] ??
                paymentStatusLabel.PENDING;
              const showDeliveryProgress = shouldRenderDeliveryProgress(
                order.status,
              );

              return (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/6 bg-[#171a21] p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="[font-family:var(--font-space-grotesk)] text-[28px] leading-none font-bold text-[#f1f3f5]">
                          {formatOrderCode(order.id)}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex h-6 items-center rounded-full border px-3 [font-family:var(--font-arimo)] text-xs",
                            orderVisual.chipClassName,
                          )}
                        >
                          {orderVisual.label}
                        </span>
                      </div>

                      <p className="inline-flex items-center gap-2 [font-family:var(--font-arimo)] text-sm text-[#6a7282]">
                        <Clock3 className="h-4 w-4" />
                        Placed on {formatPlacedDate(order.createdAt)}
                      </p>

                      <p className="[font-family:var(--font-arimo)] text-xs text-[#99a1af]">
                        {paymentLabel}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="text-left sm:text-right">
                        <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.08em] text-[#6a7282] uppercase">
                          Total Amount
                        </p>
                        <p className="[font-family:var(--font-arimo)] text-[28px] leading-none font-bold text-[#f1f3f5]">
                          {formatCurrency(order.total)}
                        </p>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        className="h-9 rounded-2xl border border-white/10 bg-transparent px-3 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5] hover:bg-white/5"
                      >
                        <Link href={`/orders/${order.id}`}>
                          View Details
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {showDeliveryProgress && (
                    <div className="mt-6">
                      <DeliveryProgress status={order.status} />
                    </div>
                  )}

                  <div className="mt-6 border-t border-white/5 pt-6">
                    <p className="[font-family:var(--font-space-grotesk)] text-sm tracking-[0.05em] text-[#6a7282] uppercase">
                      Items in Order
                    </p>

                    <div className="mt-4 space-y-4">
                      {order.items.slice(0, 2).map((item) => {
                        const imageSrc = normalizeProductImageSrc(
                          item.productImage,
                          "/images/home/card-razer-node.png",
                        );

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#12151a]">
                                <Image
                                  src={imageSrc}
                                  alt={`Product image for ${item.productName}`}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  unoptimized={shouldUseUnoptimizedImage(
                                    imageSrc,
                                  )}
                                />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate [font-family:var(--font-arimo)] text-base text-[#f1f3f5]">
                                  {item.productName}
                                </p>
                                <p className="[font-family:var(--font-arimo)] text-sm text-[#6a7282]">
                                  Qty: {item.quantity} x{" "}
                                  {formatCurrency(item.unitPrice)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                              <p className="[font-family:var(--font-arimo)] text-sm font-bold text-[#f1f3f5]">
                                {formatCurrency(item.totalPrice)}
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => void handleBuyAgain(item)}
                                disabled={buyingItemId === item.id}
                                className="h-9 rounded-2xl border-0 bg-transparent px-3 [font-family:var(--font-arimo)] text-sm text-[#ff2e63] hover:bg-[#ff2e63]/10"
                              >
                                {buyingItemId === item.id
                                  ? "Adding..."
                                  : "Buy Again"}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {order.items.length > 2 && (
                      <p className="mt-4 [font-family:var(--font-arimo)] text-sm text-[#6a7282]">
                        +{order.items.length - 2} additional item(s) in this
                        order.
                      </p>
                    )}
                  </div>

                  {order.cancelReason && (
                    <div className="mt-4 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 [font-family:var(--font-arimo)] text-sm text-rose-300">
                      <strong>Cancellation reason:</strong> {order.cancelReason}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/6 bg-[#171a21] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="[font-family:var(--font-arimo)] text-sm text-[#6a7282]">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrev || isFetching}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="h-8 rounded-full border-white/10 bg-[#12151a] [font-family:var(--font-arimo)] text-xs text-[#f1f3f5] hover:bg-white/5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-8 min-w-8 rounded-full border px-2 [font-family:var(--font-arimo)] text-xs",
                    page === currentPage
                      ? "border-[#5c7cfa] bg-[#5c7cfa] text-white hover:bg-[#4f6ee5]"
                      : "border-white/10 bg-[#12151a] text-[#f1f3f5] hover:bg-white/5",
                  )}
                >
                  {page}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext || isFetching}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="h-8 rounded-full border-white/10 bg-[#12151a] [font-family:var(--font-arimo)] text-xs text-[#f1f3f5] hover:bg-white/5"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-4">
          <p className="inline-flex items-center gap-2 [font-family:var(--font-arimo)] text-sm text-[#6a7282]">
            <Package className="h-4 w-4 text-[#5c7cfa]" />
            Need more details? Open an order to view payment and customer info.
          </p>
        </div>
      </section>
    </main>
  );
}
