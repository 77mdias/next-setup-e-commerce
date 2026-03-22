"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Package, Search, ShoppingCart, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import type { NavigationLink } from "@/components/home/types";
import { useCart } from "@/context/cart";
import { useAuth } from "@/hooks/useAuth";
import {
  clearWishlistNewItems,
  getWishlistNewItemsStorageKey,
  hasWishlistNewItems,
  WISHLIST_NEW_ITEMS_EVENT,
  type WishlistNewItemsEventDetail,
} from "@/lib/wishlist-notification";
import { cn } from "@/lib/utils";

type HomeNavigationProps = {
  homeHref?: string;
  links: NavigationLink[];
  searchHref: string;
  wishlistHref: string;
  cartHref: string;
  ordersHref: string;
  profileHref: string;
};

const iconBaseClass =
  "relative flex h-8 w-8 items-center justify-center text-[#4b4238] transition-colors hover:text-[#11100d] dark:text-[#d3c9bb] dark:hover:text-[#f2eee8]";

export function HomeNavigation({
  homeHref,
  links,
  searchHref,
  wishlistHref,
  cartHref,
  ordersHref,
  profileHref,
}: HomeNavigationProps) {
  const resolvedHomeHref =
    homeHref ?? links.find((link) => link.isActive)?.href ?? "/";
  const { theme, setTheme } = useTheme();
  const { totalQuantity } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showWishlistDot, setShowWishlistDot] = useState(false);
  const wishlistUserId = isAuthenticated ? user?.id : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!wishlistUserId) {
      setShowWishlistDot(false);
      return;
    }

    setShowWishlistDot(hasWishlistNewItems(wishlistUserId));

    const handleWishlistNewItems = (event: Event) => {
      const customEvent = event as CustomEvent<WishlistNewItemsEventDetail>;
      if (customEvent.detail?.userId !== wishlistUserId) {
        return;
      }

      setShowWishlistDot(Boolean(customEvent.detail.hasNewItems));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== getWishlistNewItemsStorageKey(wishlistUserId)) {
        return;
      }

      setShowWishlistDot(event.newValue === "1");
    };

    window.addEventListener(
      WISHLIST_NEW_ITEMS_EVENT,
      handleWishlistNewItems as EventListener,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        WISHLIST_NEW_ITEMS_EVENT,
        handleWishlistNewItems as EventListener,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [wishlistUserId]);

  const isDark = !mounted || theme !== "light";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#11100d]/22 bg-[#efebe3]/68 shadow-[0_6px_28px_-20px_rgba(17,16,13,0.8)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[#efebe3]/58 dark:border-[#f2eee8]/14 dark:bg-[#11100d]/62 dark:shadow-[0_10px_30px_-22px_rgba(0,0,0,0.95)] dark:supports-[backdrop-filter]:bg-[#11100d]/52">
      <div className="relative mx-auto flex h-20 w-full max-w-[1587px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={resolvedHomeHref} className="flex items-center gap-1">
          <Image
            src="/Valorant-Academy.png"
            alt="NeXT logo"
            width={30}
            height={30}
            className="rounded-lg object-contain"
            priority
          />
          <span className="[font-family:var(--font-space-grotesk)] text-lg font-black tracking-[-0.02em] text-[#11100d] italic sm:text-xl dark:text-[#f2eee8]">
            Ne
            <span className="text-[#916130] dark:text-[#d6a56f]">XT</span>
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "border-b pb-1 [font-family:var(--font-arimo)] text-xs tracking-[0.16em] uppercase transition-colors",
                link.isActive
                  ? "border-[#11100d]/42 text-[#11100d] dark:border-[#f2eee8]/45 dark:text-[#f2eee8]"
                  : "border-transparent text-[#5f5549] hover:border-[#7b5429]/35 hover:text-[#7b5429] dark:text-[#9c9080] dark:hover:border-[#d6a56f]/35 dark:hover:text-[#d6a56f]",
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
            onClick={() => {
              if (!wishlistUserId) {
                return;
              }

              clearWishlistNewItems(wishlistUserId);
            }}
          >
            <Heart size={18} />
            {showWishlistDot && (
              <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-[#916130] dark:bg-[#d6a56f]" />
            )}
          </Link>

          <Link
            href={cartHref}
            className={iconBaseClass}
            aria-label="Open cart"
          >
            <ShoppingCart size={18} />
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#11100d] px-1 [font-family:var(--font-arimo)] text-[10px] text-[#efebe3] dark:bg-[#f2eee8] dark:text-[#11100d]">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
          </Link>

          <Link
            href={ordersHref}
            className={iconBaseClass}
            aria-label="Open orders"
          >
            <Package size={18} />
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
            className="relative inline-flex h-7 w-[44px] items-center rounded-full bg-[#d9d0c2] px-1 transition-colors hover:bg-[#c9bdac] dark:bg-white/12 dark:hover:bg-white/20"
            aria-label="Alternar tema"
          >
            <span
              className={cn(
                "absolute left-1 h-5 w-5 rounded-full bg-[#11100d] transition-transform duration-300 dark:bg-[#f2eee8]",
                isDark ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
