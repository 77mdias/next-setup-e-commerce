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

const canonicalTopLevelRoutes = new Set([
  "",
  "products",
  "explore",
  "product",
  "carrinho",
  "checkout",
  "perfil",
  "wishlist",
]);

const footerColumns: FooterColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Peripherals", href: "/products" },
      { label: "Audio", href: "/products" },
      { label: "Accessories", href: "/products" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Order Status", href: "/perfil" },
      { label: "Shipping & Returns", href: "/perfil" },
      { label: "FAQ", href: "/perfil" },
      { label: "Contact Us", href: "/perfil" },
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
  { label: "Privacy Policy", href: "/perfil" },
  { label: "Terms of Service", href: "/perfil" },
];

function isCanonicalRoute(pathname: string): boolean {
  const topSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  return canonicalTopLevelRoutes.has(topSegment);
}

function buildNavigationLinks(pathname: string): NavigationLink[] {
  const isProductsPath =
    pathname === "/products" ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/products/");
  const isExplorePath =
    pathname === "/explore" || pathname.startsWith("/explore/");
  const isProfilePath =
    pathname === "/perfil" || pathname.startsWith("/perfil/");

  return [
    { label: "Home", href: "/", isActive: pathname === "/" },
    { label: "Products", href: "/products", isActive: isProductsPath },
    { label: "Explore", href: "/explore", isActive: isExplorePath },
    {
      label: "Categories",
      href: "/products",
      isActive: pathname.includes("category"),
    },
    { label: "Orders", href: "/perfil", isActive: isProfilePath },
  ];
}

type AppChromeProps = {
  children: ReactNode;
};

export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const currentPath = pathname || "/";

  const shouldShowChrome =
    isCanonicalRoute(currentPath) && !currentPath.startsWith("/auth");

  if (!shouldShowChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <HomeNavigation
        homeHref="/"
        links={buildNavigationLinks(currentPath)}
        searchHref="/products"
        wishlistHref="/wishlist"
        cartHref="/carrinho"
        profileHref="/perfil"
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
