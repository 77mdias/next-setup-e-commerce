import type { AdminOrderDetail } from "@/lib/admin/orders-contract";

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function getShippingMethodLabel(value: AdminOrderDetail["shippingMethod"]) {
  switch (value) {
    case "EXPRESS":
      return "Expresso";
    case "PICKUP":
      return "Retirada";
    default:
      return "Padrao";
  }
}
