import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  AlertTriangle,
  Code2,
  Lock,
  ServerCrash,
  ShieldAlert,
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
  icon: typeof AlertTriangle;
};

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

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-[#f5f8ff] px-4 py-10 dark:bg-[#0b0d10]">
      <section className="w-full max-w-[640px] rounded-2xl border border-[#dbe4ff] bg-white p-8 sm:p-10 dark:border-white/10 dark:bg-[#171a21]">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef3ff] text-[#ff2e63] dark:bg-[#12151a]">
          <Icon className="h-6 w-6" />
        </div>

        <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.14em] text-[#64748b] uppercase dark:text-[#99a1af]">
          {statusContent.badge}
        </p>
        <h1 className="mt-3 [font-family:var(--font-space-grotesk)] text-3xl font-bold tracking-[-0.02em] text-[#0f172a] dark:text-[#f1f3f5]">
          {statusContent.title}
        </h1>
        <p className="mt-3 [font-family:var(--font-arimo)] text-base text-[#475569] dark:text-[#99a1af]">
          {statusContent.description}
        </p>

        {safeFromPath && (
          <p className="mt-4 [font-family:var(--font-arimo)] text-xs text-[#64748b] dark:text-[#6a7282]">
            Rota solicitada: {safeFromPath}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {reason === "auth-required" && !isAuthenticated ? (
            <Button
              asChild
              className="h-10 rounded-xl bg-[#ff2e63] [font-family:var(--font-arimo)] text-sm text-white hover:bg-[#e52858]"
            >
              <Link href={signInHref}>Fazer login</Link>
            </Button>
          ) : (
            <Button
              asChild
              className="h-10 rounded-xl bg-[#ff2e63] [font-family:var(--font-arimo)] text-sm text-white hover:bg-[#e52858]"
            >
              <Link href={callbackUrl}>Tentar novamente</Link>
            </Button>
          )}

          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-[#ccd7f8] bg-transparent [font-family:var(--font-arimo)] text-sm text-[#0f172a] hover:bg-[#eef3ff] dark:border-white/15 dark:text-[#f1f3f5] dark:hover:bg-white/5"
          >
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
