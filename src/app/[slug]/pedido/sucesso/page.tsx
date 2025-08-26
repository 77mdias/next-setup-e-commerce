"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import { CheckCircle, Package, Truck, Home, Receipt } from "lucide-react";
import Link from "next/link";
import ButtonBack from "@/components/ui/ButtonBack";

interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  total: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productImage: string;
  }>;
  store: {
    name: string;
    slug: string;
  };
}

export default function PedidoSucessoPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(
        `/auth/signin?callbackUrl=/${slug}/pedido/sucesso?session_id=${sessionId}`,
      );
    }
  }, [isAuthenticated, router, slug, sessionId]);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setError("ID da sessão não encontrado");
        setIsLoading(false);
        return;
      }

      try {
        // Buscar detalhes do pedido pela sessão do Stripe
        const response = await fetch(`/api/orders/session/${sessionId}`);

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

    if (isAuthenticated) {
      fetchOrderDetails();
    }
  }, [sessionId, isAuthenticated]);

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
              Erro ao carregar pedido
            </h1>
            <p className="mb-6 text-gray-400">
              {error || "Não foi possível carregar os detalhes do pedido"}
            </p>
            <Link href={`/${slug}`}>
              <Button className="bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]">
                Voltar para a Loja
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-8">
          <ButtonBack />
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Pedido Confirmado!
            </h1>
            <p className="text-gray-400">
              Seu pagamento foi processado com sucesso
            </p>
          </div>
        </div>

        {/* Informações do pedido */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Detalhes do pedido */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Receipt className="h-5 w-5" />
                Detalhes do Pedido
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Número do Pedido:</span>
                  <span className="font-mono text-white">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="font-medium text-green-400">
                    {order.paymentStatus === "PAID" ? "Pago" : "Processando"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Data:</span>
                  <span className="text-white">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-lg font-bold text-[var(--text-price)]">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações do cliente */}
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Informações do Cliente
              </h2>

              <div className="space-y-3">
                <div>
                  <span className="text-gray-400">Nome:</span>
                  <p className="text-white">{order.customerName}</p>
                </div>
                <div>
                  <span className="text-gray-400">Email:</span>
                  <p className="text-white">{order.customerEmail}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Package className="h-5 w-5" />
                Produtos Pedidos
              </h2>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg bg-gray-800/50 p-3"
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                      <img
                        src={item.productImage || "/placeholder-product.jpg"}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-white">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Qtd: {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-[var(--text-price)]">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos passos */}
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Truck className="h-5 w-5" />
                Próximos Passos
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                    <span className="text-xs font-bold text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Confirmação</p>
                    <p className="text-gray-400">
                      Seu pedido foi confirmado e está sendo processado
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                    <span className="text-xs font-bold text-yellow-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Preparação</p>
                    <p className="text-gray-400">
                      Seus produtos estão sendo preparados para envio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20">
                    <span className="text-xs font-bold text-green-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Entrega</p>
                    <p className="text-gray-400">
                      Você receberá atualizações sobre o status da entrega
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-col gap-4 text-[var(--text-primary)] sm:flex-row sm:justify-center">
          <Link href={`/${slug}`}>
            <Button className="w-full bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)] sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Button>
          </Link>

          <Link href={`/${slug}/pedido`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Receipt className="mr-2 h-4 w-4" />
              Meus Pedidos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
