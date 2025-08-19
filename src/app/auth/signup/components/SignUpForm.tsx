"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Mail, Eye, EyeOff } from "lucide-react";

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    cpf: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const callbackUrl =
    searchParams.get("callbackUrl") || (slug ? `/${slug}` : "/");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return false;
    }
    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          cpf: formData.cpf,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao criar conta");
        return;
      }

      // Fazer login automático após registro
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Conta criada, mas erro ao fazer login. Tente fazer login manualmente.",
        );
      } else {
        router.push(callbackUrl);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)] px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">Crie sua conta</h2>
          <p className="mt-2 text-sm text-gray-400">
            Ou{" "}
            <Link
              href={`/auth/signin${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="font-medium text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
            >
              faça login em sua conta existente
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Nome completo
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Nome completo"
                value={formData.name}
                onChange={handleChange}
                className="border-gray-600 bg-[var(--card-product)] text-white placeholder-gray-400"
              />
            </div>

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
                value={formData.email}
                onChange={handleChange}
                className="border-gray-600 bg-[var(--card-product)] text-white placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="sr-only">
                CPF
              </label>
              <Input
                id="cpf"
                name="cpf"
                type="text"
                autoComplete="cpf"
                required
                placeholder="CPF"
                value={formData.cpf}
                onChange={handleChange}
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
                autoComplete="new-password"
                required
                placeholder="Senha (mín. 6 caracteres)"
                value={formData.password}
                onChange={handleChange}
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

            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmar senha
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="Confirmar senha"
                value={formData.confirmPassword}
                onChange={handleChange}
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
            className="w-full bg-[var(--button-primary)] text-white hover:bg-[var(--text-price-secondary)]"
          >
            {isLoading ? "Criando conta..." : "Criar conta"}
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
                className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthSignIn("google")}
                className="w-full border-gray-600 bg-[var(--card-product)] text-white hover:bg-gray-700"
              >
                <Mail className="mr-2 h-4 w-4" />
                Google
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
