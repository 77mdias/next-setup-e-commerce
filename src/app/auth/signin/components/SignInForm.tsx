"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Mail, Eye, EyeOff } from "lucide-react";
import ButtonLogin from "./ButtonLogin";
import { useNotification } from "@/components/ui/notification";
import { Alert } from "@/components/ui/alert";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthError, setOauthError] = useState<string | null>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { showNotification, NotificationContainer } = useNotification();
  const callbackUrl =
    searchParams.get("callbackUrl") || (slug ? `/${slug}` : "/");

  // Verificar se há erro na URL e mostrar alerta
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthAccountNotLinked") {
      setOauthError("OAuthAccountNotLinked");
      // Limpar a URL removendo o parâmetro de erro
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Salvar email no localStorage para uso posterior
    if (email) {
      localStorage.setItem("lastAttemptedEmail", email);
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EmailNotVerified") {
          setError(
            "Email não verificado. Verifique sua caixa de entrada e clique no link de verificação.",
          );
        } else {
          setError("Email ou senha inválidos");
        }
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseOAuthError = () => {
    setOauthError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Faça login na sua conta
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Ou{" "}
            <Link
              href={`/auth/signup${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="font-medium text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
            >
              crie uma nova conta
            </Link>
          </p>
        </div>

        {/* Alerta de erro OAuth */}
        {oauthError === "OAuthAccountNotLinked" && (
          <Alert
            type="warning"
            title="Email já cadastrado"
            message="Este email já está cadastrado em nossa plataforma. Para sua segurança, você precisa fazer login usando o método original de cadastro."
            onClose={handleCloseOAuthError}
            actions={[
              {
                label: "Fazer login com senha",
                onClick: () => setOauthError(null),
                variant: "default",
              },
              {
                label: "Criar nova conta",
                onClick: () => router.push("/auth/signup"),
                variant: "outline",
              },
            ]}
          />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
              {error.includes("Email não verificado") && (
                <div className="mt-2">
                  <Link
                    href="/auth/verify-email"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Reenviar email de verificação
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-600 bg-[var(--card-product)] text-white placeholder-gray-400"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-600 bg-[var(--card-product)] pr-10 text-white placeholder-gray-400"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href={`/auth/reset-password${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-sm text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <ButtonLogin isLoading={isLoading} />
        </form>
      </div>

      <NotificationContainer />
    </div>
  );
}
