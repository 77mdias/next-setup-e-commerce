import type {
  AdminOrderPeriodPreset,
  AdminOrderStatus,
  AdminOrderStatusFilter,
  AdminOrdersListFilters,
  AdminPaymentStatusFilter,
} from "@/lib/admin/orders-contract";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const PERIOD_OPTIONS: Array<{
  label: string;
  value: AdminOrderPeriodPreset;
}> = [
  { label: "Todos", value: "all" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "90 dias", value: "90d" },
];

export type OrderFiltersProps = {
  filters: AdminOrdersListFilters;
  searchInput: string;
  onPaymentStatusChange: (value: AdminPaymentStatusFilter) => void;
  onPeriodChange: (value: AdminOrderPeriodPreset) => void;
  onSearchChange: (value: string) => void;
  onSearchReset: () => void;
  onSearchSubmit: () => void;
  onStatusChange: (value: AdminOrderStatusFilter) => void;
};

export function OrderFilters({
  filters,
  searchInput,
  onPaymentStatusChange,
  onPeriodChange,
  onSearchChange,
  onSearchReset,
  onSearchSubmit,
  onStatusChange,
}: OrderFiltersProps) {
  return (
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
  );
}

export { STATUS_FILTER_OPTIONS, PAYMENT_FILTER_OPTIONS, PERIOD_OPTIONS };
