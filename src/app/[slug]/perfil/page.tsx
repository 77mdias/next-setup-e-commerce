"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useParams } from "next/navigation";
import { User, Mail, Shield, Calendar } from "lucide-react";

export default function PerfilPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const params = useParams();
  const slug = params.slug as string;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-[var(--text-price)]"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-white">
            Acesso não autorizado
          </h1>
          <p className="text-gray-400">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "SELLER":
        return "Vendedor";
      case "CUSTOMER":
        return "Cliente";
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--all-black)] py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="rounded-lg bg-[var(--card-product)] p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--button-primary)]">
              <User className="h-12 w-12 text-white" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">Meu Perfil</h1>
            <p className="text-gray-400">Gerencie suas informações pessoais</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-4 rounded-lg bg-[var(--all-black)] p-4">
              <User className="h-5 w-5 text-[var(--text-price)]" />
              <div>
                <label className="text-sm text-gray-400">Nome</label>
                <p className="font-medium text-white">
                  {user.name || "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rounded-lg bg-[var(--all-black)] p-4">
              <Mail className="h-5 w-5 text-[var(--text-price)]" />
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <p className="font-medium text-white">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rounded-lg bg-[var(--all-black)] p-4">
              <Shield className="h-5 w-5 text-[var(--text-price)]" />
              <div>
                <label className="text-sm text-gray-400">Tipo de Conta</label>
                <p className="font-medium text-white">
                  {getRoleLabel(user.role)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 rounded-lg bg-[var(--all-black)] p-4">
              <Calendar className="h-5 w-5 text-[var(--text-price)]" />
              <div>
                <label className="text-sm text-gray-400">ID do Usuário</label>
                <p className="text-xs font-medium text-white">{user.id}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <Button
              variant="outline"
              className="w-full border-gray-600 bg-transparent text-white hover:bg-gray-700"
              disabled
            >
              Editar Perfil (Em breve)
            </Button>

            <Button
              onClick={() => {
                signOut({
                  callbackUrl: `/${slug}`,
                  redirect: true,
                });
              }}
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
