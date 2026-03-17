import React, { type ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  Boxes,
  CreditCard,
  Minus,
  PackageSearch,
  RefreshCw,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { formatCurrency } from "@/helpers/format-currency";
import type {
  AdminDashboardMetricChange,
  AdminDashboardMetricsResponse,
  AdminDashboardWindowPreset,
} from "@/lib/admin/dashboard-metrics";

const WINDOW_OPTIONS: Array<{
  key: AdminDashboardWindowPreset;
  label: string;
}> = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
];

const ORDER_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelados",
  DELIVERED: "Entregues",
  PAID: "Pagos",
  PAYMENT_PENDING: "Aguardando pagamento",
  PENDING: "Pendentes",
  PROCESSING: "Em processamento",
  REFUNDED: "Reembolsados",
  SHIPPED: "Em transporte",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelados",
  FAILED: "Falhos",
  PAID: "Aprovados",
  PENDING: "Pendentes",
  REFUNDED: "Reembolsados",
};

type AdminDashboardViewProps = {
  data: AdminDashboardMetricsResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onRetry?: () => void;
  onWindowChange?: (window: AdminDashboardWindowPreset) => void;
  selectedWindow: AdminDashboardWindowPreset;
};

type KpiCardProps = {
  accentClassName: string;
  description: string;
  icon: ReactNode;
  metric: string;
  note: ReactNode;
  title: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatRate(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "percent",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAbsoluteChange(
  change: AdminDashboardMetricChange,
  kind: "count" | "currency" | "rate",
) {
  if (kind === "currency") {
    return formatCurrency(Math.abs(change.absolute));
  }

  if (kind === "rate") {
    return `${formatNumber(Math.abs(change.absolute) * 100)} p.p.`;
  }

  return formatNumber(Math.abs(change.absolute));
}

function formatPercentageSuffix(change: AdminDashboardMetricChange) {
  if (change.percentage === null) {
    return "vs janela anterior sem baseline comparavel";
  }

  return `${formatNumber(Math.abs(change.percentage))}% vs janela anterior`;
}

function getTrendIcon(trend: AdminDashboardMetricChange["trend"]) {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4" />;
  }

  if (trend === "down") {
    return <TrendingDown className="h-4 w-4" />;
  }

  return <Minus className="h-4 w-4" />;
}

function getTrendTone(trend: AdminDashboardMetricChange["trend"]) {
  if (trend === "up") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }

  if (trend === "down") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-50";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-100";
}

function renderComparison(
  change: AdminDashboardMetricChange,
  kind: "count" | "currency" | "rate",
) {
  const directionLabel =
    change.trend === "flat"
      ? "Sem variacao"
      : change.trend === "up"
        ? "Alta"
        : "Queda";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getTrendTone(
        change.trend,
      )}`}
    >
      {getTrendIcon(change.trend)}
      <span>
        {directionLabel}: {formatAbsoluteChange(change, kind)}
      </span>
      <span className="text-[11px] opacity-80">
        {formatPercentageSuffix(change)}
      </span>
    </div>
  );
}

function buildStatusRows(
  labelMap: Record<string, string>,
  values: Record<string, number>,
) {
  const entries = Object.entries(values)
    .filter(([, count]) => count > 0)
    .sort((left, right) => right[1] - left[1]);

  if (entries.length === 0) {
    return [
      {
        label: "Sem registros na janela selecionada",
        value: "0",
      },
    ];
  }

  return entries.slice(0, 4).map(([status, count]) => ({
    label: labelMap[status] ?? status,
    value: formatNumber(count),
  }));
}

export function isAdminDashboardEmpty(data: AdminDashboardMetricsResponse) {
  return (
    data.kpis.lowStock.products === 0 &&
    data.kpis.orders.total === 0 &&
    data.kpis.paymentApproval.total === 0 &&
    data.kpis.revenue.gross === 0
  );
}

function KpiCard({
  accentClassName,
  description,
  icon,
  metric,
  note,
  title,
}: KpiCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {metric}
          </p>
        </div>
        <span
          className={`rounded-2xl border p-3 ${accentClassName}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-4">{note}</div>
    </article>
  );
}

function LoadingState() {
  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-slate-100">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <p className="text-sm font-medium">
          Carregando indicadores operacionais do dashboard.
        </p>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`dashboard-loading-${index}`}
            className="h-52 animate-pulse rounded-[1.75rem] border border-white/8 bg-white/5"
          />
        ))}
      </div>
    </section>
  );
}

function ErrorState({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry?: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-rose-400/30 bg-rose-500/10 p-6 text-rose-50">
      <div className="flex items-start gap-3">
        <Ban className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Nao foi possivel carregar os KPIs do painel
            </h2>
            <p className="mt-2 text-sm leading-6 text-rose-100">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/35"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    </section>
  );
}

export default function AdminDashboardView({
  data,
  errorMessage,
  isLoading,
  isRefreshing,
  onRetry,
  onWindowChange,
  selectedWindow,
}: AdminDashboardViewProps) {
  if (isLoading && data === null) {
    return <LoadingState />;
  }

  if (data === null) {
    return (
      <ErrorState
        errorMessage={
          errorMessage ??
          "Nao foi possivel carregar os indicadores agora. Tente novamente em instantes."
        }
        onRetry={onRetry}
      />
    );
  }

  const dashboardIsEmpty = isAdminDashboardEmpty(data);
  const orderRows = buildStatusRows(
    ORDER_STATUS_LABELS,
    data.kpis.orders.byStatus,
  );
  const paymentRows = buildStatusRows(
    PAYMENT_STATUS_LABELS,
    data.kpis.paymentApproval.byStatus,
  );

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
            <Boxes className="h-3.5 w-3.5" />
            Dashboard operacional
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              KPIs criticos para a rotina diaria do painel admin
            </h2>
            <p className="text-sm leading-7 text-slate-300 sm:text-base">
              A leitura do dashboard consome o contrato consolidado de `GET
              /api/admin/dashboard`, mantendo filtros por janela e fallback
              resiliente quando uma tentativa falha.
            </p>
          </div>
        </div>

        <div className="space-y-3 xl:text-right">
          <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
            Janela de analise
          </p>
          <div className="flex flex-wrap gap-2 xl:justify-end">
            {WINDOW_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  selectedWindow === option.key
                    ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-50"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:text-white"
                }`}
                disabled={isRefreshing}
                onClick={() => onWindowChange?.(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-400">
            Ultima leitura valida em {formatDateTime(data.generatedAt)}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-white">
                A ultima leitura valida foi mantida.
              </p>
              <p className="leading-6">
                {errorMessage} Os cards abaixo seguem exibindo o snapshot
                anterior sem quebrar a navegacao do painel.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {dashboardIsEmpty ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <div className="flex items-start gap-3">
            <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-cyan-100" />
            <div className="space-y-1">
              <p className="font-semibold text-white">
                Ainda nao existe movimentacao suficiente para os KPIs desta
                janela.
              </p>
              <p className="leading-6 text-slate-300">
                O dashboard continua estavel com cards zerados para permitir
                navegacao e leitura do estado atual sem ruido operacional.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <KpiCard
          accentClassName="border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
          description={`Pedidos criados em ${data.filters.window.label.toLowerCase()}.`}
          icon={<ShoppingCart className="h-5 w-5" />}
          metric={formatNumber(data.kpis.orders.total)}
          note={renderComparison(data.kpis.orders.comparison, "count")}
          title="Pedidos"
        />
        <KpiCard
          accentClassName="border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
          description="Taxa de pagamentos aprovados na janela operacional."
          icon={<CreditCard className="h-5 w-5" />}
          metric={formatRate(data.kpis.paymentApproval.rate)}
          note={renderComparison(data.kpis.paymentApproval.comparison, "rate")}
          title="Aprovacao"
        />
        <KpiCard
          accentClassName="border-amber-300/30 bg-amber-500/10 text-amber-50"
          description="Receita bruta confirmada por pedidos pagos."
          icon={<Wallet className="h-5 w-5" />}
          metric={formatCurrency(data.kpis.revenue.gross)}
          note={renderComparison(data.kpis.revenue.comparison, "currency")}
          title="Receita"
        />
        <KpiCard
          accentClassName="border-rose-400/30 bg-rose-500/10 text-rose-100"
          description="Produtos abaixo do limite de estoque configurado."
          icon={<AlertTriangle className="h-5 w-5" />}
          metric={formatNumber(data.kpis.lowStock.products)}
          note={
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-50">
              Snapshot atual com limite de {data.filters.lowStockLimit} itens
            </div>
          }
          title="Estoque baixo"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                Composicao da janela
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Sinais operacionais rapidos
              </h3>
            </div>
            {isRefreshing ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Atualizando
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">
                Pedidos por status
              </p>
              <div className="mt-4 space-y-3">
                {orderRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 text-sm text-slate-200"
                  >
                    <span>{row.label}</span>
                    <span className="font-semibold text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">
                Pagamentos por status
              </p>
              <div className="mt-4 space-y-3">
                {paymentRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 text-sm text-slate-200"
                  >
                    <span>{row.label}</span>
                    <span className="font-semibold text-white">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-slate-400 uppercase">
                Estoque critico
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Produtos que exigem acao imediata
              </h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              {data.kpis.lowStock.items.length} item(ns) listados
            </div>
          </div>

          {data.kpis.lowStock.items.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-sm leading-6 text-slate-300">
              Nenhum produto esta abaixo do limite configurado no snapshot
              atual.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.kpis.lowStock.items.map((item) => (
                <article
                  key={item.productId}
                  className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.productName}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {item.storeName}
                      </p>
                    </div>
                    <div className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-50">
                      Disponivel: {formatNumber(item.availableQuantity)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                      <span className="block text-xs tracking-[0.2em] text-slate-400 uppercase">
                        Minimo
                      </span>
                      <span className="mt-1 block font-semibold text-white">
                        {formatNumber(item.minStock)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                      <span className="block text-xs tracking-[0.2em] text-slate-400 uppercase">
                        Reservado
                      </span>
                      <span className="mt-1 block font-semibold text-white">
                        {formatNumber(item.reserved)}
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                      <span className="block text-xs tracking-[0.2em] text-slate-400 uppercase">
                        Scope
                      </span>
                      <span className="mt-1 block font-semibold text-white">
                        {item.storeId}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
