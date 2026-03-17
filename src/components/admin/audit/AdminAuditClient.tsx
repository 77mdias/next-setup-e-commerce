"use client";

import { startTransition, useMemo, useState } from "react";
import { Activity, Search, ShieldCheck, Store } from "lucide-react";

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
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.4)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Observabilidade de mutacoes
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Trilha administrativa de auditoria
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Eventos sensiveis de pedidos e catalogo com ator, alvo, momento
                da acao e snapshots before/after para rastreabilidade
                operacional.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
              Cobertura atual
            </p>
            <p className="mt-2 font-medium text-white">{headerLabel}</p>
            <p className="mt-1 text-xs text-slate-400">
              {isRefreshing
                ? "Atualizando leitura..."
                : "Persistencia atomica junto das mutacoes sensiveis."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_170px_180px_220px_140px]">
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
              placeholder="Buscar por ator, alvo ou resumo"
              value={searchInput}
            />
          </label>

          <select
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none"
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
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none"
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
          <p className="font-semibold">Falha ao carregar auditoria</p>
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
          Carregando trilha administrativa...
        </div>
      ) : null}

      {data && data.events.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-sm text-slate-300">
          Nenhum evento auditavel encontrado para os filtros atuais.
        </div>
      ) : null}

      {data ? (
        <div className="space-y-4">
          {data.events.map((event) => (
            <article
              key={event.id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {event.resource}
                    </span>
                    <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100">
                      {event.action}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {event.summary}
                  </h3>
                  <p className="text-sm text-slate-300">
                    {event.target.label ?? event.target.id}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
                  <div className="flex items-center gap-2 text-white">
                    <Activity className="h-4 w-4 text-cyan-100" />
                    {dateFormatter.format(new Date(event.createdAt))}
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Ator {event.actor.label} · perfil {event.actor.role}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    alvo {event.target.id}
                    {event.storeId ? ` · loja ${event.storeId}` : ""}
                  </p>
                </div>
              </div>

              <details className="mt-5 rounded-2xl border border-white/10 bg-slate-950/35 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-white">
                  Ver snapshots before / after
                </summary>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Before
                    </p>
                    <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-300">
                      {formatJsonBlock(event.before)}
                    </pre>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      After
                    </p>
                    <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-300">
                      {formatJsonBlock(event.after)}
                    </pre>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                    <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
                      Metadata
                    </p>
                    <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-300">
                      {formatJsonBlock(event.metadata)}
                    </pre>
                  </div>
                </div>
              </details>
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
