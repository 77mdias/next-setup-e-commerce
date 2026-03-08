"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { HomeFooter } from "@/components/home/home-footer";
import { HomeNavigation } from "@/components/home/home-navigation";
import type {
  FooterColumn,
  FooterLink,
  NavigationLink,
} from "@/components/home/types";
import { ROUTE_PATHS } from "@/lib/routes";

const footerColumns: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: ROUTE_PATHS.products },
      { label: "Peripherals", href: ROUTE_PATHS.products },
      { label: "Audio", href: ROUTE_PATHS.products },
      { label: "Accessories", href: ROUTE_PATHS.products },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Order Status", href: ROUTE_PATHS.orders },
      { label: "Shipping & Returns", href: ROUTE_PATHS.profile },
      { label: "FAQ", href: ROUTE_PATHS.profile },
      { label: "Contact Us", href: ROUTE_PATHS.profile },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "Instagram", href: "https://www.instagram.com" },
      { label: "YouTube", href: "https://www.youtube.com" },
      { label: "Discord", href: "https://discord.com" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: ROUTE_PATHS.profile },
  { label: "Terms of Service", href: ROUTE_PATHS.profile },
];

function buildNavigationLinks(pathname: string): NavigationLink[] {
  const isProductsPath =
    pathname === ROUTE_PATHS.products ||
    pathname.startsWith(`${ROUTE_PATHS.productRoot}/`) ||
    pathname.startsWith(`${ROUTE_PATHS.products}/`);
  const isExplorePath =
    pathname === ROUTE_PATHS.explore ||
    pathname.startsWith(`${ROUTE_PATHS.explore}/`);
  const isOrdersPath =
    pathname === ROUTE_PATHS.orders ||
    pathname.startsWith(`${ROUTE_PATHS.orders}/`);

  return [
    {
      label: "Home",
      href: ROUTE_PATHS.home,
      isActive: pathname === ROUTE_PATHS.home,
    },
    { label: "Products", href: ROUTE_PATHS.products, isActive: isProductsPath },
    { label: "Explore", href: ROUTE_PATHS.explore, isActive: isExplorePath },
    { label: "Orders", href: ROUTE_PATHS.orders, isActive: isOrdersPath },
  ];
}

type AppChromeProps = {
  children: ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const currentPath = pathname || "/";

  return (
    <>
      <HomeNavigation
        homeHref="/"
        links={buildNavigationLinks(currentPath)}
        searchHref={ROUTE_PATHS.products}
        wishlistHref={ROUTE_PATHS.wishlist}
        cartHref={ROUTE_PATHS.cart}
        ordersHref={ROUTE_PATHS.orders}
        profileHref={ROUTE_PATHS.profile}
      />

      <div className="pt-20">{children}</div>

      <HomeFooter
        description="Premium gaming gear for the modern player. Elevate your setup with our curated collection of high-performance peripherals."
        columns={footerColumns}
        copyright="© 2026 Nexus Gaming. All rights reserved."
        legalLinks={legalLinks}
      />
    </>
  );
}
