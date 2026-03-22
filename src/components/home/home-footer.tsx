import Image from "next/image";
import Link from "next/link";
import { Instagram, MessageCircle, Youtube } from "lucide-react";

import type { FooterColumn, FooterLink } from "@/components/home/types";
import { cn } from "@/lib/utils";

type HomeFooterProps = {
  description: string;
  columns: FooterColumn[];
  copyright: string;
  legalLinks: FooterLink[];
  className?: string;
};

const socialIcons = [
  {
    key: "instagram",
    href: "https://www.instagram.com",
    icon: Instagram,
    label: "Instagram",
  },
  {
    key: "youtube",
    href: "https://www.youtube.com",
    icon: Youtube,
    label: "YouTube",
  },
  {
    key: "discord",
    href: "https://discord.com",
    icon: MessageCircle,
    label: "Discord",
  },
] as const;

export function HomeFooter({
  description,
  columns,
  copyright,
  legalLinks,
  className,
}: HomeFooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-[#11100d]/15 bg-[#e9e3d8] dark:border-[#f2eee8]/10 dark:bg-[#0f0d0a]",
        className,
      )}
    >
      <div className="w-full px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-1">
              <Image
                src="/Valorant-Academy.png"
                alt="NeXT logo"
                width={30}
                height={30}
                className="rounded-lg object-contain"
              />
              <span className="[font-family:var(--font-space-grotesk)] text-lg font-black tracking-[-0.02em] text-[#11100d] italic sm:text-xl dark:text-[#f2eee8]">
                Ne
                <span className="text-[#916130] dark:text-[#d6a56f]">XT</span>
              </span>
            </Link>

            <p className="max-w-[320px] [font-family:var(--font-arimo)] text-sm leading-relaxed text-[#4f463c] dark:text-[#b8ad9f]">
              {description}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="[font-family:var(--font-space-grotesk)] text-base font-bold tracking-[0.05em] text-[#11100d] uppercase dark:text-[#f2eee8]">
                {column.title}
              </h3>

              <ul className="mt-4 space-y-2">
                {column.links.map((link) => {
                  const isExternal = link.href.startsWith("http");

                  return (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noreferrer" : undefined}
                        className="[font-family:var(--font-arimo)] text-sm text-[#4f463c] transition-colors hover:text-[#7b5429] dark:text-[#b8ad9f] dark:hover:text-[#d6a56f]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-4">
          {socialIcons.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#11100d]/22 text-[#4f463c] transition-colors hover:border-[#916130]/50 hover:text-[#7b5429] dark:border-[#f2eee8]/20 dark:text-[#b8ad9f] dark:hover:border-[#d6a56f]/40 dark:hover:text-[#d6a56f]"
              >
                <Icon size={16} />
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#11100d]/12 pt-5 [font-family:var(--font-arimo)] text-sm text-[#61574c] sm:flex-row sm:items-center sm:justify-between dark:border-[#f2eee8]/10 dark:text-[#9f9383]">
          <p>{copyright}</p>

          <div className="flex flex-wrap items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-[#7b5429] dark:hover:text-[#d6a56f]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
