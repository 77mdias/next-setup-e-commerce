export const ADMIN_ORDER_STATUS_VALUES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

export const ADMIN_PAYMENT_STATUS_VALUES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
] as const;

export const ADMIN_ORDER_PERIOD_PRESETS = ["all", "7d", "30d", "90d"] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUS_VALUES)[number];
export type AdminPaymentStatus = (typeof ADMIN_PAYMENT_STATUS_VALUES)[number];
export type AdminOrderPeriodPreset =
  (typeof ADMIN_ORDER_PERIOD_PRESETS)[number];

export type AdminOrderStatusFilter = "ALL" | AdminOrderStatus;
export type AdminPaymentStatusFilter = "ALL" | AdminPaymentStatus;

export type AdminOrdersListFilters = {
  limit: number;
  page: number;
  paymentStatus: AdminPaymentStatusFilter;
  period: AdminOrderPeriodPreset;
  query: string;
  status: AdminOrderStatusFilter;
  storeId: string | null;
};

export type AdminOrderSummary = {
  code: string;
  createdAt: string;
  customerName: string;
  id: number;
  itemCount: number;
  itemPreview: string[];
  paymentStatus: AdminPaymentStatus;
  status: AdminOrderStatus;
  store: {
    id: string;
    name: string;
  };
  total: number;
  trackingCode: string | null;
};

export type AdminOrderItemDetail = {
  id: string;
  productImage: string | null;
  productName: string;
  quantity: number;
  totalPrice: number;
  unitPrice: number;
};

export type AdminOrderPaymentDetail = {
  amount: number;
  failedAt: string | null;
  id: string;
  method: string;
  paidAt: string | null;
  status: AdminPaymentStatus;
};

export type AdminOrderHistoryEntry = {
  actorLabel: string;
  createdAt: string;
  description: string | null;
  id: string;
  isFallback: boolean;
  status: AdminOrderStatus;
};

export type AdminOrderDetail = AdminOrderSummary & {
  address: {
    city: string;
    complement: string | null;
    neighborhood: string;
    number: string;
    state: string;
    street: string;
    zipCode: string;
  } | null;
  availableActions: {
    canUpdateStatus: boolean;
    statusOptions: AdminOrderStatus[];
  };
  cancelReason: string | null;
  cancelledAt: string | null;
  customer: {
    emailMasked: string | null;
    name: string;
    phoneMasked: string | null;
  };
  deliveredAt: string | null;
  estimatedDelivery: string | null;
  history: AdminOrderHistoryEntry[];
  items: AdminOrderItemDetail[];
  notes: string | null;
  payments: AdminOrderPaymentDetail[];
  shippedAt: string | null;
  shippingMethod: "STANDARD" | "EXPRESS" | "PICKUP";
};

export type AdminOrdersPagination = {
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type AdminOrdersListResponse = {
  filters: AdminOrdersListFilters;
  orders: AdminOrderSummary[];
  pagination: AdminOrdersPagination;
  success: true;
};

export type AdminOrderDetailResponse = {
  order: AdminOrderDetail;
  success: true;
};

export type AdminOrderUpdatePayload = {
  nextStatus?: unknown;
};
