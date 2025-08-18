"use client";

import { useState } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Mail, Eye, EyeOff } from "lucide-react";
import ButtonLogin from "./components/ButtonLogin";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const router = useRouter();
  const callbackUrl =
    searchParams.get("callbackUrl") || (slug ? `/${slug}` : "/");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
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
              href="/auth/forgot-password"
              className="text-sm text-[var(--text-price)] hover:text-[var(--text-price-secondary)]"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <ButtonLogin isLoading={isLoading} />
        </form>
      </div>
    </div>
  );
}
