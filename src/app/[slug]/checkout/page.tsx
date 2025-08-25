"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/app/[slug]/context/cart";
import { useAuth } from "@/hooks/useAuth";
import { useCheckout } from "@/hooks/useCheckout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/helpers/format-currency";
import { ArrowLeft, CreditCard, User, MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import ButtonBack from "@/components/ui/ButtonBack";

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { products, total, totalQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { createCheckoutSession, isLoading, error } = useCheckout();

  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: String(user?.phone || ""),
    cpf: user?.cpf || "",
  });

  // Redirecionar se não estiver autenticado
  if (!isAuthenticated) {
    router.push(`/auth/signin?callbackUrl=/${slug}/checkout`);
    return null;
  }

  // Redirecionar se carrinho estiver vazio
  if (products.length === 0) {
    router.push(`/${slug}/carrinho`);
    return null;
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Aplicar máscaras
    if (field === "cpf") {
      // Máscara para CPF: 000.000.000-00
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else if (field === "phone") {
      // Máscara para telefone: (00) 00000-0000
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})\d+?$/, "$1");
    }

    setCustomerInfo((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (
      !customerInfo.name ||
      !customerInfo.email ||
      !customerInfo.phone ||
      !customerInfo.cpf
    ) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validação de CPF (formato básico)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(customerInfo.cpf)) {
      alert("Por favor, insira um CPF válido no formato 000.000.000-00");
      return;
    }

    // Validação de telefone (formato básico)
    const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
    if (!phoneRegex.test(customerInfo.phone)) {
      alert("Por favor, insira um telefone válido no formato (11) 99999-9999");
      return;
    }

    try {
      await createCheckoutSession(customerInfo);
    } catch (err) {
      console.error("Erro no checkout:", err);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <ButtonBack />
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-[var(--text-price)]" />
            <h1 className="text-2xl font-bold text-white">Finalizar Compra</h1>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Formulário de checkout */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-white">
                <User className="h-5 w-5" />
                Informações Pessoais
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Nome Completo *
                  </label>
                  <Input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    className="border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Telefone *
                  </label>
                  <Input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    className="border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    CPF *
                  </label>
                  <Input
                    type="text"
                    value={customerInfo.cpf}
                    onChange={(e) => handleInputChange("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Finalizar Compra
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Informações de segurança */}
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <CreditCard className="h-5 w-5" />
                Pagamento Seguro
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>✓ Pagamento processado pelo Stripe</p>
                <p>✓ Dados criptografados e seguros</p>
                <p>✓ Aceitamos todos os principais cartões</p>
                <p>✓ Compra 100% protegida</p>
              </div>
            </div>
          </div>

          {/* Resumo do pedido */}
          <div className="space-y-6">
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">
                Resumo do Pedido
              </h2>

              {/* Lista de produtos */}
              <div className="mb-6 space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 rounded-lg bg-gray-800/50 p-3"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                      <img
                        src={product.images[0] || "/placeholder-product.jpg"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-white">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Qtd: {product.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-[var(--text-price)]">
                        {formatCurrency(product.price * product.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais */}
              <div className="space-y-3 border-t border-gray-600 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    Subtotal ({totalQuantity} itens)
                  </span>
                  <span className="text-white">{formatCurrency(total)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Frete</span>
                  <span className="text-green-400">Grátis</span>
                </div>

                <div className="flex justify-between border-t border-gray-600 pt-3 text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[var(--text-price)]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="rounded-lg bg-[var(--card-product)] p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Informações Importantes
              </h3>
              <div className="space-y-3 text-sm text-gray-400">
                <p>
                  • Seu pedido será processado após a confirmação do pagamento
                </p>
                <p>• Você receberá um email com os detalhes do pedido</p>
                <p>• O prazo de entrega será informado após a confirmação</p>
                <p>• Em caso de dúvidas, entre em contato conosco</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
