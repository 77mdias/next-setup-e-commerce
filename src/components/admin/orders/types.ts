import type {
  AdminOrderStatus,
  AdminPaymentStatusFilter,
} from "@/lib/admin/orders-contract";

export const ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  CANCELLED: "Cancelado",
  DELIVERED: "Entregue",
  PAID: "Pago",
  PAYMENT_PENDING: "Pagamento pendente",
  PENDING: "Pendente",
  PROCESSING: "Em preparo",
  REFUNDED: "Reembolsado",
  SHIPPED: "Em transporte",
};

export const ORDER_STATUS_TONES: Record<AdminOrderStatus, string> = {
  CANCELLED: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  DELIVERED: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  PAID: "border-sky-400/30 bg-sky-500/15 text-sky-300",
  PAYMENT_PENDING: "border-orange-400/30 bg-orange-500/15 text-orange-300",
  PENDING: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  PROCESSING: "border-blue-400/30 bg-blue-500/15 text-blue-300",
  REFUNDED: "border-white/6 bg-[#17140f] text-[#b8ad9f]",
  SHIPPED: "border-indigo-400/30 bg-indigo-500/15 text-indigo-300",
};

export const PAYMENT_STATUS_LABELS: Record<
  Exclude<AdminPaymentStatusFilter, "ALL">,
  string
> = {
  CANCELLED: "Pagamento cancelado",
  FAILED: "Pagamento falhou",
  PAID: "Pagamento aprovado",
  PENDING: "Pagamento pendente",
  REFUNDED: "Pagamento reembolsado",
};

export const PAYMENT_STATUS_TONES: Record<
  Exclude<AdminPaymentStatusFilter, "ALL">,
  string
> = {
  CANCELLED: "border-rose-400/30 bg-rose-500/15 text-rose-300",
  FAILED: "border-amber-400/30 bg-amber-500/15 text-amber-300",
  PAID: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  PENDING: "border-white/6 bg-[#17140f] text-[#b8ad9f]",
  REFUNDED: "border-[#59627a]/30 bg-[#59627a]/15 text-[#59627a]",
};
