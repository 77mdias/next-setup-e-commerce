"use client";

import Link from "next/link";
import { House, Star, ShoppingBasket, User } from "lucide-react";
import { useParams, usePathname } from "next/navigation";

export default function Menu() {
  const { slug } = useParams();
  const pathname = usePathname();
  return (
    <menu className="fixed right-0 bottom-0 left-0 z-50 bg-[var(--foreground)]">
      <ul className="flex content-center items-center justify-center gap-x-2 text-white">
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href={`/${slug}`}>
            <House
              className={`h-6 w-6 ${pathname === `/${slug}` ? "menu-item-active" : ""}`}
            />
          </Link>
        </li>
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href={`/${slug}/wishlist`}>
            <Star
              className={`h-6 w-6 ${pathname === `/${slug}/wishlist` ? "menu-item-active" : ""}`}
            />
          </Link>
        </li>
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href={`/${slug}/carrinho`}>
            <ShoppingBasket
              className={`h-6 w-6 ${pathname === `/${slug}/carrinho` ? "menu-item-active" : ""}`}
            />
          </Link>
        </li>
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href={`/${slug}/perfil`}>
            <User
              className={`h-6 w-6 ${pathname === `/${slug}/perfil` ? "menu-item-active" : ""}`}
            />
          </Link>
        </li>
      </ul>
    </menu>
  );
}
