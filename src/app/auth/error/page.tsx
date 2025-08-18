"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const errors = {
  Signin: "Tente fazer login com uma conta diferente.",
  OAuthSignin: "Tente fazer login com uma conta diferente.",
  OAuthCallback: "Tente fazer login com uma conta diferente.",
  OAuthCreateAccount: "Tente fazer login com uma conta diferente.",
  EmailCreateAccount: "Tente fazer login com uma conta diferente.",
  Callback: "Tente fazer login com uma conta diferente.",
  OAuthAccountNotLinked:
    "Para confirmar sua identidade, faça login com a mesma conta que você usou originalmente.",
  EmailSignin: "Verifique seu endereço de email.",
  CredentialsSignin:
    "Falha no login. Verifique se os detalhes que você forneceu estão corretos.",
  default: "Não foi possível fazer login.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") as keyof typeof errors;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Erro de Autenticação
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {errors[error] || errors.default}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            asChild
            className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
          >
            <Link href="/auth/signin">Tentar Novamente</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-gray-600 bg-transparent text-white hover:bg-gray-700"
          >
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
