"use client";

import { startTransition, useMemo, useState } from "react";
import { Activity, Search, Store } from "lucide-react";

import {
  ADMIN_AUDIT_ACTION_VALUES,
  ADMIN_AUDIT_RESOURCE_VALUES,
  type AdminAuditActionFilter,
  type AdminAuditFilters,
  type AdminAuditResourceFilter,
} from "@/lib/admin/audit-contract";
import { useAdminAudit } from "@/hooks/useAdminAudit";

const DEFAULT_FILTERS: AdminAuditFilters = {
  action: "ALL",
  limit: 20,
  page: 1,
  query: "",
  resource: "ALL",
  storeId: null,
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatJsonBlock(value: Record<string, unknown> | null) {
  if (!value) {
    return "Sem payload";
  }

  return JSON.stringify(value, null, 2);
}

export default function AdminAuditClient() {
  const [filters, setFilters] = useState<AdminAuditFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const { data, errorMessage, isLoading, isRefreshing, retry } =
    useAdminAudit(filters);
  const storeOptions = data?.meta.stores ?? [];
  const headerLabel = useMemo(() => {
    if (!data) {
      return "Trilha auditavel de operacoes sensiveis";
    }

    return `${data.pagination.total} evento(s) no escopo atual`;
  }, [data]);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/6 bg-[#171a21] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="[font-family:var(--font-arimo)] text-sm text-[#6a7282]">
            {headerLabel}
          </p>
          {isRefreshing ? (
            <span className="[font-family:var(--font-arimo)] text-xs text-[#6a7282]">
              Atualizando leitura...
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_170px_180px] xl:grid-cols-[minmax(0,1fr)_170px_180px_220px_140px]">
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
              placeholder="Buscar por ator, alvo ou resumo"
              value={searchInput}
            />
          </label>

          <select
            className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5] outline-none focus:border-[#5c7cfa]/60"
            onChange={(event) => {
              startTransition(() => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  action: event.target.value as AdminAuditActionFilter,
                  page: 1,
                }));
              });
            }}
            value={filters.action}
          >
            {ADMIN_AUDIT_ACTION_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5] outline-none focus:border-[#5c7cfa]/60"
            onChange={(event) => {
              startTransition(() => {
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  page: 1,
                  resource: event.target.value as AdminAuditResourceFilter,
                }));
              });
            }}
            value={filters.resource}
          >
            {ADMIN_AUDIT_RESOURCE_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

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
            Falha ao carregar auditoria
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
          Carregando trilha administrativa...
        </div>
      ) : null}

      {data && data.events.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-[#171a21] p-6 [font-family:var(--font-arimo)] text-sm text-[#99a1af]">
          Nenhum evento auditavel encontrado para os filtros atuais.
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {data.events.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border border-white/6 bg-[#171a21] p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#5c7cfa]/25 bg-[#5c7cfa]/10 px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold text-[#5c7cfa]">
                      {event.resource}
                    </span>
                    <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold text-rose-300">
                      {event.action}
                    </span>
                  </div>
                  <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f1f3f5]">
                    {event.summary}
                  </h3>
                  <p className="[font-family:var(--font-arimo)] text-sm text-[#99a1af]">
                    {event.target.label ?? event.target.id}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/6 bg-[#12151a] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f1f3f5]">
                  <div className="flex items-center gap-2 text-[#5c7cfa]">
                    <Activity className="h-4 w-4" />
                    {dateFormatter.format(new Date(event.createdAt))}
                  </div>
                  <p className="mt-2 text-xs text-[#99a1af]">
                    Ator {event.actor.label} · perfil {event.actor.role}
                  </p>
                  <p className="mt-1 text-xs text-[#6a7282]">
                    alvo {event.target.id}
                    {event.storeId ? ` · loja ${event.storeId}` : ""}
                  </p>
                </div>
              </div>

              <details className="mt-5 rounded-2xl border border-white/6 bg-[#12151a] p-4">
                <summary className="cursor-pointer [font-family:var(--font-arimo)] text-sm font-semibold text-[#f1f3f5]">
                  Ver snapshots before / after
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl border border-white/6 bg-[#0b0d10] p-4">
                    <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                      Before
                    </p>
                    <pre className="mt-3 overflow-x-auto [font-family:var(--font-arimo)] text-xs leading-6 text-[#99a1af]">
                      {formatJsonBlock(event.before)}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-white/6 bg-[#0b0d10] p-4">
                    <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                      After
                    </p>
                    <pre className="mt-3 overflow-x-auto [font-family:var(--font-arimo)] text-xs leading-6 text-[#99a1af]">
                      {formatJsonBlock(event.after)}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-white/6 bg-[#0b0d10] p-4">
                    <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#6a7282] uppercase">
                      Metadata
                    </p>
                    <pre className="mt-3 overflow-x-auto [font-family:var(--font-arimo)] text-xs leading-6 text-[#99a1af]">
                      {formatJsonBlock(event.metadata)}
                    </pre>
                  </div>
                </div>
              </details>
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
