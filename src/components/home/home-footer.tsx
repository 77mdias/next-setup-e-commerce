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
      className={cn("border-t border-[#dbe4ff] dark:border-white/5", className)}
    >
      <div className="w-full px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff2e63] [font-family:var(--font-space-grotesk)] text-[22px] font-bold text-white dark:text-[#0b0d10]">
                N
              </span>
              <span className="[font-family:var(--font-space-grotesk)] text-2xl font-bold tracking-[0.05em] text-[#0f172a] dark:text-white">
                NEXUS
              </span>
            </Link>

            <p className="max-w-[320px] [font-family:var(--font-arimo)] text-sm leading-relaxed text-[#475569] dark:text-[#99a1af]">
              {description}
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="[font-family:var(--font-space-grotesk)] text-base font-bold text-[#0f172a] dark:text-white">
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
                        className="[font-family:var(--font-arimo)] text-sm text-[#475569] transition-colors hover:text-[#0f172a] dark:text-[#99a1af] dark:hover:text-white"
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#ccd7f8] text-[#475569] transition-colors hover:border-[#b4c5ff] hover:text-[#0f172a] dark:border-white/10 dark:text-[#99a1af] dark:hover:border-white/25 dark:hover:text-white"
              >
                <Icon size={16} />
              </Link>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#dbe4ff] pt-5 [font-family:var(--font-arimo)] text-sm text-[#64748b] sm:flex-row sm:items-center sm:justify-between dark:border-white/5 dark:text-[#6a7282]">
          <p>{copyright}</p>

          <div className="flex flex-wrap items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition-colors hover:text-[#0f172a] dark:hover:text-[#99a1af]"
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
