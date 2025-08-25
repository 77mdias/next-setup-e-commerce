"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Receipt,
  User,
  Mail,
  Calendar,
  CreditCard,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import ButtonBack from "@/components/ui/ButtonBack";

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
  customerPhone?: string;
  customerAddress?: string;
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

const statusConfig = {
  PENDING: {
    label: "Pendente",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  PAID: {
    label: "Pago",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  PROCESSING: {
    label: "Processando",
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  SHIPPED: {
    label: "Enviado",
    icon: Truck,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  DELIVERED: {
    label: "Entregue",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  REFUNDED: {
    label: "Reembolsado",
    icon: XCircle,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
  },
};

export default function PedidoDetalhesPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=/${slug}/pedido/${orderId}`);
    }
  }, [isAuthenticated, router, slug, orderId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrderDetails();
    }
  }, [orderId, isAuthenticated]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes do pedido");
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (err) {
      console.error("❌ Erro ao buscar pedido:", err);
      setError("Erro ao carregar detalhes do pedido");
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

  // Mostrar loading enquanto verifica autenticação ou carrega dados
  if (!isAuthenticated || isLoading) {
    return (
      <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
        <div className="container mx-auto max-w-2xl px-4">
          <ButtonBack />
          <div className="rounded-lg bg-[var(--card-product)] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <Package className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Pedido não encontrado
            </h1>
            <p className="mb-6 text-gray-400">
              {error || "Não foi possível encontrar os detalhes do pedido"}
            </p>
            <Link href={`/${slug}/pedido`}>
              <Button className="bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]">
                Voltar aos Pedidos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const orderStatusConfig = getStatusConfig(order.status);
  const StatusIcon = orderStatusConfig.icon;

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <ButtonBack />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${orderStatusConfig.bg}`}>
                <StatusIcon className={`h-6 w-6 ${orderStatusConfig.color}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Pedido #{order.id}
                </h1>
                <p className="text-gray-400">{order.store.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[var(--text-price)]">
                {formatCurrency(order.total)}
              </p>
              <p className="text-sm text-gray-400">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Status do pedido */}
        <div className="mb-8 rounded-lg bg-[var(--card-product)] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`text-lg font-semibold ${orderStatusConfig.color}`}
              >
                {orderStatusConfig.label}
              </span>
              {order.paymentStatus === "PAID" && (
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-400">
                  Pago
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Status do Pagamento</p>
              <p className="font-medium text-white">
                {order.paymentStatus === "PAID" ? "Pago" : "Pendente"}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de informações */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Informações do cliente */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <User className="h-5 w-5" />
                Informações do Cliente
              </h2>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Nome:</span>
                  <p className="font-medium text-white">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Email:</span>
                  <p className="font-medium text-white">
                    {order.customerEmail}
                  </p>
                </div>
                {order.customerPhone && (
                  <div>
                    <span className="text-sm text-gray-400">Telefone:</span>
                    <p className="font-medium text-white">
                      {order.customerPhone}
                    </p>
                  </div>
                )}
                {order.customerAddress && (
                  <div>
                    <span className="text-sm text-gray-400">Endereço:</span>
                    <p className="font-medium text-white">
                      {order.customerAddress}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Informações do pagamento */}
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <CreditCard className="h-5 w-5" />
                Informações do Pagamento
              </h2>

              <div className="space-y-3">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Status:</span>
                      <span className="font-medium text-white">
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Valor:</span>
                      <span className="font-medium text-[var(--text-price)]">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    {payment.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Pago em:</span>
                        <span className="font-medium text-white">
                          {formatDate(payment.paidAt)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                <Package className="h-5 w-5" />
                Produtos do Pedido
              </h2>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg bg-gray-800/50 p-4"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                      <img
                        src={item.productImage || "/placeholder-product.jpg"}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Quantidade: {item.quantity}
                      </p>
                      <p className="text-sm text-gray-400">
                        Preço unitário: {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-[var(--text-price)]">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo do pedido */}
              <div className="mt-6 border-t border-gray-700 pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total:</span>
                    <span className="text-[var(--text-price)]">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motivo do cancelamento */}
        {order.cancelReason && (
          <div className="mt-8 rounded-lg bg-red-500/10 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-400">
              <XCircle className="h-5 w-5" />
              Motivo do Cancelamento
            </h3>
            <p className="text-red-300">{order.cancelReason}</p>
            {order.cancelledAt && (
              <p className="mt-2 text-sm text-red-400">
                Cancelado em: {formatDate(order.cancelledAt)}
              </p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="mt-8 flex flex-col gap-4 text-[var(--text-primary)] sm:flex-row sm:justify-center">
          <Link href={`/${slug}/pedido`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Receipt className="mr-2 h-4 w-4" />
              Voltar aos Pedidos
            </Button>
          </Link>

          <Link href={`/${slug}`}>
            <Button className="w-full bg-[var(--button-primary)] text-[var(--text-primary)] hover:bg-[var(--text-price-secondary)] sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
