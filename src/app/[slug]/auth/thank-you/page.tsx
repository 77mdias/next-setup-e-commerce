"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [hasResent, setHasResent] = useState(false);

  const emailParam = searchParams.get("email");
  const verified = searchParams.get("verified") === "true";
  const slug = params.slug as string;

  // Criar callbackUrl baseado no slug atual
  const callbackUrl = slug ? `/${slug}` : null;

  // Preencher email se fornecido na URL
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const resendVerificationEmail = async () => {
    if (!email) {
      toast.error("Digite seu email");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email de verificação reenviado!");
        setHasResent(true);
      } else {
        toast.error(data.message || "Erro ao reenviar email");
      }
    } catch (error) {
      toast.error("Erro ao reenviar email");
    } finally {
      setIsResending(false);
    }
  };

  const goToLogin = () => {
    const currentPath = `/${slug}`;
    const loginUrl = `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`;
    router.push(loginUrl);
  };

  return (
    <div className="flex justify-center bg-[var(--all-black)] px-4 py-8">
      <Card className="w-full max-w-md border-gray-600 bg-[var(--card-product)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <CardTitle className="text-center text-2xl text-white">
            {verified
              ? "Email Verificado com Sucesso!"
              : "Conta Criada com Sucesso!"}
          </CardTitle>
          <CardDescription className="mt-2 text-center text-gray-400">
            {verified
              ? "Sua conta foi ativada! Agora você pode fazer login e começar a usar nossa plataforma."
              : "Obrigado por se cadastrar em nossa plataforma. Para começar a usar sua conta, verifique seu email."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informações sobre o email */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-400">
                  Email de verificação enviado
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Verifique sua caixa de entrada e spam
                </p>
              </div>
            </div>
          </div>

          {/* Email do usuário */}
          {email && (
            <div className="text-center">
              <p className="text-sm text-gray-400">Email:</p>
              <p className="font-medium text-white">{email}</p>
            </div>
          )}

          {/* Instruções */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-white">Próximos passos:</h4>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  1
                </span>
                <span>Abra o email que enviamos para você</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  2
                </span>
                <span>Clique no botão "Verificar Email"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                  3
                </span>
                <span>Faça login e comece a usar sua conta</span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="space-y-3">
            <Button
              onClick={resendVerificationEmail}
              disabled={isResending || hasResent}
              className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
            >
              {isResending
                ? "Reenviando..."
                : hasResent
                  ? "Email Reenviado ✓"
                  : "Reenviar Email"}
            </Button>

            <Button
              onClick={goToLogin}
              variant="outline"
              className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
            >
              Ir para Login
            </Button>
          </div>

          {/* Link para voltar */}
          <div className="text-center">
            <Link
              href={slug ? `/${slug}` : "/"}
              className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
