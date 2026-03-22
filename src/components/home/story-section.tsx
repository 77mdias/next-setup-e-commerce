import Image from "next/image";
import Link from "next/link";
import { Flame } from "lucide-react";

import type { StoryBullet } from "@/components/home/types";
import { cn } from "@/lib/utils";

type StorySectionProps = {
  title: {
    lineOne: string;
    lineTwo: string;
  };
  description: string;
  bullets: StoryBullet[];
  action: {
    label: string;
    href: string;
  };
  className?: string;
};

export function StorySection({
  title,
  description,
  bullets,
  action,
  className,
}: StorySectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-[#11100d]/14 py-16 sm:py-20 dark:border-[#f2eee8]/12",
        className,
      )}
    >
      <div className="relative mx-auto grid w-full max-w-[1520px] gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-start">
        <div className="relative z-10 max-w-[760px] lg:self-start">
          <span className="inline-flex items-center gap-3 [font-family:var(--font-arimo)] text-xs tracking-[0.18em] text-[#6f6254] uppercase dark:text-[#998d7f]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#11100d]/22 bg-[#f8f4ec] text-[#7b5429] dark:border-[#f2eee8]/20 dark:bg-[#191611] dark:text-[#d6a56f]">
              <Flame size={16} />
            </span>
            Brand Manifesto
          </span>

          <h2 className="mt-6 [font-family:var(--font-space-grotesk)] text-3xl leading-tight font-bold text-balance text-[#11100d] sm:text-4xl dark:text-[#f2eee8]">
            <span className="block text-[#7b5429] dark:text-[#d6a56f]">
              {title.lineOne}
            </span>
            <span className="block">{title.lineTwo}</span>
          </h2>

          <p className="mt-8 max-w-[684px] [font-family:var(--font-arimo)] text-lg leading-relaxed text-balance text-[#4f463c] dark:text-[#b8ad9f]">
            {description}
          </p>

          <ul className="mt-8 w-full space-y-4 [font-family:var(--font-arimo)]">
            {bullets.map((bullet, index) => (
              <li
                key={bullet.id}
                className="flex min-h-6 items-start gap-4 text-base text-[#3b342d] dark:text-[#d3cabe]"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#11100d]/22 text-[11px] tracking-[0.08em] dark:border-[#f2eee8]/20">
                  {index + 1}
                </span>
                <span className="leading-6">{bullet.label}</span>
              </li>
            ))}
          </ul>

          <Link
            href={action.href}
            className="mt-8 inline-flex h-12 min-w-[227px] items-center justify-center rounded-full border border-[#11100d] bg-[#11100d] px-9 [font-family:var(--font-arimo)] text-sm leading-7 tracking-[0.14em] text-[#efebe3] uppercase transition-colors hover:bg-[#2b2721] dark:border-[#f2eee8] dark:bg-[#f2eee8] dark:text-[#11100d] dark:hover:bg-[#d8d0c3]"
          >
            {action.label}
          </Link>
        </div>

        <div className="relative z-10 lg:pt-4">
          <div className="relative aspect-[720/406.2] w-full max-w-[760px] overflow-hidden rounded-[28px] border border-[#11100d]/16 shadow-[0_26px_54px_-36px_rgba(17,16,13,0.95)] dark:border-[#f2eee8]/12">
            <Image
              src="/images/home/story-node-figma.jpg"
              alt="Premium peripherals showcase"
              fill
              className="object-cover saturate-75"
              sizes="(min-width: 1536px) 720px, (min-width: 1024px) 48vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
