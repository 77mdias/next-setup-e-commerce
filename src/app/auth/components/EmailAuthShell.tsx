import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmailAuthShellProps = {
  badge: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function EmailAuthShell({
  badge,
  title,
  description,
  icon,
  children,
  footer,
  className,
  contentClassName,
}: EmailAuthShellProps) {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-[#f6f3f4] px-4 py-12 text-[#0f172a] transition-colors sm:px-6 lg:px-8 dark:bg-[#0B0D10] dark:text-[#F1F3F5]">
      <Image
        src="/images/auth/signin-bg.png"
        alt=""
        aria-hidden="true"
        fill
        priority
        className="object-cover opacity-[0.025] dark:opacity-[0.05]"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(148,163,184,0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.7),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.55),transparent_58%)] dark:bg-[radial-gradient(circle_at_18%_16%,rgba(148,163,184,0.18),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(92,124,250,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_58%)]" />
      <div className="pointer-events-none absolute top-[14%] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#cbd5e1]/50 blur-[150px] dark:bg-[#94A3B8]/10" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[14%] h-[280px] w-[280px] rounded-full bg-[#d8b4c8]/35 blur-[150px] dark:bg-[#f472b6]/[0.06]" />

      <div className="relative mx-auto w-full max-w-[1587px]">
        <section
          className={cn(
            "mx-auto w-full max-w-[560px] rounded-[28px] border border-[#d9dee8] bg-white/78 px-6 py-8 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl sm:px-8 sm:py-10 dark:border-white/10 dark:bg-[rgba(23,26,33,0.74)] dark:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.42)]",
            className,
          )}
        >
          <div className="text-center">
            <span className="inline-flex items-center rounded-full border border-[#d8dee9] bg-white/65 px-3 py-1 [font-family:var(--font-arimo)] text-[11px] font-medium tracking-[0.24em] text-[#667085] uppercase dark:border-white/10 dark:bg-white/[0.03] dark:text-[#8b93a4]">
              {badge}
            </span>

            <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-[20px] border border-[#d8dee9] bg-white/70 text-[#0f172a] shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#F1F3F5] dark:shadow-none">
              {icon}
            </div>

            <h1 className="mt-5 [font-family:var(--font-space-grotesk)] text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-[#111827] sm:text-[34px] dark:text-[#F1F3F5]">
              {title}
            </h1>

            <p className="mx-auto mt-3 max-w-[34rem] [font-family:var(--font-arimo)] text-base leading-7 text-[#667085] dark:text-[#98A2B3]">
              {description}
            </p>
          </div>

          <div className={cn("mt-8 space-y-6", contentClassName)}>
            {children}
          </div>

          {footer ? (
            <div className="mt-8 border-t border-[#e4e7ec] pt-5 dark:border-white/10">
              {footer}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
