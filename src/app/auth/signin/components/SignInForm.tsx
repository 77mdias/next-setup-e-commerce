"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_AUTH_CALLBACK_PATH,
  normalizeCallbackPath,
} from "@/lib/callback-url";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthError, setOauthError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));
  const callbackQuery =
    callbackUrl !== DEFAULT_AUTH_CALLBACK_PATH
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";

  const signUpHref = `/auth/signup${callbackQuery}`;
  const resetPasswordHref = `/auth/reset-password${callbackQuery}`;

  useEffect(() => {
    const errorParam = searchParams.get("error");

    if (errorParam === "OAuthAccountNotLinked") {
      setOauthError("OAuthAccountNotLinked");
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(`${newUrl.pathname}${newUrl.search}`);
    }
  }, [searchParams, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    if (email) {
      localStorage.setItem("lastAttemptedEmail", email);
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EmailNotVerified") {
          setError(
            "Email not verified. Check your inbox and click on the verification link.",
          );
        } else {
          setError("Invalid email or password.");
        }
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-[#f5f8ff] text-[#0f172a] transition-colors dark:bg-[#0B0D10] dark:text-[#F1F3F5]">
      <Image
        src="/images/auth/signin-bg.png"
        alt="Gaming setup background"
        fill
        priority
        className="object-cover opacity-[0.03] dark:opacity-[0.05]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(255,46,99,0.08),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(92,124,250,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_16%_16%,rgba(255,46,99,0.12),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(92,124,250,0.10),transparent_40%)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF2E63]/12 blur-[240px] dark:bg-[#FF2E63]/20" />

      <div className="relative mx-auto flex w-full max-w-[1587px] items-center justify-center px-4 py-16 sm:px-6 lg:min-h-[874px] lg:px-8">
        <section className="w-full max-w-[448px] rounded-2xl border border-[#dbe4ff] bg-white/75 px-6 py-8 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-8 sm:py-9 dark:border-white/10 dark:bg-[rgba(23,26,33,0.5)] dark:shadow-[0_25px_50px_-12px_rgba(255,46,99,0.05)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#FF2E63]/20 bg-[#FF2E63]/10">
              <Sparkles className="h-5 w-5 text-[#FF2E63]" />
            </div>

            <h1 className="[font-family:var(--font-space-grotesk)] text-[30px] leading-[1.2] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
              Welcome Back
            </h1>

            <p className="mt-2 [font-family:var(--font-arimo)] text-base leading-6 text-[#64748b] dark:text-[#9CA3AF]">
              Enter the Nexus to access your arsenal.
            </p>
          </div>

          {oauthError === "OAuthAccountNotLinked" && (
            <div className="mt-6">
              <Alert
                type="warning"
                title="Email already registered"
                message="This email already exists. For security reasons, sign in with your original sign-up method."
                onClose={() => setOauthError(null)}
                actions={[
                  {
                    label: "Use password",
                    onClick: () => setOauthError(null),
                    variant: "default",
                  },
                  {
                    label: "Create account",
                    onClick: () => router.push(signUpHref),
                    variant: "outline",
                  },
                ]}
              />
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
                {error.includes("Email not verified") && (
                  <div className="mt-2">
                    <Link
                      href="/auth/verify-email"
                      className="text-[#d61f57] underline transition-colors hover:text-[#b4174a] dark:text-[#FF8FB0] dark:hover:text-[#FFB3C8]"
                    >
                      Resend verification email
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="[font-family:var(--font-arimo)] text-sm font-medium text-[#0f172a] dark:text-[#F1F3F5]"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#64748b] dark:text-[#9CA3AF]" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="player@nexus.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl border border-[#ccd7f8] bg-white/80 pl-11 text-base text-[#0f172a] placeholder:text-[#64748b] focus-visible:border-[#FF2E63]/40 focus-visible:ring-[#FF2E63]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.5)] dark:text-[#F1F3F5] dark:placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="[font-family:var(--font-arimo)] text-sm font-medium text-[#0f172a] dark:text-[#F1F3F5]"
                  >
                    Password
                  </label>

                  <Link
                    href={resetPasswordHref}
                    className="[font-family:var(--font-arimo)] text-xs text-[#d61f57] transition-colors hover:text-[#b4174a] dark:text-[#FF2E63] dark:hover:text-[#FF5A88]"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#64748b] dark:text-[#9CA3AF]" />

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 rounded-2xl border border-[#ccd7f8] bg-white/80 pr-11 pl-11 text-base text-[#0f172a] placeholder:text-[#64748b] focus-visible:border-[#FF2E63]/40 focus-visible:ring-[#FF2E63]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.5)] dark:text-[#F1F3F5] dark:placeholder:text-[#9CA3AF]"
                  />

                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#64748b] transition-colors hover:text-[#0f172a] dark:text-[#9CA3AF] dark:hover:text-white"
                    onClick={() =>
                      setShowPassword((currentValue) => !currentValue)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-2xl bg-[#FF2E63] [font-family:var(--font-arimo)] text-base font-medium text-white hover:bg-[#FF4F7D]"
            >
              {isLoading ? "Initializing..." : "Initialize Session"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>

          <p className="mt-6 text-center [font-family:var(--font-arimo)] text-sm text-[#64748b] dark:text-[#9CA3AF]">
            New to Nexus?{" "}
            <Link
              href={signUpHref}
              className="font-medium text-[#d61f57] transition-colors hover:text-[#b4174a] dark:text-[#FF2E63] dark:hover:text-[#FF5A88]"
            >
              Create Account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
