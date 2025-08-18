"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";

const Nav = () => {
  const { slug } = useParams();
  const pathname = usePathname();

  return (
    <NavigationMenu className="flex px-4 pt-6">
      <NavigationMenuList>
        <NavigationMenuItem className="rounded-full bg-[var(--card-categorys)] text-[var(--text-primary)]">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 ${
              pathname === `/${slug}`
                ? "bg-[var(--card-categorys-isActive)]"
                : "bg-[var(--card-categorys)]"
            } transition-colors duration-300 hover:bg-[var(--text-card-categorys-isActive)]`}
          >
            <Link
              href={`/${slug}`}
              className={`text-sm font-medium ${
                pathname === `/${slug}`
                  ? "text-[var(--text-card-categorys-isActive)]"
                  : "text-[var(--text-primary)]"
              } transition-colors duration-300 hover:text-[var(--text-card-categorys-isActive)]`}
            >
              Tudo
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="rounded-full bg-[var(--card-categorys)] text-[var(--text-primary)]">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 ${
              pathname === `/${slug}/categorias`
                ? "bg-[var(--card-categorys-isActive)]"
                : "bg-[var(--card-categorys)]"
            } transition-colors duration-300 hover:bg-[var(--text-card-categorys-isActive)]`}
          >
            <Link
              href={`/${slug}/categorias`}
              className={`text-sm font-medium ${
                pathname === `/${slug}/categorias`
                  ? "text-[var(--text-card-categorys-isActive)]"
                  : "text-[var(--text-primary)]"
              } transition-colors duration-300 hover:text-[var(--text-card-categorys-isActive)]`}
            >
              Categorias
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="rounded-full bg-[var(--card-categorys)] text-[var(--text-primary)]">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 ${
              pathname === `/${slug}/ofertas`
                ? "bg-[var(--card-categorys-isActive)]"
                : "bg-[var(--card-categorys)]"
            } transition-colors duration-300 hover:bg-[var(--text-card-categorys-isActive)]`}
          >
            <Link
              href={`/${slug}/ofertas`}
              className={`text-sm font-medium ${
                pathname === `/${slug}/ofertas`
                  ? "text-[var(--text-card-categorys-isActive)]"
                  : "text-[var(--text-primary)]"
              } transition-colors duration-300 hover:text-[var(--text-card-categorys-isActive)]`}
            >
              Ofertas
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="rounded-full bg-[var(--card-categorys)] text-[var(--text-primary)]">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 ${
              pathname === `/${slug}/suporte`
                ? "bg-[var(--card-categorys-isActive)]"
                : "bg-[var(--card-categorys)]"
            } transition-colors duration-300 hover:bg-[var(--text-card-categorys-isActive)]`}
          >
            <Link href={`/${slug}/suporte`}>Suporte</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default Nav;
