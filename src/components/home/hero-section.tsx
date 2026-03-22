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
    <section
      className={cn(
        "relative border-b border-[#11100d]/14 pt-12 pb-14 sm:pt-16 dark:border-[#f2eee8]/12",
        className,
      )}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-end lg:gap-12">
        <div>
          <span className="inline-flex items-center rounded-full border border-[#11100d]/20 bg-[#f8f5ef] px-5 py-2 [font-family:var(--font-arimo)] text-xs tracking-[0.18em] uppercase dark:border-[#f2eee8]/18 dark:bg-[#191611]">
            {badge}
          </span>

          <h1 className="mt-7 [font-family:var(--font-space-grotesk)] text-4xl leading-[0.96] font-black tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl xl:text-[5.3rem] dark:text-[#f8f4ee]">
            <span className="block">{title.lineOne}</span>
            <span className="mt-1 block text-[#9a6831] dark:text-[#d6a56f]">
              {title.lineTwo}
            </span>
          </h1>

          <p className="mt-8 max-w-[640px] [font-family:var(--font-arimo)] text-lg leading-relaxed text-[#403b34] dark:text-[#bcb4a7]">
            {description}
          </p>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={cn(
                  "inline-flex min-w-[180px] items-center justify-center rounded-full border px-7 py-3 [font-family:var(--font-arimo)] text-sm tracking-[0.12em] uppercase transition-colors",
                  action.variant === "primary"
                    ? "border-[#11100d] bg-[#11100d] text-[#efebe3] hover:bg-[#2b2721] dark:border-[#f2eee8] dark:bg-[#f2eee8] dark:text-[#11100d] dark:hover:bg-[#dcd4c7]"
                    : "border-[#11100d]/25 bg-transparent text-[#11100d] hover:bg-[#11100d]/6 dark:border-[#f2eee8]/26 dark:text-[#f2eee8] dark:hover:bg-[#f2eee8]/10",
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-5 lg:pb-1">
          <div className="relative min-h-[360px] overflow-hidden rounded-[30px] border border-[#11100d]/14 bg-[#060606] sm:min-h-[430px] dark:border-[#f2eee8]/12 dark:bg-[#060606]">
            <Image
              src="/images/home/hero-scene-node.png"
              alt="Dark gaming setup with RGB lighting"
              fill
              priority
              className="object-cover object-center saturate-75"
              sizes="(min-width: 1024px) 42vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11100d]/50 via-[#11100d]/5 to-transparent dark:from-black/55 dark:via-black/5" />
          </div>

          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.16em] text-[#5c5247] uppercase dark:text-[#9f9383]">
            Curadoria semanal de setups, perifericos e audio.
          </p>
        </div>
      </div>
    </section>
  );
}
