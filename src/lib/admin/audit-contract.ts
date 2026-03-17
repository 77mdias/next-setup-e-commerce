export const ADMIN_AUDIT_ACTION_VALUES = [
  "ALL",
  "CREATE",
  "UPDATE",
  "DELETE",
] as const;

export const ADMIN_AUDIT_RESOURCE_VALUES = [
  "ALL",
  "ORDER",
  "PRODUCT",
  "CATEGORY",
  "INVENTORY",
  "PRODUCT_IMAGE",
] as const;

export type AdminAuditActionFilter = (typeof ADMIN_AUDIT_ACTION_VALUES)[number];
export type AdminAuditResourceFilter =
  (typeof ADMIN_AUDIT_RESOURCE_VALUES)[number];

export type AdminAuditFilters = {
  action: AdminAuditActionFilter;
  limit: number;
  page: number;
  query: string;
  resource: AdminAuditResourceFilter;
  storeId: string | null;
};

export type AdminAuditStoreOption = {
  id: string;
  name: string;
};

export type AdminAuditLogState = Record<string, unknown> | null;

export type AdminAuditLogEntry = {
  action: Exclude<AdminAuditActionFilter, "ALL">;
  actor: {
    id: string | null;
    label: string;
    role: string;
  };
  after: AdminAuditLogState;
  before: AdminAuditLogState;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown> | null;
  resource: Exclude<AdminAuditResourceFilter, "ALL">;
  storeId: string | null;
  summary: string;
  target: {
    id: string;
    label: string | null;
  };
};

export type AdminAuditPagination = {
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type AdminAuditMeta = {
  stores: AdminAuditStoreOption[];
};

export type AdminAuditListResponse = {
  events: AdminAuditLogEntry[];
  filters: AdminAuditFilters;
  meta: AdminAuditMeta;
  pagination: AdminAuditPagination;
  success: true;
};
