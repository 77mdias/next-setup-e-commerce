"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function resolveLegacyBasePath(slug?: string) {
  if (!slug) {
    return "";
  }

  return slug.startsWith("/") ? slug : `/${slug}`;
}

export default function AuthButton({ slug }: { slug?: string }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const legacyBasePath = resolveLegacyBasePath(slug);
  const profilePath = legacyBasePath ? `${legacyBasePath}/perfil` : "/perfil";
  const authCallbackPath = legacyBasePath || "/products";

  if (isLoading) {
    return <div className="h-6 w-6 animate-pulse rounded bg-gray-600"></div>;
  }

  // Se o usuário estiver autenticado e tiver um usuário, exibe o botão de perfil e o botão de logout
  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(profilePath)}
          className="cursor-pointer p-2 text-white hover:bg-gray-700"
        >
          <User className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            signOut({
              callbackUrl: authCallbackPath,
              redirect: true,
            });
          }}
          className="cursor-pointer p-2 text-white hover:bg-gray-700"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Se o usuário não estiver autenticado, exibe o botão de login
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        const currentPath = authCallbackPath;
        const signInUrl = `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`;
        router.push(signInUrl);
      }}
      className="cursor-pointer p-2 text-white hover:bg-gray-700"
    >
      <LogIn className="h-5 w-5" />
    </Button>
  );
}
