"use client";

import { startTransition, useMemo, useState } from "react";
import { Search, Store } from "lucide-react";

import { useAdminCustomers } from "@/hooks/useAdminCustomers";
import type { AdminCustomersFilters } from "@/lib/admin/customers-contract";

const DEFAULT_FILTERS: AdminCustomersFilters = {
  limit: 12,
  page: 1,
  query: "",
  storeId: null,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) {
    return "Sem pedidos recentes";
  }

  return dateFormatter.format(new Date(value));
}

export default function AdminCustomersClient() {
  const [filters, setFilters] =
    useState<AdminCustomersFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const { data, errorMessage, isLoading, isRefreshing, retry } =
    useAdminCustomers(filters);
  const storeOptions = data?.meta.stores ?? [];
  const summaryLabel = useMemo(() => {
    if (!data) {
      return "Base operacional de clientes";
    }

    return `${data.pagination.total} cliente(s) no escopo atual`;
  }, [data]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="[font-family:var(--font-arimo)] text-sm text-[#6a7282]">
            {summaryLabel}
          </p>
          {isRefreshing ? (
            <span className="[font-family:var(--font-arimo)] text-xs text-[#6a7282]">
              Atualizando leitura...
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
          <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5]">
            <Search className="h-4 w-4 text-[#5c7cfa]" />
            <input
              className="w-full bg-transparent outline-none placeholder:text-[#6a7282]"
              onChange={(event) => {
                setSearchInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  startTransition(() => {
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      page: 1,
                      query: searchInput.trim(),
                    }));
                  });
                }
              }}
              placeholder="Buscar por nome ou email"
              value={searchInput}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5]">
            <Store className="h-4 w-4 text-[#5c7cfa]" />
            <select
              className="w-full bg-transparent outline-none"
              onChange={(event) => {
                const nextStoreId = event.target.value || null;

                startTransition(() => {
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    page: 1,
                    storeId: nextStoreId,
                  }));
                });
              }}
              value={filters.storeId ?? ""}
            >
              <option value="">Todas as lojas</option>
              {storeOptions.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <button
            className="rounded-2xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm font-semibold text-rose-300 transition hover:border-rose-400/60 hover:bg-rose-500/15"
            onClick={() => {
              startTransition(() => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  page: 1,
                  query: searchInput.trim(),
                }));
              });
            }}
            type="button"
          >
            Buscar
          </button>
        </div>
      </div>

      {errorMessage && !data ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 [font-family:var(--font-arimo)] text-sm text-rose-300">
          <p className="font-semibold text-[#f1f3f5]">
            Falha ao carregar clientes
          </p>
          <p className="mt-2">{errorMessage}</p>
          <button
            className="mt-4 rounded-full border border-white/10 bg-[#12151a] px-4 py-2 font-semibold text-[#f1f3f5] transition hover:border-white/20"
            onClick={retry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!errorMessage && isLoading && !data ? (
        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6 [font-family:var(--font-arimo)] text-sm text-[#99a1af]">
          Carregando base administrativa de clientes...
        </div>
      ) : null}

      {data && data.customers.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6 [font-family:var(--font-arimo)] text-sm text-[#99a1af]">
          Nenhum cliente encontrado para os filtros atuais.
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {data.customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-2xl border border-white/6 bg-[#171a21] p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="[font-family:var(--font-space-grotesk)] text-xl font-semibold text-[#f1f3f5]">
                      {customer.name ?? "Cliente sem nome informado"}
                    </h3>
                    <span
                      className={`rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold uppercase ${
                        customer.isActive
                          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
                          : "border-amber-400/25 bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      {customer.isActive ? "Ativo" : "Cadastro inativo"}
                    </span>
                  </div>
                  <p className="[font-family:var(--font-arimo)] text-sm text-[#99a1af]">
                    {customer.email}
                  </p>
                  <p className="[font-family:var(--font-arimo)] text-xs text-[#6a7282]">
                    Cadastro criado em {formatDate(customer.createdAt)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3">
                    <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                      Pedidos
                    </p>
                    <p className="mt-2 [font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f1f3f5]">
                      {customer.orderCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3">
                    <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                      Total gasto
                    </p>
                    <p className="mt-2 [font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f1f3f5]">
                      {currencyFormatter.format(customer.totalSpent)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3">
                    <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                      Ultimo pedido
                    </p>
                    <p className="mt-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5]">
                      {formatDate(customer.lastOrderAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {customer.stores.map((store) => (
                  <span
                    key={store.id}
                    className="rounded-full border border-[#5c7cfa]/25 bg-[#5c7cfa]/10 px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold text-[#5c7cfa]"
                  >
                    {store.name}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                  Historico resumido de pedidos
                </p>

                {customer.recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#6a7282]">
                    Sem pedidos recentes neste escopo.
                  </div>
                ) : (
                  customer.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid gap-3 rounded-2xl border border-white/6 bg-[#12151a] px-4 py-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.6fr)]"
                    >
                      <div className="space-y-1">
                        <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5]">
                          {order.code}
                        </p>
                        <p className="[font-family:var(--font-arimo)] text-xs text-[#6a7282]">
                          {order.store.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="[font-family:var(--font-arimo)] text-sm text-[#f1f3f5]">
                          {order.itemCount} item(ns) · status {order.status}
                        </p>
                        <p className="[font-family:var(--font-arimo)] text-xs text-[#6a7282]">
                          Criado em {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-1 text-left lg:text-right">
                        <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5]">
                          {currencyFormatter.format(order.total)}
                        </p>
                        <p className="[font-family:var(--font-arimo)] text-xs text-[#6a7282]">
                          Tracking {order.trackingCode ?? "nao informado"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-[#171a21] px-5 py-4">
            <div className="[font-family:var(--font-arimo)] text-sm text-[#99a1af]">
              Pagina {data.pagination.page} de {data.pagination.totalPages}
            </div>
            <div className="flex gap-3">
              <button
                className="rounded-full border border-white/6 bg-[#12151a] px-4 py-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5] transition hover:border-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!data.pagination.hasPrev}
                onClick={() => {
                  startTransition(() => {
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      page: Math.max(1, currentFilters.page - 1),
                    }));
                  });
                }}
                type="button"
              >
                Anterior
              </button>
              <button
                className="rounded-full border border-white/6 bg-[#12151a] px-4 py-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5] transition hover:border-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!data.pagination.hasNext}
                onClick={() => {
                  startTransition(() => {
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      page: currentFilters.page + 1,
                    }));
                  });
                }}
                type="button"
              >
                Proxima
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
