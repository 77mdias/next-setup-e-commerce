"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Home,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import Link from "next/link";
import ButtonBack from "@/components/ui/ButtonBack";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage: string;
}

interface Payment {
  id: string;
  status: string;
  amount: number;
  paidAt: string | null;
}

interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  total: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  items: OrderItem[];
  store: {
    id: string;
    name: string;
    slug: string;
  };
  payments: Payment[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const statusConfig = {
  PENDING: {
    label: "Pendente",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-400/30",
    hover: "hover:border-yellow-400 hover:bg-yellow-500/5",
  },
  PAID: {
    label: "Pago",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-400/30",
    hover: "hover:border-green-400 hover:bg-green-500/5",
  },
  PROCESSING: {
    label: "Processando",
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-400/30",
    hover: "hover:border-blue-400 hover:bg-blue-500/5",
  },
  SHIPPED: {
    label: "Enviado",
    icon: Truck,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-400/30",
    hover: "hover:border-purple-400 hover:bg-purple-500/5",
  },
  DELIVERED: {
    label: "Entregue",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-400/30",
    hover: "hover:border-green-400 hover:bg-green-500/5",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-400/30",
    hover: "hover:border-red-400 hover:bg-red-500/5",
  },
  REFUNDED: {
    label: "Reembolsado",
    icon: XCircle,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-400/30",
    hover: "hover:border-gray-400 hover:bg-gray-500/5",
  },
};

export default function PedidosPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      const callbackPath = `/${slug}/pedido`;
      router.push(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: callbackPath,
          fromPath: callbackPath,
        }),
      );
    }
  }, [isAuthenticated, router, slug]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [statusFilter, currentPage, isAuthenticated]);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/orders/user?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar pedidos");
      }

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      console.error("❌ Erro ao buscar pedidos:", err);
      setError("Erro ao carregar pedidos");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Mostrar loading enquanto verifica autenticação ou carrega dados
  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <ButtonBack />
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-[var(--text-price)]" />
            <h1 className="text-2xl font-bold text-white">Meus Pedidos</h1>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusFilter("ALL")}
              className={`text-xs font-medium transition-all duration-200 ${
                statusFilter === "ALL"
                  ? "border-[var(--text-price)] bg-[var(--text-price)] text-white shadow-lg hover:bg-[var(--text-price-secondary)]"
                  : "border-gray-600 text-gray-300 hover:border-[var(--text-price)] hover:bg-[var(--text-price)]/5 hover:text-[var(--text-price)]"
              }`}
            >
              Todos
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => {
              const isActive = statusFilter === status;

              return (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                  className={`text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? `${config.bg} ${config.border} ${config.color} shadow-lg`
                      : `border-gray-600 text-gray-300 ${config.hover}`
                  }`}
                >
                  <config.icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          <div className="rounded-lg bg-[var(--card-product)] p-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-gray-500" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Nenhum pedido encontrado
            </h2>
            <p className="mb-6 text-gray-400">
              {statusFilter === "ALL"
                ? "Você ainda não fez nenhum pedido."
                : `Nenhum pedido com status "${getStatusConfig(statusFilter).label}" encontrado.`}
            </p>
            <Link href={`/${slug}`}>
              <Button className="bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]">
                <Home className="mr-2 h-4 w-4" />
                Fazer Primeira Compra
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="rounded-lg bg-[var(--card-product)] p-6"
                >
                  {/* Header do pedido */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${statusConfig.bg}`}>
                        <StatusIcon
                          className={`h-5 w-5 ${statusConfig.color}`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          Pedido #{order.id}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {order.store.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--text-price)]">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Status e informações */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      {order.paymentStatus === "PAID" && (
                        <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-400">
                          Pago
                        </span>
                      )}
                    </div>
                    <Link href={`/${slug}/pedido/${order.id}`}>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[var(--button-primary)] text-[var(--text-primary)] hover:bg-[var(--text-price-secondary)]"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>

                  {/* Lista de produtos */}
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg bg-gray-800/50 p-3"
                      >
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                          <img
                            src={
                              item.productImage || "/placeholder-product.jpg"
                            }
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-medium text-white">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-gray-400">
                            Qtd: {item.quantity} x{" "}
                            {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[var(--text-price)]">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-center text-sm text-gray-400">
                        +{order.items.length - 3} mais produtos
                      </p>
                    )}
                  </div>

                  {/* Motivo do cancelamento */}
                  {order.cancelReason && (
                    <div className="mt-4 rounded-lg bg-red-500/10 p-3">
                      <p className="text-sm text-red-400">
                        <strong>Motivo do cancelamento:</strong>{" "}
                        {order.cancelReason}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1,
              ).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Informações da paginação */}
        {pagination && (
          <div className="mt-4 text-center text-sm text-gray-400">
            Mostrando {(currentPage - 1) * pagination.limit + 1} a{" "}
            {Math.min(currentPage * pagination.limit, pagination.total)} de{" "}
            {pagination.total} pedidos
          </div>
        )}
      </div>
    </div>
  );
}
