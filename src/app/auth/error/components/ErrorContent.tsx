"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { normalizeCallbackPath } from "@/lib/callback-url";

async function getUserAuthInfo(email: string) {
  try {
    const response = await fetch(
      `/api/auth/user-info?email=${encodeURIComponent(email)}`,
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error("Erro ao buscar informações do usuário:", error);
  }
  return null;
}

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

function formatProviderName(provider: string) {
  if (provider === "google") {
    return "Google";
  }
  if (provider === "github") {
    return "GitHub";
  }
  return provider;
}

export default function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get("error") as keyof typeof errors;
  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));
  const errorData = errors[error] || errors.default;
  const isOAuthLinkError =
    error === "OAuthAccountNotLinked" || error === "AccessDenied";

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (!isOAuthLinkError) {
      return;
    }

    setShowModal(true);
    const email = searchParams.get("email");
    if (!email) {
      return;
    }

    setLoading(true);
    getUserAuthInfo(email)
      .then((info) => {
        setUserInfo(info);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOAuthLinkError, searchParams]);

  const handleTryAgain = () => {
    setShowModal(false);
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const handleGoHome = () => {
    setShowModal(false);
    router.push("/");
  };

  const getModalMessage = () => {
    if (!userInfo) {
      return typeof errorData === "object" ? errorData.message : errors.default;
    }

    const provider = userInfo.oauthProviders?.[0];
    if (!provider) {
      return typeof errorData === "object" ? errorData.message : errors.default;
    }

    return `Esta conta foi criada com ${formatProviderName(provider)}. Faça login usando o mesmo método para continuar.`;
  };

  const getModalDetails = () => {
    const details: string[] = [];

    if (userInfo?.hasPassword) {
      details.push("Você pode entrar com email e senha.");
    }

    if (userInfo?.oauthProviders?.length) {
      const providers = userInfo.oauthProviders
        .map((provider: string) => formatProviderName(provider))
        .join(" ou ");
      details.push(`Métodos OAuth vinculados: ${providers}.`);
    }

    if (details.length === 0) {
      details.push("Use o método de autenticação original da sua conta.");
    }

    return details;
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
            {loading
              ? "Carregando detalhes da autenticação..."
              : "Clique abaixo para ver instruções e tentar novamente."}
          </p>
          <Button
            onClick={() => setShowModal(true)}
            disabled={loading}
            className="bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)] disabled:opacity-50"
          >
            {loading ? "Carregando..." : "Ver detalhes"}
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
          <h2 className="text-3xl font-bold text-white">Erro de Autenticação</h2>
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
