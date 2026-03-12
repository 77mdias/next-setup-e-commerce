"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { normalizeCallbackPath } from "@/lib/callback-url";

const errors = {
  Signin: "Tente fazer login com uma conta diferente.",
  OAuthSignin: "Tente fazer login com uma conta diferente.",
  OAuthCallback: "Tente fazer login com uma conta diferente.",
  OAuthCreateAccount: "Tente fazer login com uma conta diferente.",
  EmailCreateAccount: "Tente fazer login com uma conta diferente.",
  Callback: "Tente fazer login com uma conta diferente.",
  AccessDenied: {
    title: "Email já cadastrado",
    message:
      "Este email já está cadastrado em nossa plataforma com um método diferente de autenticação.",
  },
  OAuthAccountNotLinked: {
    title: "Email já cadastrado",
    message:
      "Este email já está cadastrado em nossa plataforma com um método diferente de autenticação.",
  },
  EmailSignin: "Verifique seu endereço de email.",
  CredentialsSignin:
    "Falha no login. Verifique se os detalhes que você forneceu estão corretos.",
  default: "Não foi possível fazer login.",
};

const OAUTH_LINK_NEUTRAL_DETAILS = [
  "Use o método de autenticação originalmente utilizado no cadastro.",
  "Se a conta foi criada com email e senha, faça login com email e senha.",
  "Se a conta foi criada com OAuth, use o mesmo provedor do cadastro inicial.",
];

export default function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get("error") as keyof typeof errors;
  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));
  const errorData = errors[error] || errors.default;
  const isOAuthLinkError =
    error === "OAuthAccountNotLinked" || error === "AccessDenied";

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isOAuthLinkError) {
      return;
    }

    setShowModal(true);
  }, [isOAuthLinkError]);

  const handleTryAgain = () => {
    setShowModal(false);
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const handleGoHome = () => {
    setShowModal(false);
    router.push("/");
  };

  const getModalMessage = () => {
    return typeof errorData === "object" ? errorData.message : errors.default;
  };

  const getModalDetails = () => {
    return OAUTH_LINK_NEUTRAL_DETAILS;
  };

  if (isOAuthLinkError) {
    const title =
      typeof errorData === "object" ? errorData.title : "Erro de autenticação";

    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-white">{title}</h2>
          <p className="mb-8 text-gray-400">
            Clique abaixo para ver instruções e tentar novamente.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
          >
            Ver detalhes
          </Button>
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type="warning"
          title={title}
          message={getModalMessage()}
          details={getModalDetails()}
          actions={[
            {
              label: "Tentar novamente",
              onClick: handleTryAgain,
              variant: "default",
            },
            {
              label: "Voltar ao início",
              onClick: handleGoHome,
              variant: "outline",
            },
          ]}
        />
      </div>
    );
  }

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
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            >
              Tentar novamente
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full border-gray-600 bg-transparent text-white hover:bg-gray-700"
          >
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
