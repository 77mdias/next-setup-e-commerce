"use client";

import { startTransition, useMemo, useState } from "react";
import { Search, Store, Users } from "lucide-react";

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
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.4)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
              <Users className="h-3.5 w-3.5" />
              Atendimento operacional
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Visao administrativa de clientes
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Busca por nome ou email com isolamento por loja e historico
                resumido de pedidos para suporte, triagem e contexto
                operacional.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
              Escopo atual
            </p>
            <p className="mt-2 font-medium text-white">{summaryLabel}</p>
            <p className="mt-1 text-xs text-slate-400">
              {isRefreshing
                ? "Atualizando leitura..."
                : "Consulta consistente com RBAC e store scope."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_140px]">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <Search className="h-4 w-4 text-cyan-100" />
            <input
              className="w-full bg-transparent outline-none placeholder:text-slate-500"
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

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <Store className="h-4 w-4 text-cyan-100" />
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
            className="rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-rose-300 hover:bg-rose-500/25"
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
        <div className="rounded-[2rem] border border-rose-400/30 bg-rose-500/10 p-6 text-sm text-rose-100">
          <p className="font-semibold">Falha ao carregar clientes</p>
          <p className="mt-2 text-rose-100/80">{errorMessage}</p>
          <button
            className="mt-4 rounded-full border border-white/15 bg-slate-950/60 px-4 py-2 font-semibold text-white"
            onClick={retry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {!errorMessage && isLoading && !data ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-sm text-slate-300">
          Carregando base administrativa de clientes...
        </div>
      ) : null}

      {data && data.customers.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-sm text-slate-300">
          Nenhum cliente encontrado para os filtros atuais.
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {data.customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">
                      {customer.name ?? "Cliente sem nome informado"}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                        customer.isActive
                          ? "bg-emerald-400/15 text-emerald-100"
                          : "bg-amber-400/15 text-amber-100"
                      }`}
                    >
                      {customer.isActive ? "Ativo" : "Cadastro inativo"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{customer.email}</p>
                  <p className="text-xs text-slate-500">
                    Cadastro criado em {formatDate(customer.createdAt)}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Pedidos
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {customer.orderCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Total gasto
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {currencyFormatter.format(customer.totalSpent)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Ultimo pedido
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {formatDate(customer.lastOrderAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {customer.stores.map((store) => (
                  <span
                    key={store.id}
                    className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100"
                  >
                    {store.name}
                  </span>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                  Historico resumido de pedidos
                </p>

                {customer.recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-400">
                    Sem pedidos recentes neste escopo.
                  </div>
                ) : (
                  customer.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.6fr)]"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">
                          {order.code}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.store.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-200">
                          {order.itemCount} item(ns) · status {order.status}
                        </p>
                        <p className="text-xs text-slate-400">
                          Criado em {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="space-y-1 text-left lg:text-right">
                        <p className="text-sm font-semibold text-white">
                          {currencyFormatter.format(order.total)}
                        </p>
                        <p className="text-xs text-slate-400">
                          Tracking {order.trackingCode ?? "nao informado"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          ))}

          <div className="flex items-center justify-between gap-3 rounded-[2rem] border border-white/10 bg-slate-950/55 px-5 py-4">
            <div className="text-sm text-slate-300">
              Pagina {data.pagination.page} de {data.pagination.totalPages}
            </div>
            <div className="flex gap-3">
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
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
