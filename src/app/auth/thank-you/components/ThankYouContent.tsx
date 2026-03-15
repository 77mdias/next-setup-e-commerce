"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MailCheck,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";

import { EmailAuthShell } from "@/app/auth/components/EmailAuthShell";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_AUTH_CALLBACK_PATH,
  normalizeCallbackPath,
} from "@/lib/callback-url";

export default function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [hasResent, setHasResent] = useState(false);

  const emailParam = searchParams.get("email");
  const verified = searchParams.get("verified") === "true";
  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));
  const callbackQuery =
    callbackUrl !== DEFAULT_AUTH_CALLBACK_PATH
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";
  const loginHref = `/auth/signin${callbackQuery}`;

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const resendVerificationEmail = async () => {
    if (!email) {
      toast.error("Digite seu email");
      return;
    }

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, callbackUrl }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email de verificação reenviado!");
        setHasResent(true);
      } else {
        toast.error(data.message || "Erro ao reenviar email");
      }
    } catch {
      toast.error("Erro ao reenviar email");
    } finally {
      setIsResending(false);
    }
  };

  const actionCards = verified
    ? [
        {
          title: "Sessão liberada",
          description:
            "Seu acesso já pode ser iniciado normalmente com email e senha.",
        },
        {
          title: "Ambiente pronto",
          description:
            "Pedidos, favoritos e preferências passam a ficar disponíveis na conta.",
        },
      ]
    : [
        {
          title: "Abra o email recebido",
          description:
            "Procure pela mensagem mais recente e use o botão de confirmação.",
        },
        {
          title: "Se não chegou, reenviamos daqui",
          description:
            "O reenvio abaixo cria um novo link sem precisar voltar ao cadastro.",
        },
      ];

  const canResendEmail = email.trim().length > 0;

  return (
    <EmailAuthShell
      badge={verified ? "Confirmed" : "Almost there"}
      title={
        verified ? "Tudo pronto para entrar." : "Seu cadastro já está de pé."
      }
      description={
        verified
          ? "A confirmação foi concluída. Agora basta iniciar a sessão e seguir de onde parou."
          : "Enviamos um link para o seu email. Quando ele chegar, confirme o endereço para liberar o login."
      }
      icon={
        verified ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
        ) : (
          <MailCheck className="h-6 w-6 text-[#667085] dark:text-[#D0D5DD]" />
        )
      }
      footer={
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="[font-family:var(--font-arimo)] text-sm text-[#667085] dark:text-[#98A2B3]">
            Quer voltar para a home?
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-medium text-[#111827] transition-colors hover:text-[#475467] dark:text-[#F1F3F5] dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      }
    >
      {hasResent ? (
        <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/[0.08]">
          <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            Um novo link foi enviado. Vale conferir também spam e promoções.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#e4e7ec] bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-[#667085] dark:text-[#98A2B3]" />
            <div>
              <p className="[font-family:var(--font-arimo)] text-sm font-medium text-[#111827] dark:text-[#F1F3F5]">
                {verified
                  ? "Sua conta está ativa"
                  : "Email de confirmação enviado"}
              </p>
              <p className="mt-1 [font-family:var(--font-arimo)] text-sm leading-6 text-[#667085] dark:text-[#98A2B3]">
                {verified
                  ? "Quando quiser, faça login para acessar seus dados e preferências."
                  : "Se a mensagem não aparecer logo, você pode reenviar por aqui."}
              </p>
            </div>
          </div>
        </div>
      )}

      {canResendEmail ? (
        <div className="rounded-3xl border border-[#e4e7ec] bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-[#98A2B3] uppercase">
            Email da conta
          </p>
          <p className="mt-2 [font-family:var(--font-arimo)] text-base break-all text-[#111827] dark:text-[#F1F3F5]">
            {email}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {actionCards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-[#e4e7ec] bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.02]"
          >
            <p className="[font-family:var(--font-arimo)] text-sm font-medium text-[#111827] dark:text-[#F1F3F5]">
              {card.title}
            </p>
            <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-[#667085] dark:text-[#98A2B3]">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {verified ? (
          <Button
            onClick={() => router.push(loginHref)}
            className="h-12 flex-1 rounded-2xl bg-[#111827] [font-family:var(--font-arimo)] text-sm font-medium text-white hover:bg-[#1f2937] dark:bg-[#F1F3F5] dark:text-[#0B0D10] dark:hover:bg-white"
          >
            Fazer login
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={resendVerificationEmail}
            disabled={isResending || !canResendEmail}
            className="h-12 flex-1 rounded-2xl bg-[#111827] [font-family:var(--font-arimo)] text-sm font-medium text-white hover:bg-[#1f2937] dark:bg-[#F1F3F5] dark:text-[#0B0D10] dark:hover:bg-white"
          >
            {isResending ? "Reenviando..." : "Reenviar email"}
            <RefreshCcw className="h-4 w-4" />
          </Button>
        )}

        <Button
          asChild
          variant="outline"
          className="h-12 flex-1 rounded-2xl border-[#d0d5dd] bg-white/65 [font-family:var(--font-arimo)] text-sm font-medium text-[#111827] hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-[#F1F3F5] dark:hover:bg-white/[0.06]"
        >
          <Link href={verified ? "/" : loginHref}>
            {verified ? "Ir para a home" : "Voltar ao login"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </EmailAuthShell>
  );
}
