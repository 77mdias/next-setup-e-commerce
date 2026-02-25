"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowRight, Lock, Mail, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_AUTH_CALLBACK_PATH,
  normalizeCallbackPath,
} from "@/lib/callback-url";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
};

function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("one uppercase letter (A-Z)");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("one lowercase letter (a-z)");
  }

  if (!/\d/.test(password)) {
    errors.push("one number (0-9)");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("one special character (!@#$%^&*)");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default function SignUpForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = normalizeCallbackPath(searchParams.get("callbackUrl"));
  const callbackQuery =
    callbackUrl !== DEFAULT_AUTH_CALLBACK_PATH
      ? `?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "";

  const signInHref = `/auth/signin${callbackQuery}`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previousValues) => ({ ...previousValues, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setError(
        `Password must contain: ${passwordValidation.errors.join(", ")}.`,
      );
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          callbackUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.details)) {
          throw new Error(`Password must contain: ${data.details.join(", ")}`);
        }

        throw new Error(data.message || "Unable to create account right now.");
      }

      router.push(
        `/auth/verify-email?email=${encodeURIComponent(formData.email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create account right now.";
      setError(message);
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(92,124,250,0.08),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(92,124,250,0.08),transparent_40%)] dark:bg-[radial-gradient(circle_at_16%_16%,rgba(92,124,250,0.12),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(92,124,250,0.10),transparent_40%)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5C7CFA]/12 blur-[240px] dark:bg-[#5C7CFA]/20" />

      <div className="relative mx-auto flex w-full max-w-[1587px] items-center justify-center px-4 py-16 sm:px-6 lg:min-h-[874px] lg:px-8">
        <section className="w-full max-w-[448px] rounded-2xl border border-[#dbe4ff] bg-white/75 px-6 py-8 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-8 sm:py-9 dark:border-white/10 dark:bg-[rgba(23,26,33,0.5)] dark:shadow-[0_25px_50px_-12px_rgba(92,124,250,0.05)]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5C7CFA]/20 bg-[#5C7CFA]/10">
              <Sparkles className="h-5 w-5 text-[#5C7CFA]" />
            </div>

            <h1 className="[font-family:var(--font-space-grotesk)] text-[30px] leading-[1.2] font-bold text-[#0f172a] dark:text-[#F1F3F5]">
              Join Nexus
            </h1>

            <p className="mt-2 [font-family:var(--font-arimo)] text-base leading-6 text-[#64748b] dark:text-[#9CA3AF]">
              Become an elite operative today.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="[font-family:var(--font-arimo)] text-sm font-medium text-[#0f172a] dark:text-[#F1F3F5]"
                >
                  Username
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#64748b] dark:text-[#9CA3AF]" />

                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="PlayerOne"
                    value={formData.name}
                    onChange={handleChange}
                    className="h-12 rounded-2xl border border-[#ccd7f8] bg-white/80 pl-11 text-base text-[#0f172a] placeholder:text-[#64748b] focus-visible:border-[#5C7CFA]/40 focus-visible:ring-[#5C7CFA]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.5)] dark:text-[#F1F3F5] dark:placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 rounded-2xl border border-[#ccd7f8] bg-white/80 pl-11 text-base text-[#0f172a] placeholder:text-[#64748b] focus-visible:border-[#5C7CFA]/40 focus-visible:ring-[#5C7CFA]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.5)] dark:text-[#F1F3F5] dark:placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="[font-family:var(--font-arimo)] text-sm font-medium text-[#0f172a] dark:text-[#F1F3F5]"
                >
                  Password
                </label>

                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#64748b] dark:text-[#9CA3AF]" />

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 rounded-2xl border border-[#ccd7f8] bg-white/80 pl-11 text-base text-[#0f172a] placeholder:text-[#64748b] focus-visible:border-[#5C7CFA]/40 focus-visible:ring-[#5C7CFA]/20 dark:border-white/10 dark:bg-[rgba(18,21,26,0.5)] dark:text-[#F1F3F5] dark:placeholder:text-[#9CA3AF]"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-2xl bg-[#FF2E63] [font-family:var(--font-arimo)] text-base font-medium text-white hover:bg-[#FF4F7D]"
            >
              {isLoading ? "Creating..." : "Create Account"}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>

          <p className="mt-6 text-center [font-family:var(--font-arimo)] text-sm text-[#64748b] dark:text-[#9CA3AF]">
            Already have an account?{" "}
            <Link
              href={signInHref}
              className="font-medium text-[#d61f57] transition-colors hover:text-[#b4174a] dark:text-[#FF2E63] dark:hover:text-[#FF5A88]"
            >
              Log In
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
