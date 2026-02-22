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
  glowClassName?: string;
};

export function StorySection({
  title,
  description,
  bullets,
  action,
  className,
  glowClassName,
}: StorySectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[#f7f9ff] via-[#eef2ff] to-[#f7f9ff] dark:from-[#0b0d10] dark:via-[#111723] dark:to-[#0b0d10]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(255,46,99,0.06),transparent_34%)] dark:bg-[radial-gradient(circle_at_84%_20%,rgba(255,46,99,0.1),transparent_34%)]" />
      <div className="relative mx-auto grid w-full max-w-[1504px] gap-12 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-start lg:gap-12 lg:px-10 xl:px-12 2xl:grid-cols-[720px_720px] 2xl:justify-between 2xl:gap-16 2xl:px-0">
        <div className="relative z-10 max-w-[720px] lg:self-start">
          <span className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-white text-[#ff2e63] shadow-[0_20px_25px_-5px_rgba(255,46,99,0.14)] dark:border-white/10 dark:bg-[#1b1f2b] dark:shadow-[0_20px_25px_-5px_rgba(255,46,99,0.2)]">
            <Flame size={30} />
          </span>

          <h2 className="[font-family:var(--font-space-grotesk)] text-3xl leading-tight font-bold text-balance text-[#0f172a] sm:text-4xl dark:text-white">
            <span className="block">{title.lineOne}</span>
            <span className="block">{title.lineTwo}</span>
          </h2>

          <p className="mt-8 max-w-[684px] [font-family:var(--font-arimo)] text-lg leading-relaxed text-balance text-[#475569] dark:text-[#99a1af]">
            {description}
          </p>

          <ul className="mt-8 w-full space-y-4 [font-family:var(--font-arimo)]">
            {bullets.map((bullet) => (
              <li
                key={bullet.id}
                className="flex min-h-6 items-start gap-3 text-base text-[#334155] dark:text-[#d1d5dc]"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#5c7cfa]" />
                <span className="leading-6">{bullet.label}</span>
              </li>
            ))}
          </ul>

          <Link
            href={action.href}
            className="mt-8 inline-flex h-14 min-w-[227px] items-center justify-center rounded-2xl bg-[#5c7cfa] px-9 [font-family:var(--font-arimo)] text-lg leading-7 text-white transition-colors hover:bg-[#4a6ff0] dark:text-[#0b0d10] dark:hover:bg-[#8098ff]"
          >
            {action.label}
          </Link>
        </div>

        <div className="relative z-10 lg:pt-8 2xl:pt-[82px]">
          <div
            className={cn(
              "pointer-events-none absolute -inset-4 rounded-[24px] bg-gradient-to-b from-[#ff2e63] to-[#5c7cfa] opacity-15 blur-[80px] dark:opacity-20",
              glowClassName,
            )}
          />
          <div className="relative aspect-[720/406.2] w-full max-w-[720px] overflow-hidden rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
            <Image
              src="/images/home/story-node-figma.jpg"
              alt="Premium peripherals showcase"
              fill
              className="object-cover"
              sizes="(min-width: 1536px) 720px, (min-width: 1024px) 48vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
