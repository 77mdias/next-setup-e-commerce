"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/helpers/format-currency";
import {
  XCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  CreditCard,
  Package,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import ButtonBack from "@/components/ui/ButtonBack";
import { buildAccessFeedbackPath } from "@/lib/access-feedback";

interface Order {
  id: number;
  status: string;
  paymentStatus: string;
  total: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  cancelReason?: string;
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

export default function PedidoFalhaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchOrderDetails();
    } else {
      setError("ID da sessão não encontrado");
      setIsLoading(false);
    }
  }, [sessionId]);

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      const callbackPath = `/${slug}/pedido/falha?session_id=${sessionId ?? ""}`;
      router.push(
        buildAccessFeedbackPath({
          reason: "auth-required",
          callbackUrl: callbackPath,
          fromPath: callbackPath,
        }),
      );
    }
  }, [isAuthenticated, router, slug, sessionId]);

  const fetchOrderDetails = async () => {
    try {
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

  const handleRetryPayment = () => {
    // Redirecionar para o carrinho para tentar novamente
    router.push(`/${slug}/carrinho`);
  };

  const handleContactSupport = () => {
    // Redirecionar para suporte
    router.push(`/${slug}/suporte`);
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
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">
              Erro no Pagamento
            </h1>
            <p className="mb-6 text-gray-400">
              {error || "Ocorreu um erro durante o processamento do pagamento"}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href={`/${slug}`}>
                <Button className="w-full bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)] sm:w-auto">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar para a Loja
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleContactSupport}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Contatar Suporte
              </Button>
            </div>
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white">
              Pagamento Falhou
            </h1>
            <p className="text-gray-400">
              Não foi possível processar seu pagamento
            </p>
          </div>
        </div>

        {/* Informações do pedido */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Detalhes do pedido */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Package className="h-5 w-5" />
                Detalhes do Pedido
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Número do Pedido:</span>
                  <span className="font-mono text-white">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="font-medium text-red-400">
                    {order.status === "CANCELLED" ? "Cancelado" : "Falhou"}
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

            {/* Motivo da falha */}
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <AlertTriangle className="h-5 w-5" />
                Possíveis Motivos
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <span className="text-xs font-bold text-red-400">•</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Cartão recusado</p>
                    <p className="text-gray-400">
                      Verifique se há limite disponível ou se o cartão está
                      ativo
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <span className="text-xs font-bold text-red-400">•</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Dados incorretos</p>
                    <p className="text-gray-400">
                      Confirme se os dados do cartão estão corretos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
                    <span className="text-xs font-bold text-red-400">•</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      Problema temporário
                    </p>
                    <p className="text-gray-400">
                      Pode ser um problema temporário do sistema de pagamento
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                <Package className="h-5 w-5" />
                Produtos do Pedido
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
                <RefreshCw className="h-5 w-5" />O que fazer agora?
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                    <span className="text-xs font-bold text-blue-400">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Verificar dados</p>
                    <p className="text-gray-400">
                      Confirme se os dados do cartão estão corretos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                    <span className="text-xs font-bold text-yellow-400">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Tentar novamente</p>
                    <p className="text-gray-400">
                      Use outro cartão ou método de pagamento
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500/20">
                    <span className="text-xs font-bold text-green-400">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-white">Contatar suporte</p>
                    <p className="text-gray-400">
                      Se o problema persistir, entre em contato conosco
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-8 flex flex-col gap-4 text-[var(--text-primary)] sm:flex-row sm:justify-center">
          <Button
            onClick={handleRetryPayment}
            className="w-full bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)] sm:w-auto"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>

          <Link href={`/${slug}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Voltar para a Loja
            </Button>
          </Link>

          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleContactSupport}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Contatar Suporte
          </Button>
        </div>

        {/* Informações adicionais */}
        <div className="mt-8 rounded-lg bg-[var(--card-product)] p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Precisa de ajuda?
          </h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p>• Seu pedido não foi processado e nenhum valor foi cobrado</p>
            <p>• Você pode tentar novamente a qualquer momento</p>
            <p>• Em caso de dúvidas, entre em contato com nosso suporte</p>
            <p>• Horário de atendimento: Segunda a Sexta, 8h às 18h</p>
          </div>
        </div>
      </div>
    </div>
  );
}
