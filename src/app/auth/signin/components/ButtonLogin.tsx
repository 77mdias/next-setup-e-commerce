"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Github, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { normalizeCallbackPath } from "@/lib/callback-url";

const ButtonLogin = ({ isLoading }: { isLoading: boolean }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);

  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));

  const handleOAuthSignIn = async (provider: string) => {
    setIsOAuthLoading(provider);

    try {
      const result = await signIn(provider, {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        router.push(
          `/auth/error?error=${result.error}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
        return;
      }

      if (result?.url) {
        router.push(result.url);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      router.push(
        `/auth/error?error=OAuthSignin&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
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
    </>
  );
};

export default ButtonLogin;
