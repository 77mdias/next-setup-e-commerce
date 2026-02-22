import Image from "next/image";
import Link from "next/link";

import type { HeroAction } from "@/components/home/types";
import { cn } from "@/lib/utils";

type HeroSectionProps = {
  badge: string;
  title: {
    lineOne: string;
    lineTwo: string;
  };
  description: string;
  actions: HeroAction[];
  className?: string;
};

export function HeroSection({
  badge,
  title,
  description,
  actions,
  className,
}: HeroSectionProps) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <Image
        src="/images/home/hero-scene-node.png"
        alt="Dark gaming setup with RGB lighting"
        fill
        priority
        className="object-cover object-center opacity-65"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-[#f8faff]/90 via-[#f8faff]/45 to-[#f8faff]/90 dark:from-[#0b0d10] dark:via-[#0b0d10]/30 dark:to-[#0b0d10]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#f8faff]/88 via-transparent to-[#f8faff]/88 dark:from-[#0b0d10]/85 dark:to-[#0b0d10]/85" />

      <div className="relative flex min-h-[680px] w-full items-center justify-center px-4 pt-28 pb-16 text-center sm:px-6 lg:min-h-[786px] lg:px-8">
        <div className="w-full max-w-[864px]">
          <span className="inline-flex items-center rounded-full border border-[#d6ddf5] bg-white/70 px-6 py-2 [font-family:var(--font-arimo)] text-sm text-[#ff2e63] dark:border-white/10 dark:bg-white/5">
            {badge}
          </span>

          <h1 className="mt-6 [font-family:var(--font-space-grotesk)] text-4xl font-bold tracking-[-0.02em] text-balance text-[#0f172a] sm:text-5xl md:text-6xl lg:text-7xl dark:text-white">
            {title.lineOne}
            <span className="mt-2 block bg-gradient-to-b from-[#ff2e63] to-[#5c7cfa] bg-clip-text text-transparent">
              {title.lineTwo}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[700px] [font-family:var(--font-arimo)] text-lg leading-relaxed text-balance text-[#4b5563] sm:text-xl dark:text-[#99a1af]">
            {description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "inline-flex min-w-[180px] items-center justify-center rounded-2xl px-8 py-3.5 [font-family:var(--font-arimo)] text-lg transition-colors",
                  action.variant === "primary"
                    ? "bg-[#ff2e63] text-white hover:bg-[#e42859] dark:text-[#0b0d10] dark:hover:bg-[#ff4f7d]"
                    : "border border-[#ccd7f8] bg-white/65 text-[#0f172a] hover:bg-white dark:border-white/10 dark:bg-transparent dark:text-[#f1f3f5] dark:hover:border-white/25 dark:hover:bg-white/5",
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
