"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Search, ShoppingCart, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { NavigationLink } from "@/components/home/types";
import { cn } from "@/lib/utils";

type HomeNavigationProps = {
  homeHref?: string;
  links: NavigationLink[];
  searchHref: string;
  wishlistHref: string;
  cartHref: string;
  profileHref: string;
};

const iconBaseClass =
  "relative flex h-8 w-8 items-center justify-center text-[#4b5563] transition-colors hover:text-[#0f172a] dark:text-[#d1d5dc] dark:hover:text-white";

export function HomeNavigation({
  homeHref,
  links,
  searchHref,
  wishlistHref,
  cartHref,
  profileHref,
}: HomeNavigationProps) {
  const resolvedHomeHref =
    homeHref ?? links.find((link) => link.isActive)?.href ?? "/";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme !== "light";

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-[#f8faff]/90 backdrop-blur-xl dark:bg-[#0b0d10]/90">
      <div className="mx-auto flex h-20 w-full max-w-[1587px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={resolvedHomeHref} className="flex items-center gap-1">
          <Image
            src="/Valorant-Academy.png"
            alt="NeXT logo"
            width={30}
            height={30}
            className="rounded-lg object-contain"
            priority
          />
          <span className="[font-family:var(--font-space-grotesk)] text-lg font-extrabold text-[#0f172a] italic sm:text-xl dark:text-white">
            Ne
            <span className="text-[#ff2e63]">XT</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "[font-family:var(--font-arimo)] text-sm transition-colors",
                link.isActive
                  ? "text-[#ff2e63]"
                  : "text-[#4b5563] hover:text-[#0f172a] dark:text-[#99a1af] dark:hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={searchHref}
            className={iconBaseClass}
            aria-label="Search products"
          >
            <Search size={18} />
          </Link>

          <Link
            href={wishlistHref}
            className={iconBaseClass}
            aria-label="Open wishlist"
          >
            <Heart size={18} />
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-[#ff2e63]" />
          </Link>

          <Link
            href={cartHref}
            className={iconBaseClass}
            aria-label="Open cart"
          >
            <ShoppingCart size={18} />
            <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#5c7cfa] [font-family:var(--font-arimo)] text-[10px] text-[#0b0d10]">
              3
            </span>
          </Link>

          <Link
            href={profileHref}
            className={iconBaseClass}
            aria-label="Open profile"
          >
            <UserRound size={18} />
          </Link>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="relative inline-flex h-7 w-[44px] items-center rounded-full bg-[#dbe4ff] px-1 transition-colors hover:bg-[#c9d7ff] dark:bg-white/12 dark:hover:bg-white/20"
            aria-label="Alternar tema"
          >
            <span
              className={cn(
                "absolute left-1 h-5 w-5 rounded-full bg-[#0f172a] transition-transform duration-300 dark:bg-[#f1f3f5]",
                isDark ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
