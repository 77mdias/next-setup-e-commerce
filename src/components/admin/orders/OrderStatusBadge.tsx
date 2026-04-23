import type { AdminOrderStatus, AdminPaymentStatusFilter } from "@/lib/admin/orders-contract";
import { cn } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from "./types";

export type OrderStatusBadgeProps = {
  status: AdminOrderStatus;
  paymentStatus?: never;
};

export type PaymentStatusBadgeProps = {
  status?: never;
  paymentStatus: AdminPaymentStatusFilter;
};

export type OrderStatusBadgeCombinedProps = {
  status: AdminOrderStatus;
  paymentStatus?: AdminPaymentStatusFilter;
};

export function OrderStatusBadge({
  status,
  paymentStatus,
}: OrderStatusBadgeProps | PaymentStatusBadgeProps | OrderStatusBadgeCombinedProps) {
  const isPaymentBadge = !status && paymentStatus;
  const toneClass = isPaymentBadge
    ? PAYMENT_STATUS_TONES[paymentStatus as Exclude<AdminPaymentStatusFilter, "ALL">]
    : ORDER_STATUS_TONES[status as AdminOrderStatus];
  const label = isPaymentBadge
    ? PAYMENT_STATUS_LABELS[paymentStatus as Exclude<AdminPaymentStatusFilter, "ALL">]
    : ORDER_STATUS_LABELS[status as AdminOrderStatus];

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
        toneClass,
      )}
    >
      {label}
    </span>
  );
}
