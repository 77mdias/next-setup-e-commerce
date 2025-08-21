"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const errors = {
  Signin: "Tente fazer login com uma conta diferente.",
  OAuthSignin: "Tente fazer login com uma conta diferente.",
  OAuthCallback: "Tente fazer login com uma conta diferente.",
  OAuthCreateAccount: "Tente fazer login com uma conta diferente.",
  EmailCreateAccount: "Tente fazer login com uma conta diferente.",
  Callback: "Tente fazer login com uma conta diferente.",
  OAuthAccountNotLinked: {
    title: "Email já cadastrado",
    message:
      "Este email já está cadastrado em nossa plataforma. Para sua segurança, você precisa fazer login usando o método original de cadastro.",
    details: [
      "Se você se cadastrou com email e senha, use essas credenciais",
      "Se você se cadastrou com outro provedor (Google/GitHub), use o mesmo",
      "Entre em contato conosco se precisar de ajuda",
    ],
  },
  EmailSignin: "Verifique seu endereço de email.",
  CredentialsSignin:
    "Falha no login. Verifique se os detalhes que você forneceu estão corretos.",
  default: "Não foi possível fazer login.",
};

export default function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get("error") as keyof typeof errors;
  const errorData = errors[error] || errors.default;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Mostrar modal automaticamente para erros importantes
    if (error === "OAuthAccountNotLinked") {
      setShowModal(true);
    }
  }, [error]);

  const handleTryAgain = () => {
    setShowModal(false);
    router.push("/auth/signin");
  };

  const handleGoHome = () => {
    setShowModal(false);
    router.push("/");
  };

  // Se for OAuthAccountNotLinked, mostrar modal elegante
  if (
    error === "OAuthAccountNotLinked" &&
    typeof errorData === "object" &&
    "title" in errorData
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">
            {errorData.title}
          </h2>
          <p className="mb-8 text-gray-400">
            Clique no botão abaixo para ver mais detalhes
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
          >
            Ver Detalhes
          </Button>
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type="warning"
          title={errorData.title}
          message={errorData.message}
          details={errorData.details}
          actions={[
            {
              label: "Tentar Novamente",
              onClick: handleTryAgain,
              variant: "default",
            },
            {
              label: "Voltar ao Início",
              onClick: handleGoHome,
              variant: "outline",
            },
          ]}
        />
      </div>
    );
  }

  // Renderização padrão para outros erros
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
          <p className="mt-2 text-sm text-gray-400">{errorData as string}</p>
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
