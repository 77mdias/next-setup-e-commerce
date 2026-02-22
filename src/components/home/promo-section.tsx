import Image from "next/image";
import Link from "next/link";

import type { HeroAction } from "@/components/home/types";
import { cn } from "@/lib/utils";

type PromoSectionProps = {
  title: string;
  description: string;
  actions: HeroAction[];
  className?: string;
};

export function PromoSection({
  title,
  description,
  actions,
  className,
}: PromoSectionProps) {
  return (
    <section
      className={cn(
        "w-full px-4 pt-2 pb-8 sm:px-6 sm:pt-3 sm:pb-10 lg:px-8",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#dbe4ff] bg-white p-8 sm:p-12 dark:border-white/10 dark:bg-[#1b1f2b]">
        <Image
          src="/images/home/promo-node.png"
          alt="Keyboard promo background"
          fill
          className="object-cover opacity-25 dark:opacity-35"
          sizes="(min-width: 1024px) 80vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#f8faff]/90 via-[#f8faff]/55 to-transparent dark:from-[#0b0d10] dark:via-[#0b0d10]/65 dark:to-transparent" />

        <div className="relative z-10 max-w-[576px] space-y-4">
          <h2 className="[font-family:var(--font-space-grotesk)] text-3xl font-bold text-balance text-[#0f172a] sm:text-4xl dark:text-white">
            {title}
          </h2>

          <p className="[font-family:var(--font-arimo)] text-lg leading-relaxed text-balance text-[#475569] dark:text-[#99a1af]">
            {description}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "inline-flex items-center justify-center rounded-2xl px-6 py-2.5 [font-family:var(--font-arimo)] text-base transition-colors",
                  action.variant === "primary"
                    ? "bg-[#ff2e63] text-white hover:bg-[#e42859] dark:text-[#0b0d10] dark:hover:bg-[#ff4f7d]"
                    : "border border-[#ccd7f8] bg-white/70 text-[#0f172a] hover:bg-white dark:border-white/10 dark:bg-transparent dark:text-[#f1f3f5] dark:hover:border-white/25 dark:hover:bg-white/5",
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
