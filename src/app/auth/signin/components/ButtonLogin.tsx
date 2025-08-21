"use client";

import { Button } from "@/components/ui/button";
import { Github, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useNotification } from "@/components/ui/notification";
import { useState } from "react";

const ButtonLogin = ({ isLoading }: { isLoading: boolean }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { showNotification, NotificationContainer } = useNotification();
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

  // Prioriza callbackUrl da URL, depois slug, depois home
  const callbackUrl =
    searchParams.get("callbackUrl") || (slug ? `/${slug}` : "/");

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(provider);

    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error === "OAuthAccountNotLinked") {
        showNotification({
          type: "email_exists",
          title: "Email já cadastrado",
          message:
            "Este email já está cadastrado em nossa plataforma. Para sua segurança, você precisa fazer login usando o método original de cadastro.",
          actions: [
            {
              label: "Fazer login com senha",
              onClick: () => router.push("/auth/signin"),
              variant: "default",
            },
            {
              label: "Criar nova conta",
              onClick: () => router.push("/auth/signup"),
              variant: "outline",
            },
          ],
        });
      } else if (result?.error) {
        showNotification({
          type: "oauth_error",
          title: "Erro de autenticação",
          message:
            "Ocorreu um erro durante o processo de login. Tente novamente.",
          actions: [
            {
              label: "Tentar novamente",
              onClick: () => handleOAuthSignIn(provider),
              variant: "default",
            },
          ],
        });
      }
    } catch (error) {
      showNotification({
        type: "oauth_error",
        title: "Erro de conexão",
        message:
          "Não foi possível conectar com o provedor de autenticação. Verifique sua conexão e tente novamente.",
      });
    } finally {
      setIsOAuthLoading(null);
    }
  };

  return (
    <>
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
      >
        {isLoading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[var(--all-black)] px-2 text-gray-400">
              Ou continue com
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn("github")}
            disabled={isOAuthLoading === "github"}
            className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
          >
            <Github className="mr-2 h-4 w-4" />
            {isOAuthLoading === "github" ? "Conectando..." : "GitHub"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleOAuthSignIn("google")}
            disabled={isOAuthLoading === "google"}
            className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
          >
            <Mail className="mr-2 h-4 w-4" />
            {isOAuthLoading === "google" ? "Conectando..." : "Google"}
          </Button>
        </div>
      </div>

      <NotificationContainer />
    </>
  );
};

export default ButtonLogin;
