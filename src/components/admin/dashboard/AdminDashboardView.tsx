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
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
  }

  if (trend === "down") {
    return "border-amber-300/30 bg-amber-500/10 text-amber-300";
  }

  return "border-white/6 bg-[#17140f] text-[#b8ad9f]";
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
    <div className="space-y-2">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${getTrendTone(
          change.trend,
        )}`}
      >
        {getTrendIcon(change.trend)}
        <span>
          {directionLabel}: {formatAbsoluteChange(change, kind)}
        </span>
      </div>
      <p className="pl-1 [font-family:var(--font-arimo)] text-xs text-[#9f9383]">
        {formatPercentageSuffix(change)}
      </p>
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
    <article className="flex flex-col rounded-2xl border border-white/6 bg-[#1b1712] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
            {title}
          </p>
          <p className="mt-3 [font-family:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-[#f2eee8]">
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

      <p className="mt-4 flex-1 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
        {description}
      </p>
      <div className="mt-4">{note}</div>
    </article>
  );
}

function LoadingState() {
  return (
    <section
      className="rounded-2xl border border-white/6 bg-[#1b1712] p-6"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <RefreshCw className="h-4 w-4 animate-spin text-[#59627a]" />
        <p className="[font-family:var(--font-arimo)] text-sm text-[#9f9383]">
          Carregando indicadores operacionais do dashboard.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`dashboard-loading-${index}`}
            className="h-52 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]"
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
    <section className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-rose-200">
      <div className="flex items-start gap-3">
        <Ban className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-3">
          <div>
            <h2 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
              Nao foi possivel carregar os KPIs do painel
            </h2>
            <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-rose-200">
              {errorMessage}
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#17140f] px-4 py-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8] transition hover:border-white/20"
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
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/6 bg-[#1b1712] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {WINDOW_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`rounded-full border px-4 py-2 [font-family:var(--font-arimo)] text-sm font-medium transition ${
                selectedWindow === option.key
                  ? "border-[#59627a]/50 bg-[#59627a]/20 text-[#f2eee8]"
                  : "border-white/6 bg-[#17140f] text-[#9f9383] hover:border-[#59627a]/30 hover:text-[#f2eee8]"
              }`}
              disabled={isRefreshing}
              onClick={() => onWindowChange?.(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="inline-flex items-center gap-2 [font-family:var(--font-arimo)] text-xs text-[#9f9383]">
          {isRefreshing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#59627a]" />
          ) : (
            <Boxes className="h-3.5 w-3.5 text-[#59627a]" />
          )}
          Última leitura: {formatDateTime(data.generatedAt)}
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="[font-family:var(--font-arimo)] font-semibold text-[#f2eee8]">
                A ultima leitura valida foi mantida.
              </p>
              <p className="[font-family:var(--font-arimo)] leading-6">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {dashboardIsEmpty ? (
        <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-4 text-sm">
          <div className="flex items-start gap-3">
            <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#59627a]" />
            <div className="space-y-1">
              <p className="[font-family:var(--font-arimo)] font-semibold text-[#f2eee8]">
                Ainda nao existe movimentacao suficiente para os KPIs desta
                janela.
              </p>
              <p className="[font-family:var(--font-arimo)] leading-6 text-[#b8ad9f]">
                O dashboard continua estavel com cards zerados para permitir
                navegacao e leitura do estado atual sem ruido operacional.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accentClassName="border-[#59627a]/25 bg-[#59627a]/10 text-[#59627a]"
          description={`Pedidos criados em ${data.filters.window.label.toLowerCase()}.`}
          icon={<ShoppingCart className="h-5 w-5" />}
          metric={formatNumber(data.kpis.orders.total)}
          note={renderComparison(data.kpis.orders.comparison, "count")}
          title="Pedidos"
        />
        <KpiCard
          accentClassName="border-emerald-400/30 bg-emerald-500/10 text-emerald-400"
          description="Taxa de pagamentos aprovados na janela operacional."
          icon={<CreditCard className="h-5 w-5" />}
          metric={formatRate(data.kpis.paymentApproval.rate)}
          note={renderComparison(data.kpis.paymentApproval.comparison, "rate")}
          title="Aprovacao"
        />
        <KpiCard
          accentClassName="border-amber-300/30 bg-amber-500/10 text-amber-400"
          description="Receita bruta confirmada por pedidos pagos."
          icon={<Wallet className="h-5 w-5" />}
          metric={formatCurrency(data.kpis.revenue.gross)}
          note={renderComparison(data.kpis.revenue.comparison, "currency")}
          title="Receita"
        />
        <KpiCard
          accentClassName="border-rose-400/30 bg-rose-500/10 text-rose-400"
          description="Produtos abaixo do limite de estoque configurado."
          icon={<AlertTriangle className="h-5 w-5" />}
          metric={formatNumber(data.kpis.lowStock.products)}
          note={
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold text-rose-300">
              Snapshot atual com limite de {data.filters.lowStockLimit} itens
            </div>
          }
          title="Estoque baixo"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Composicao da janela
              </p>
              <h3 className="mt-2 [font-family:var(--font-space-grotesk)] text-base font-semibold text-[#f2eee8]">
                Sinais operacionais rapidos
              </h3>
            </div>
            {isRefreshing ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/6 bg-[#17140f] px-3 py-1 [font-family:var(--font-arimo)] text-xs text-[#b8ad9f]">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Atualizando
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
                Pedidos por status
              </p>
              <div className="mt-4 space-y-3">
                {orderRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]"
                  >
                    <span className="text-[#b8ad9f]">{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
                Pagamentos por status
              </p>
              <div className="mt-4 space-y-3">
                {paymentRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]"
                  >
                    <span className="text-[#b8ad9f]">{row.label}</span>
                    <span className="font-semibold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Estoque critico
              </p>
              <h3 className="mt-2 [font-family:var(--font-space-grotesk)] text-base font-semibold text-[#f2eee8]">
                Produtos que exigem acao imediata
              </h3>
            </div>
            <div className="rounded-full border border-white/6 bg-[#17140f] px-3 py-1 [font-family:var(--font-arimo)] text-xs text-[#b8ad9f]">
              {data.kpis.lowStock.items.length} item(ns) listados
            </div>
          </div>

          {data.kpis.lowStock.items.length === 0 ? (
            <div className="mt-5 rounded-xl border border-white/6 bg-[#17140f] p-5 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
              Nenhum produto esta abaixo do limite configurado no snapshot
              atual.
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.kpis.lowStock.items.map((item) => (
                <article
                  key={item.productId}
                  className="rounded-2xl border border-white/6 bg-[#17140f] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
                        {item.productName}
                      </p>
                      <p className="mt-1 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
                        {item.storeName}
                      </p>
                    </div>
                    <div className="rounded-full border border-rose-400/25 bg-rose-500/10 px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold text-rose-300">
                      Disponivel: {formatNumber(item.availableQuantity)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] sm:grid-cols-3">
                    <div className="rounded-xl border border-white/6 bg-[#11100d] px-3 py-2">
                      <span className="block text-xs tracking-[0.16em] text-[#9f9383] uppercase">
                        Minimo
                      </span>
                      <span className="mt-1 block font-semibold">
                        {formatNumber(item.minStock)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-white/6 bg-[#11100d] px-3 py-2">
                      <span className="block text-xs tracking-[0.16em] text-[#9f9383] uppercase">
                        Reservado
                      </span>
                      <span className="mt-1 block font-semibold">
                        {formatNumber(item.reserved)}
                      </span>
                    </div>
                    <div className="rounded-xl border border-white/6 bg-[#11100d] px-3 py-2">
                      <span className="block text-xs tracking-[0.16em] text-[#9f9383] uppercase">
                        Scope
                      </span>
                      <span className="mt-1 block font-semibold">
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
