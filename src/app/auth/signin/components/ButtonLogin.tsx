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

  // Debug: verificar os parâmetros
  console.log("ButtonLogin - params:", params);
  console.log("ButtonLogin - params type:", typeof params);
  console.log("ButtonLogin - params keys:", Object.keys(params || {}));

  // Extrair slug de forma segura
  const slug =
    typeof params === "object" && params !== null && "slug" in params
      ? (params as any).slug
      : undefined;
  console.log("ButtonLogin - slug extraído:", slug);

  // Extrair slug do callbackUrl se disponível
  const callbackUrlParam = searchParams.get("callbackUrl");
  console.log("ButtonLogin - callbackUrl da URL:", callbackUrlParam);

  // Tentar extrair slug do callbackUrl (ex: "/nextstore" -> "nextstore")
  let slugFromCallback: string | undefined;
  if (callbackUrlParam) {
    try {
      const decodedCallback = decodeURIComponent(callbackUrlParam);
      console.log("ButtonLogin - callbackUrl decodificado:", decodedCallback);

      // Remover a barra inicial se existir
      const cleanCallback = decodedCallback.startsWith("/")
        ? decodedCallback.slice(1)
        : decodedCallback;

      // Se não for uma URL completa (não tem http/https), é provavelmente um slug
      if (!cleanCallback.includes("http") && !cleanCallback.includes("://")) {
        slugFromCallback = cleanCallback;
        console.log(
          "ButtonLogin - slug extraído do callbackUrl:",
          slugFromCallback,
        );
      }
    } catch (error) {
      console.error("Erro ao decodificar callbackUrl:", error);
    }
  }

  // Priorizar slug do callbackUrl, depois do params, depois da URL atual
  const urlSlug = slugFromCallback || slug;
  console.log("ButtonLogin - urlSlug final:", urlSlug);

  const { showNotification, NotificationContainer } = useNotification();
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

  // Prioriza callbackUrl da URL, depois slug, depois home
  const callbackUrl =
    searchParams.get("callbackUrl") || (urlSlug ? `/${urlSlug}` : "/");

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(provider);

    // Salvar o slug da loja atual para uso na página de erro
    if (urlSlug) {
      localStorage.setItem("currentStoreSlug", urlSlug);
      sessionStorage.setItem("currentStoreSlug", urlSlug);
      console.log("Slug da loja salvo:", urlSlug);
    } else {
      console.log("Nenhum slug encontrado para salvar");
    }

    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (
        result?.error === "OAuthAccountNotLinked" ||
        result?.error === "AccessDenied"
      ) {
        console.log("Erro OAuth detectado, redirecionando para página de erro");

        // Salvar informações detalhadas no localStorage para uso na página de erro
        localStorage.setItem("lastOAuthProvider", provider);
        localStorage.setItem(
          "oauthErrorDetails",
          JSON.stringify({
            error: "OAuthAccountNotLinked",
            attemptedProvider: provider,
            timestamp: new Date().toISOString(),
          }),
        );

        // Tentar obter o email do resultado ou usar um placeholder
        const email =
          result?.url?.split("email=")[1]?.split("&")[0] || "teste@exemplo.com";
        localStorage.setItem("lastAttemptedEmail", email);
        console.log("Email salvo no localStorage:", email);

        // Redirecionar diretamente para a página de erro com callbackUrl
        router.push(
          `/auth/error?error=${result.error}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
      } else if (result?.error) {
        // Para qualquer outro erro, também redirecionar para a página de erro com callbackUrl
        router.push(
          `/auth/error?error=${result.error}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
      }
    } catch (error) {
      // Redirecionar para página de erro genérica
      router.push("/auth/error?error=OAuthSignin");
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
