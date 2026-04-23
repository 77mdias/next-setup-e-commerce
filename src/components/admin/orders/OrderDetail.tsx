import type { AdminOrderDetail, AdminOrderStatus } from "@/lib/admin/orders-contract";
import { formatCurrency } from "@/helpers/format-currency";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRightLeft,
  CreditCard,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { formatDate, formatDateTime, getShippingMethodLabel } from "./utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
} from "./types";

export type OrderDetailProps = {
  detail: AdminOrderDetail | null;
  detailErrorMessage: string | null;
  isDetailLoading: boolean;
  isDetailRefreshing: boolean;
  isSubmitting: boolean;
  onPendingStatusChange: (value: AdminOrderStatus | null) => void;
  onRetryDetail: () => void;
  onSubmitStatusUpdate: () => void;
  pendingStatus: AdminOrderStatus | null;
  selectedOrderId: number | null;
};

function DetailFallback({
  description,
  title,
  tone = "default",
}: {
  description: string;
  title: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-6",
        tone === "danger"
          ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
          : "border-white/6 bg-[#1b1712] text-[#b8ad9f]",
      )}
    >
      <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
        {title}
      </h3>
      <p className="mt-3 [font-family:var(--font-arimo)] text-sm leading-6">
        {description}
      </p>
    </div>
  );
}

export function OrderDetail({
  detail,
  detailErrorMessage,
  isDetailLoading,
  isDetailRefreshing,
  isSubmitting,
  onPendingStatusChange,
  onRetryDetail,
  onSubmitStatusUpdate,
  pendingStatus,
  selectedOrderId,
}: OrderDetailProps) {
  if (!selectedOrderId) {
    return (
      <DetailFallback
        description="Selecione um pedido na fila ao lado para inspecionar historico, contato operacional e proximas acoes permitidas."
        title="Nenhum pedido selecionado"
      />
    );
  }

  if (isDetailLoading && detail === null) {
    return (
      <div className="space-y-3" aria-live="polite">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`detail-loading-${index}`}
            className="h-36 animate-pulse rounded-2xl border border-white/6 bg-[#17140f]"
          />
        ))}
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-rose-300">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-3">
            <div>
              <h3 className="[font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#f2eee8]">
                Nao foi possivel carregar o detalhe do pedido
              </h3>
              <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-rose-300">
                {detailErrorMessage}
              </p>
            </div>

            <Button
              className="border-white/10 bg-[#17140f] hover:bg-[#17140f]/80"
              type="button"
              variant="outline"
              onClick={onRetryDetail}
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar detalhe
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {detailErrorMessage ? (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 [font-family:var(--font-arimo)] text-sm text-amber-300">
          Ultimo detalhe exibido. Nova tentativa falhou: {detailErrorMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/6 bg-[#17140f] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.14em] text-[#b8ad9f] uppercase">
                {detail.code}
              </span>
              <OrderStatusBadge status={detail.status} />
              <OrderStatusBadge paymentStatus={detail.paymentStatus} />
            </div>

            <div>
              <h3 className="[font-family:var(--font-space-grotesk)] text-2xl font-semibold text-[#f2eee8]">
                {detail.customer.name}
              </h3>
              <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                Pedido criado em {formatDateTime(detail.createdAt)} · Loja{" "}
                {detail.store.name} · Total {formatCurrency(detail.total)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
            <div className="flex items-center gap-2 text-[#59627a]">
              <ArrowRightLeft className="h-4 w-4" />
              {isDetailRefreshing
                ? "Atualizando detalhe..."
                : "Detalhe carregado"}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
            <CreditCard className="h-4 w-4 text-[#59627a]" />
            Contato e pagamento
          </div>

          <div className="mt-4 grid gap-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Contato operacional
              </p>
              <p className="mt-2">{detail.customer.name}</p>
              <p className="text-[#b8ad9f]">
                {detail.customer.emailMasked ?? "Email nao informado"}
              </p>
              <p className="text-[#b8ad9f]">
                {detail.customer.phoneMasked ?? "Telefone nao informado"}
              </p>
            </div>

            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Pagamentos registrados
              </p>
              <div className="mt-3 space-y-3">
                {detail.payments.length > 0 ? (
                  detail.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="rounded-xl border border-white/6 bg-[#11100d] px-3 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold",
                            PAYMENT_STATUS_TONES[payment.status],
                          )}
                        >
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </span>
                        <span>{formatCurrency(payment.amount)}</span>
                      </div>
                      <p className="mt-2 text-[#b8ad9f]">
                        Metodo: {payment.method}
                      </p>
                      <p className="text-[#9f9383]">
                        Pago em {formatDate(payment.paidAt)} · Falha em{" "}
                        {formatDate(payment.failedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#b8ad9f]">
                    Nenhum pagamento associado foi registrado para este pedido.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
            <Truck className="h-4 w-4 text-[#59627a]" />
            Fulfillment
          </div>

          <div className="mt-4 grid gap-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Metodo e tracking
              </p>
              <p className="mt-2">
                {getShippingMethodLabel(detail.shippingMethod)} · Tracking{" "}
                {detail.trackingCode ?? "nao informado"}
              </p>
              <p className="text-[#b8ad9f]">
                Estimativa {formatDate(detail.estimatedDelivery)} · Envio{" "}
                {formatDate(detail.shippedAt)} · Entrega{" "}
                {formatDate(detail.deliveredAt)}
              </p>
            </div>

            <div className="rounded-xl border border-white/6 bg-[#17140f] p-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                Endereco operacional
              </p>
              {detail.address ? (
                <div className="mt-3 space-y-1 text-[#f2eee8]">
                  <p>
                    {detail.address.street}, {detail.address.number}
                    {detail.address.complement
                      ? ` · ${detail.address.complement}`
                      : ""}
                  </p>
                  <p>
                    {detail.address.neighborhood} · {detail.address.city} -{" "}
                    {detail.address.state}
                  </p>
                  <p>CEP {detail.address.zipCode}</p>
                </div>
              ) : (
                <p className="mt-3 text-[#b8ad9f]">
                  Nenhum endereco de entrega vinculado a este pedido.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
          <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
            <Package className="h-4 w-4 text-[#59627a]" />
            Itens do pedido
          </div>

          <div className="mt-4 space-y-3">
            {detail.items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/6 bg-[#17140f] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="[font-family:var(--font-arimo)] font-semibold text-[#f2eee8]">
                      {item.productName}
                    </p>
                    <p className="mt-1 [font-family:var(--font-arimo)] text-sm text-[#b8ad9f]">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="[font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
            <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
              <ArrowRightLeft className="h-4 w-4 text-[#59627a]" />
              Acao operacional
            </div>

            {detail.availableActions.canUpdateStatus ? (
              <div className="mt-4 space-y-4">
                <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                  Atualize apenas status internos permitidos pelo fluxo atual do
                  pedido. A validacao real continua sendo feita no backend com
                  RBAC e escopo por loja.
                </p>

                <label className="block space-y-2">
                  <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.16em] text-[#9f9383] uppercase">
                    Proximo status
                  </span>
                  <select
                    className="w-full rounded-2xl border border-white/6 bg-[#17140f] px-4 py-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8] transition outline-none focus:border-[#59627a]/60"
                    value={pendingStatus ?? ""}
                    onChange={(event) =>
                      onPendingStatusChange(
                        event.target.value
                          ? (event.target.value as AdminOrderStatus)
                          : null,
                      )
                    }
                  >
                    {detail.availableActions.statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <Button
                  disabled={!pendingStatus || isSubmitting}
                  type="button"
                  onClick={onSubmitStatusUpdate}
                >
                  {isSubmitting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  Atualizar status
                </Button>
              </div>
            ) : (
              <p className="mt-4 [font-family:var(--font-arimo)] text-sm leading-6 text-[#b8ad9f]">
                Nenhuma acao operacional adicional esta liberada para o status
                atual deste pedido.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-white/6 bg-[#1b1712] p-5">
            <div className="flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-semibold text-[#f2eee8]">
              <MapPin className="h-4 w-4 text-[#59627a]" />
              Historico de transicoes
            </div>

            <div className="mt-4 space-y-3">
              {detail.history.map((historyEntry) => (
                <div
                  key={historyEntry.id}
                  className="rounded-xl border border-white/6 bg-[#17140f] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 [font-family:var(--font-arimo)] text-xs font-semibold",
                        ORDER_STATUS_TONES[historyEntry.status],
                      )}
                    >
                      {ORDER_STATUS_LABELS[historyEntry.status]}
                    </span>
                    <span className="[font-family:var(--font-arimo)] text-xs font-semibold tracking-[0.14em] text-[#9f9383] uppercase">
                      {historyEntry.actorLabel}
                    </span>
                  </div>
                  <p className="mt-3 [font-family:var(--font-arimo)] text-sm text-[#f2eee8]">
                    {historyEntry.description ??
                      "Atualizacao registrada sem observacao adicional."}
                  </p>
                  <p className="mt-2 [font-family:var(--font-arimo)] text-xs text-[#9f9383]">
                    {formatDateTime(historyEntry.createdAt)}
                    {historyEntry.isFallback ? " · fallback historico" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
