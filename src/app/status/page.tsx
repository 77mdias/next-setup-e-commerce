import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  type LucideIcon,
  AlertTriangle,
  Code2,
  Home,
  Lock,
  LogIn,
  ServerCrash,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";
import { normalizeCallbackPath } from "@/lib/callback-url";
import {
  AccessFeedbackReason,
  normalizeAccessFeedbackReason,
} from "@/lib/access-feedback";
import { PageSearchParams } from "@/lib/search-params";

type StatusPageProps = {
  searchParams?: Promise<PageSearchParams>;
};

type StatusContent = {
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

type AuthFeature = {
  icon: LucideIcon;
  iconClassName: string;
  iconWrapClassName: string;
  label: string;
};

const authFeatures: AuthFeature[] = [
  {
    icon: ShieldCheck,
    iconClassName: "text-[#59627a]",
    iconWrapClassName: "bg-[#59627a]/10",
    label: "Conta Segura",
  },
  {
    icon: Zap,
    iconClassName: "text-[#916130]",
    iconWrapClassName: "bg-[#916130]/10",
    label: "Acesso Rápido",
  },
  {
    icon: Shield,
    iconClassName: "text-[#00C950]",
    iconWrapClassName: "bg-[#00C950]/10",
    label: "Dados Protegidos",
  },
];

const statusByReason: Record<AccessFeedbackReason, StatusContent> = {
  "auth-required": {
    badge: "ACESSO RESTRITO",
    title: "Esta área requer login",
    description:
      "Faça login para continuar. Algumas páginas e funcionalidades só ficam disponíveis para usuários autenticados.",
    icon: Lock,
  },
  forbidden: {
    badge: "SEM PERMISSÃO",
    title: "Você não tem permissão para acessar esta área",
    description:
      "Seu usuário está autenticado, mas não possui o nível de acesso necessário para esta rota.",
    icon: ShieldAlert,
  },
  maintenance: {
    badge: "MANUTENÇÃO",
    title: "Serviço temporariamente em manutenção",
    description:
      "Estamos aplicando melhorias. Tente novamente em alguns minutos.",
    icon: AlertTriangle,
  },
  outage: {
    badge: "INDISPONÍVEL",
    title: "Serviço fora do ar no momento",
    description:
      "Detectamos uma indisponibilidade temporária. Nossa equipe já está tratando.",
    icon: ServerCrash,
  },
  development: {
    badge: "EM DESENVOLVIMENTO",
    title: "Funcionalidade em desenvolvimento",
    description:
      "Esta área ainda não está pronta para uso. Em breve ela será liberada.",
    icon: Code2,
  },
  unavailable: {
    badge: "INDISPONÍVEL",
    title: "Acesso indisponível",
    description:
      "Esta rota está temporariamente indisponível. Tente novamente em instantes.",
    icon: AlertTriangle,
  },
};

function getFirstSearchParam(
  searchParams: PageSearchParams,
  key: string,
): string | null {
  const value = searchParams[key];

  if (typeof value === "undefined") {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getProtectedAreaLabel(path?: string | null): string {
  if (!path) {
    return "esta área";
  }

  const normalizedPath = path.toLowerCase();

  if (normalizedPath.includes("/perfil")) {
    return "Seu Perfil";
  }

  if (
    normalizedPath.includes("/orders") ||
    normalizedPath.includes("/pedido")
  ) {
    return "Seus Pedidos";
  }

  if (normalizedPath.includes("/wishlist")) {
    return "Sua Wishlist";
  }

  if (normalizedPath.includes("/checkout")) {
    return "Seu Checkout";
  }

  if (normalizedPath.includes("/carrinho")) {
    return "Seu Carrinho";
  }

  return "esta área";
}

export const dynamic = "force-dynamic";

export default async function StatusPage({ searchParams }: StatusPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.id;

  const reason = normalizeAccessFeedbackReason(
    getFirstSearchParam(resolvedSearchParams, "reason"),
  );
  const statusContent = statusByReason[reason];
  const Icon = statusContent.icon;

  const callbackUrl = normalizeCallbackPath(
    getFirstSearchParam(resolvedSearchParams, "callbackUrl"),
    "/",
  );
  const fromPath = getFirstSearchParam(resolvedSearchParams, "from");
  const safeFromPath = fromPath?.startsWith("/") ? fromPath : null;
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const signUpHref = `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const retryHref = safeFromPath ?? callbackUrl;

  if (reason === "auth-required") {
    const areaLabel = getProtectedAreaLabel(safeFromPath ?? callbackUrl);

    return (
      <main className="relative isolate flex min-h-[calc(100vh-5rem)] items-center justify-center overflow-hidden bg-[#11100d] px-4 py-10 sm:px-6 sm:py-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-[42%] h-[388px] w-[388px] -translate-y-1/2 rounded-full bg-[#916130]/20 blur-[240px]" />
          <div className="absolute top-1/2 left-[54%] h-[388px] w-[388px] -translate-y-1/2 rounded-full bg-[#59627a]/22 blur-[240px]" />
        </div>

        <section className="relative w-full max-w-[672px] rounded-[24px] border border-white/10 bg-[#1b1712] px-6 py-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] sm:px-[49px] sm:py-[49px]">
          <div className="mx-auto flex h-24 w-24 items-center justify-center">
            <Image
              alt=""
              aria-hidden="true"
              className="h-24 w-24"
              height={120}
              priority
              src="/images/status/auth-required-badge.svg"
              width={120}
            />
          </div>

          <h1 className="mt-6 text-center [font-family:var(--font-space-grotesk)] text-3xl leading-[1.111] font-bold text-[#f2eee8] sm:text-4xl">
            Autenticação Necessária
          </h1>

          <div className="mt-4 text-center">
            <p className="[font-family:var(--font-arimo)] text-lg leading-[1.556] text-[#9CA3AF]">
              Você precisa estar conectado para acessar {areaLabel}
            </p>
            <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-[1.429] text-[#9f9383]">
              Gerencie suas informações pessoais, endereços e configurações de
              segurança.
            </p>
          </div>

          <div className="mt-8 grid gap-5 rounded-2xl border border-white/5 bg-[#17140f] p-[25px] sm:grid-cols-3">
            {authFeatures.map((feature) => {
              const FeatureIcon = feature.icon;

              return (
                <div key={feature.label} className="text-center">
                  <span
                    className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-xl ${feature.iconWrapClassName}`}
                  >
                    <FeatureIcon
                      className={`h-5 w-5 ${feature.iconClassName}`}
                    />
                  </span>

                  <p className="mt-2 [font-family:var(--font-arimo)] text-xs leading-[1.333] font-medium text-[#b8ad9f]">
                    {feature.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {isAuthenticated ? (
              <Button
                asChild
                className="h-14 rounded-2xl bg-[#916130] [font-family:var(--font-arimo)] text-lg font-medium text-white hover:bg-[#7b5429]"
              >
                <Link href={retryHref}>Tentar novamente</Link>
              </Button>
            ) : (
              <Button
                asChild
                className="h-14 rounded-2xl bg-[#916130] [font-family:var(--font-arimo)] text-lg font-medium text-white hover:bg-[#7b5429]"
              >
                <Link href={signInHref}>
                  <LogIn className="h-5 w-5" />
                  Fazer Login
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              className="h-14 rounded-2xl border-white/10 bg-transparent [font-family:var(--font-arimo)] text-lg font-medium text-[#f2eee8] hover:bg-white/5"
            >
              {isAuthenticated ? (
                <Link href="/">
                  <Home className="h-5 w-5" />
                  Voltar ao Início
                </Link>
              ) : (
                <Link href={signUpHref}>
                  <UserPlus className="h-5 w-5" />
                  Criar Conta
                </Link>
              )}
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border border-[#FE9A00]/20 bg-[#FE9A00]/5 px-4 py-4 sm:px-[17px] sm:py-[17px]">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#FE9A00]" />

              <div>
                <p className="[font-family:var(--font-arimo)] text-sm leading-[1.429] font-medium text-[#f2eee8]">
                  Primeira vez aqui?
                </p>

                <p className="mt-1 [font-family:var(--font-arimo)] text-sm leading-[1.429] text-[#9f9383]">
                  Crie sua conta em menos de 1 minuto e aproveite todos os
                  benefícios da nossa plataforma.
                </p>
              </div>
            </div>
          </div>

          {safeFromPath && (
            <p className="mt-4 text-center [font-family:var(--font-arimo)] text-xs text-[#9f9383]">
              Rota solicitada: {safeFromPath}
            </p>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#f4efe5] px-4 py-10 dark:bg-[#11100d]">
      <section className="w-full max-w-[640px] rounded-2xl border border-[#d8cfbf] bg-white p-8 sm:p-10 dark:border-white/10 dark:bg-[#1b1712]">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#f8f4ec] text-[#916130] dark:bg-[#17140f]">
          <Icon className="h-6 w-6" />
        </div>

        <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.14em] text-[#655a4e] uppercase dark:text-[#b8ad9f]">
          {statusContent.badge}
        </p>
        <h1 className="mt-3 [font-family:var(--font-space-grotesk)] text-3xl font-bold tracking-[-0.02em] text-[#11100d] dark:text-[#f2eee8]">
          {statusContent.title}
        </h1>
        <p className="mt-3 [font-family:var(--font-arimo)] text-base text-[#4f463c] dark:text-[#b8ad9f]">
          {statusContent.description}
        </p>

        {safeFromPath && (
          <p className="mt-4 [font-family:var(--font-arimo)] text-xs text-[#655a4e] dark:text-[#9f9383]">
            Rota solicitada: {safeFromPath}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="h-10 rounded-xl bg-[#916130] [font-family:var(--font-arimo)] text-sm text-white hover:bg-[#7b5429]"
          >
            <Link href={callbackUrl}>Tentar novamente</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-[#d8cfbf] bg-transparent [font-family:var(--font-arimo)] text-sm text-[#11100d] hover:bg-[#f8f4ec] dark:border-white/15 dark:text-[#f2eee8] dark:hover:bg-white/5"
          >
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
