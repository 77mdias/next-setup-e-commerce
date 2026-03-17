import type { AdminOrderStatus } from "@/lib/admin/orders-contract";

export type AdminCustomerStoreOption = {
  id: string;
  name: string;
};

export type AdminCustomerOrderSummary = {
  code: string;
  createdAt: string;
  id: number;
  itemCount: number;
  status: AdminOrderStatus;
  store: AdminCustomerStoreOption;
  total: number;
  trackingCode: string | null;
};

export type AdminCustomerSummary = {
  createdAt: string;
  email: string;
  id: string;
  isActive: boolean;
  lastOrderAt: string | null;
  name: string | null;
  orderCount: number;
  recentOrders: AdminCustomerOrderSummary[];
  stores: AdminCustomerStoreOption[];
  totalSpent: number;
};

export type AdminCustomersFilters = {
  limit: number;
  page: number;
  query: string;
  storeId: string | null;
};

export type AdminCustomersPagination = {
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type AdminCustomersMeta = {
  stores: AdminCustomerStoreOption[];
};

export type AdminCustomersListResponse = {
  customers: AdminCustomerSummary[];
  filters: AdminCustomersFilters;
  meta: AdminCustomersMeta;
  pagination: AdminCustomersPagination;
  success: true;
};
