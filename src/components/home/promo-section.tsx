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
    <section className={cn("w-full pt-2 pb-8 sm:pt-3 sm:pb-10", className)}>
      <div className="relative grid overflow-hidden rounded-[30px] border border-[#11100d]/16 bg-[#f7f3eb] sm:p-0 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] dark:border-[#f2eee8]/12 dark:bg-[#17140f]">
        <div className="relative z-10 p-8 sm:p-10 lg:p-12">
          <span className="[font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-[#6f6254] uppercase dark:text-[#998d7f]">
            Weekly Offer
          </span>
          <h2 className="mt-3 [font-family:var(--font-space-grotesk)] text-3xl font-bold text-balance text-[#11100d] sm:text-4xl dark:text-[#f2eee8]">
            {title}
          </h2>

          <p className="mt-4 [font-family:var(--font-arimo)] text-lg leading-relaxed text-balance text-[#4f463c] dark:text-[#b8ad9f]">
            {description}
          </p>

          <div className="flex flex-wrap gap-3 pt-6">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "inline-flex items-center justify-center rounded-full border px-6 py-2.5 [font-family:var(--font-arimo)] text-xs tracking-[0.16em] uppercase transition-colors",
                  action.variant === "primary"
                    ? "border-[#11100d] bg-[#11100d] text-[#efebe3] hover:bg-[#2b2721] dark:border-[#f2eee8] dark:bg-[#f2eee8] dark:text-[#11100d] dark:hover:bg-[#d8d0c3]"
                    : "border-[#11100d]/24 bg-transparent text-[#11100d] hover:bg-[#11100d]/6 dark:border-[#f2eee8]/24 dark:text-[#f2eee8] dark:hover:bg-[#f2eee8]/10",
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative min-h-[260px] overflow-hidden border-t border-[#11100d]/12 lg:min-h-full lg:border-t-0 lg:border-l dark:border-[#f2eee8]/12">
          <Image
            src="/images/home/promo-node.png"
            alt="Keyboard promo background"
            fill
            className="object-cover saturate-75"
            sizes="(min-width: 1024px) 44vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11100d]/35 via-transparent to-transparent dark:from-black/45" />
        </div>
      </div>
    </section>
  );
}
