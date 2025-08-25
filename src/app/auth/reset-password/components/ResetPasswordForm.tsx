"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useNotification } from "@/components/ui/notification";
import { Alert } from "@/components/ui/alert";

export default function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");

  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { showNotification, NotificationContainer } = useNotification();

  const callbackUrl =
    searchParams.get("callbackUrl") || (slug ? `/${slug}` : "/");
  const tokenParam = searchParams.get("token");

  // Verificar se há token na URL
  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validações
    if (!email) {
      setError("Email é obrigatório");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
          token: token || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao redefinir senha");
      } else {
        setSuccess(true);
        showNotification({
          type: "general",
          title: "Senha redefinida com sucesso!",
          message: "Você pode fazer login com sua nova senha.",
        });

        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push(
            `/auth/signin${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`,
          );
        }, 3000);
      }
    } catch (error) {
      setError("Erro ao redefinir senha. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email) {
      setError("Email é obrigatório");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          callbackUrl: callbackUrl !== "/" ? callbackUrl : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao enviar email de reset");
      } else {
        showNotification({
          type: "general",
          title: "Email enviado!",
          message: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      }
    } catch (error) {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Se não há token, mostrar formulário para solicitar reset
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--text-price)]">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Esqueceu sua senha?
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

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
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-600 bg-[var(--card-product)] text-white placeholder-gray-400"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--text-price)] text-white hover:bg-[var(--text-price-secondary)] disabled:opacity-50"
            >
              {isLoading ? "Enviando..." : "Enviar link de reset"}
            </Button>

            <div className="text-center">
              <Link
                href={`/auth/signin${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="flex items-center justify-center text-sm text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>

        <NotificationContainer />
      </div>
    );
  }

  // Se há token, mostrar formulário para definir nova senha
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--text-price)]">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Redefinir senha
          </h2>
          <p className="mt-2 text-sm text-gray-400">Digite sua nova senha</p>
        </div>

        {success ? (
          <div className="space-y-6">
            <Alert
              type="success"
              title="Senha redefinida com sucesso!"
              message="Você será redirecionado para a página de login em alguns segundos."
            />
            <div className="text-center">
              <Link
                href={`/auth/signin${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
              >
                Ir para o login agora
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
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
                <label htmlFor="newPassword" className="sr-only">
                  Nova senha
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="border-gray-600 bg-[var(--card-product)] pr-10 text-white placeholder-gray-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="relative">
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirmar nova senha
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder="Confirmar nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-gray-600 bg-[var(--card-product)] pr-10 text-white placeholder-gray-400"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--text-price)] text-white hover:bg-[var(--text-price-secondary)] disabled:opacity-50"
            >
              {isLoading ? "Redefinindo..." : "Redefinir senha"}
            </Button>

            <div className="text-center">
              <Link
                href={`/auth/signin${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
                className="flex items-center justify-center text-sm text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>

      <NotificationContainer />
    </div>
  );
}
