"use client";

import Link from "next/link";
import { House, Star, ShoppingBasket, User } from "lucide-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";

export default function Menu() {
  const { slug } = useParams();
  const pathname = usePathname();
  const { categorySlug, productId } = useParams();
  // Verificar se estamos em qualquer página da loja (navegação principal)
  const isInStoreNavigation = () => {
    // Verificar se estamos na página inicial da loja
    if (pathname === `/${slug}`) return true;

    // Verificar se estamos em páginas específicas da loja
    const storeNavRoutes = [
      `/${slug}/product`,
      `/${slug}/product/${productId}`,
      `/${slug}/categorias`,
      `/${slug}/categorias/${categorySlug}`,
      `/${slug}/ofertas`,
      `/${slug}/suporte`,
      `/${slug}/menu`,
    ];

    if (storeNavRoutes.includes(pathname)) return true;

    // Verificar se estamos em uma página de produto (começa com /${slug}/product/)
    if (pathname.startsWith(`/${slug}/product/`)) return true;

    return false;
  };

  return (
    <menu className="fixed right-0 bottom-0 left-0 z-50 bg-[var(--foreground)]">
      <ul className="flex content-center items-center justify-center gap-x-2 text-white">
        <li className="flex items-center justify-center gap-3 px-8 py-3">
          <Link href={`/${slug}/`}>
            <House
              className={`h-6 w-6 ${isInStoreNavigation() ? "menu-item-active" : ""}`}
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
