"use client";

import { Button } from "@/components/ui/button";
import { Github, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";

const ButtonLogin = ({ isLoading }: { isLoading: boolean }) => {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  // Prioriza callbackUrl da URL, depois slug, depois home
  const callbackUrl =
    searchParams.get("callbackUrl") || (slug ? `/${slug}` : "/");

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl });
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
    </>
  );
};

export default ButtonLogin;
