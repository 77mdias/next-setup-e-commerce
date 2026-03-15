"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  MailCheck,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { EmailAuthShell } from "@/app/auth/components/EmailAuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_AUTH_CALLBACK_PATH,
  normalizeCallbackPath,
} from "@/lib/callback-url";

const verificationTips = [
  {
    title: "Use o mesmo email do cadastro",
    description: "Isso evita erro de reenvio e mantém o fluxo consistente.",
  },
  {
    title: "Olhe spam e promoções",
    description:
      "Alguns provedores podem atrasar a entrega por alguns minutos.",
  },
  {
    title: "Cada link expira por segurança",
    description: "Se ele não abrir, solicite outro e tente novamente.",
  },
];

export default function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));
  const callbackQuery =
    callbackUrl !== DEFAULT_AUTH_CALLBACK_PATH
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";

  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");
  const [hasResent, setHasResent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | null
  >(null);
  const loginHref = `/auth/signin${callbackQuery}`;
  const hasEmail = email.trim().length > 0;

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const getThankYouUrl = useCallback(
    (targetEmail: string) => {
      const params = new URLSearchParams({ verified: "true" });

      if (targetEmail) {
        params.set("email", targetEmail);
      }

      if (callbackUrl !== DEFAULT_AUTH_CALLBACK_PATH) {
        params.set("callbackUrl", callbackUrl);
      }

      return `/auth/thank-you?${params.toString()}`;
    },
    [callbackUrl],
  );

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      setIsVerifying(true);
      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${verificationToken}`,
        );
        const data = await response.json();

        if (response.ok) {
          const resolvedEmail =
            typeof data?.email === "string" && data.email.trim().length > 0
              ? data.email.trim()
              : (emailParam?.trim() ?? "");

          if (resolvedEmail) {
            setEmail(resolvedEmail);
          }

          setHasResent(false);
          setVerificationStatus("success");
          toast.success("Email verificado com sucesso!");
          setTimeout(() => {
            router.push(getThankYouUrl(resolvedEmail));
          }, 3000);
        } else {
          setVerificationStatus("error");
          toast.error(data.message || "Erro ao verificar email");
        }
      } catch {
        setVerificationStatus("error");
        toast.error("Erro ao verificar email");
      } finally {
        setIsVerifying(false);
      }
    },
    [emailParam, getThankYouUrl, router],
  );

  useEffect(() => {
    if (token) {
      void verifyEmail(token);
    }
  }, [token, verifyEmail]);

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
        setHasResent(true);
        toast.success("Email de verificação reenviado!");
      } else {
        toast.error(data.message || "Erro ao reenviar email");
      }
    } catch {
      toast.error("Erro ao reenviar email");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifying) {
    return (
      <EmailAuthShell
        badge="Verification"
        title="Confirmando seu acesso."
        description="Estamos validando o link com calma. Isso leva apenas alguns instantes."
        icon={
          <LoaderCircle className="h-6 w-6 animate-spin text-[#667085] dark:text-[#98A2B3]" />
        }
      >
        <div className="rounded-3xl border border-[#e4e7ec] bg-white/70 p-5 text-left dark:border-white/10 dark:bg-white/[0.03]">
          <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-[#667085] dark:text-[#98A2B3]">
            Enquanto isso, mantenha esta aba aberta. Assim que a confirmação
            terminar, você será redirecionado automaticamente.
          </p>
        </div>

        {email ? (
          <div className="rounded-3xl border border-[#e4e7ec] bg-white/55 px-5 py-4 dark:border-white/10 dark:bg-white/[0.02]">
            <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-[#98A2B3] uppercase">
              Endereço em verificação
            </p>
            <p className="mt-2 [font-family:var(--font-arimo)] text-base break-all text-[#111827] dark:text-[#F1F3F5]">
              {email}
            </p>
          </div>
        ) : null}
      </EmailAuthShell>
    );
  }

  if (verificationStatus === "success") {
    return (
      <EmailAuthShell
        badge="Confirmed"
        title="Email confirmado."
        description="Sua conta já pode ser usada. Vamos levar você para a próxima etapa em alguns segundos."
        icon={
          <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
        }
      >
        {email ? (
          <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/[0.08]">
            <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-300/90">
              Conta ativada
            </p>
            <p className="mt-2 [font-family:var(--font-arimo)] text-base break-all text-emerald-950 dark:text-emerald-100">
              {email}
            </p>
          </div>
        ) : null}

        <div className="rounded-3xl border border-[#e4e7ec] bg-white/70 p-5 text-left dark:border-white/10 dark:bg-white/[0.03]">
          <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-[#667085] dark:text-[#98A2B3]">
            Se preferir, você pode seguir agora sem esperar o redirecionamento.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => {
              router.push(getThankYouUrl(email));
            }}
            className="h-12 flex-1 rounded-2xl bg-[#111827] [font-family:var(--font-arimo)] text-sm font-medium text-white hover:bg-[#1f2937] dark:bg-[#F1F3F5] dark:text-[#0B0D10] dark:hover:bg-white"
          >
            Continuar agora
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 flex-1 rounded-2xl border-[#d0d5dd] bg-white/65 [font-family:var(--font-arimo)] text-sm font-medium text-[#111827] hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-[#F1F3F5] dark:hover:bg-white/[0.06]"
          >
            <Link href={loginHref}>
              Ir para login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </EmailAuthShell>
    );
  }

  if (verificationStatus === "error") {
    return (
      <EmailAuthShell
        badge="Link expired"
        title="Esse link não pode mais ser usado."
        description="Nada foi perdido. Solicite um novo email e siga a partir dele."
        icon={
          <ShieldAlert className="h-6 w-6 text-amber-500 dark:text-amber-300" />
        }
      >
        {hasResent ? (
          <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/[0.08]">
            <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-emerald-800 dark:text-emerald-200">
              Um novo link foi enviado. Dê uma olhada também na pasta de spam.
            </p>
          </div>
        ) : null}

        {hasEmail ? (
          <div className="rounded-3xl border border-[#e4e7ec] bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
            <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-[#98A2B3] uppercase">
              Email da conta
            </p>
            <p className="mt-2 [font-family:var(--font-arimo)] text-base break-all text-[#111827] dark:text-[#F1F3F5]">
              {email}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label
              htmlFor="verification-email"
              className="[font-family:var(--font-arimo)] text-sm font-medium text-[#111827] dark:text-[#F1F3F5]"
            >
              Email da conta
            </label>

            <Input
              id="verification-email"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setHasResent(false);
              }}
              className="h-12 rounded-2xl border border-[#d0d5dd] bg-white/80 text-base text-[#111827] placeholder:text-[#667085] focus-visible:border-[#94A3B8]/40 focus-visible:ring-[#94A3B8]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.55)] dark:text-[#F1F3F5] dark:placeholder:text-[#98A2B3]"
            />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={resendVerificationEmail}
            disabled={isResending}
            className="h-12 flex-1 rounded-2xl bg-[#111827] [font-family:var(--font-arimo)] text-sm font-medium text-white hover:bg-[#1f2937] dark:bg-[#F1F3F5] dark:text-[#0B0D10] dark:hover:bg-white"
          >
            {isResending ? "Reenviando..." : "Enviar novo link"}
            <RefreshCcw className="h-4 w-4" />
          </Button>

          <Button
            asChild
            variant="outline"
            className="h-12 flex-1 rounded-2xl border-[#d0d5dd] bg-white/65 [font-family:var(--font-arimo)] text-sm font-medium text-[#111827] hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-[#F1F3F5] dark:hover:bg-white/[0.06]"
          >
            <Link href={loginHref}>
              Voltar ao login
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </EmailAuthShell>
    );
  }

  return (
    <EmailAuthShell
      badge="Inbox"
      title="Seu acesso espera pela confirmação."
      description="Quando o link não chegar, use esta página para pedir outro sem sair do fluxo."
      icon={
        <MailCheck className="h-6 w-6 text-[#667085] dark:text-[#D0D5DD]" />
      }
      footer={
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="[font-family:var(--font-arimo)] text-sm text-[#667085] dark:text-[#98A2B3]">
            Já confirmou seu email?
          </p>

          <Link
            href={loginHref}
            className="inline-flex items-center gap-2 [font-family:var(--font-arimo)] text-sm font-medium text-[#111827] transition-colors hover:text-[#475467] dark:text-[#F1F3F5] dark:hover:text-white"
          >
            Fazer login
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      }
    >
      {hasResent ? (
        <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 dark:border-emerald-400/20 dark:bg-emerald-500/[0.08]">
          <p className="[font-family:var(--font-arimo)] text-sm leading-6 text-emerald-800 dark:text-emerald-200">
            Novo link enviado. Se ele não aparecer logo, confira spam e
            promoções.
          </p>
        </div>
      ) : null}

      {hasEmail ? (
        <div className="rounded-3xl border border-[#e4e7ec] bg-white/60 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-[#98A2B3] uppercase">
            Email da conta
          </p>
          <p className="mt-2 [font-family:var(--font-arimo)] text-base break-all text-[#111827] dark:text-[#F1F3F5]">
            {email}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <label
            htmlFor="resend-email"
            className="[font-family:var(--font-arimo)] text-sm font-medium text-[#111827] dark:text-[#F1F3F5]"
          >
            Email da conta
          </label>

          <Input
            id="resend-email"
            type="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setHasResent(false);
            }}
            className="h-12 rounded-2xl border border-[#d0d5dd] bg-white/80 text-base text-[#111827] placeholder:text-[#667085] focus-visible:border-[#94A3B8]/40 focus-visible:ring-[#94A3B8]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.55)] dark:text-[#F1F3F5] dark:placeholder:text-[#98A2B3]"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={resendVerificationEmail}
          disabled={isResending}
          className="h-12 flex-1 rounded-2xl bg-[#111827] [font-family:var(--font-arimo)] text-sm font-medium text-white hover:bg-[#1f2937] dark:bg-[#F1F3F5] dark:text-[#0B0D10] dark:hover:bg-white"
        >
          {isResending ? "Reenviando..." : "Reenviar verificação"}
          <RefreshCcw className="h-4 w-4" />
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-12 flex-1 rounded-2xl border-[#d0d5dd] bg-white/65 [font-family:var(--font-arimo)] text-sm font-medium text-[#111827] hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:text-[#F1F3F5] dark:hover:bg-white/[0.06]"
        >
          <Link href={loginHref}>
            Voltar ao login
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {verificationTips.map((tip) => (
          <div
            key={tip.title}
            className="rounded-3xl border border-[#e4e7ec] bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.02]"
          >
            <p className="[font-family:var(--font-arimo)] text-sm font-medium text-[#111827] dark:text-[#F1F3F5]">
              {tip.title}
            </p>
            <p className="mt-2 [font-family:var(--font-arimo)] text-sm leading-6 text-[#667085] dark:text-[#98A2B3]">
              {tip.description}
            </p>
          </div>
        ))}
      </div>
    </EmailAuthShell>
  );
}
