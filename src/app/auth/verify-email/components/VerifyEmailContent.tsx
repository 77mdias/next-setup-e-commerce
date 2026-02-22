"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeCallbackPath } from "@/lib/callback-url";

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);

  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const getThankYouUrl = () =>
    `/auth/thank-you?verified=true&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(
        `/api/auth/verify-email?token=${verificationToken}`,
      );
      const data = await response.json();

      if (response.ok) {
        setVerificationStatus("success");
        toast.success("Email verificado com sucesso!");
        setTimeout(() => {
          router.push(getThankYouUrl());
        }, 3000);
      } else {
        setVerificationStatus("error");
        toast.error(data.message || "Erro ao verificar email");
      }
    } catch {
      setVerificationStatus("error");
      toast.error("Erro ao verificar email");
    } finally {
      setIsVerifying(false);
    }
  };

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
      } else {
        toast.error(data.message || "Erro ao reenviar email");
      }
    } catch {
      toast.error("Erro ao reenviar email");
    } finally {
      setIsResending(false);
    }
  };

  const goToLogin = () => {
    const loginUrl = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    router.push(loginUrl);
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <Card className="w-full max-w-md border-gray-600 bg-[var(--card-product)]">
          <CardHeader>
            <CardTitle className="text-center text-white">
              Verificando Email
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Aguarde enquanto verificamos seu email...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <Card className="w-full max-w-md border-gray-600 bg-[var(--card-product)]">
          <CardHeader>
            <CardTitle className="text-center text-green-400">
              Email Verificado!
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sua conta foi ativada com sucesso. Você será redirecionado para a
              página de agradecimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => {
                router.push(getThankYouUrl());
              }}
              className="bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
            >
              Ir para Agradecimento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <Card className="w-full max-w-md border-gray-600 bg-[var(--card-product)]">
          <CardHeader>
            <CardTitle className="text-center text-red-400">
              Erro na Verificação
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              O link de verificação é inválido ou expirou. Solicite um novo
              email de verificação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-600 bg-[var(--card-product)] text-white placeholder-gray-400"
              />
            </div>
            <Button
              onClick={resendVerificationEmail}
              disabled={isResending}
              className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
            >
              {isResending ? "Reenviando..." : "Reenviar Email de Verificação"}
            </Button>
            <Button
              variant="outline"
              onClick={goToLogin}
              className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
            >
              Voltar para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
      <Card className="w-full max-w-md border-gray-600 bg-[var(--card-product)]">
        <CardHeader>
          <CardTitle className="text-center text-white">
            Verificação de Email
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Digite seu email para receber um novo link de verificação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-gray-600 bg-[var(--card-product)] text-white placeholder-gray-400"
            />
          </div>
          <Button
            onClick={resendVerificationEmail}
            disabled={isResending}
            className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
          >
            {isResending ? "Reenviando..." : "Reenviar Email de Verificação"}
          </Button>
          <Button
            variant="outline"
            onClick={goToLogin}
            className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
          >
            Voltar para Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
