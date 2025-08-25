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
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;
  const categorySlug = params.categorySlug as string;
  const productId = params.productId as string;
  return (
    <NavigationMenu className="flex flex-wrap px-4 pt-6">
      <NavigationMenuList className="flex flex-wrap justify-center">
        <NavigationMenuItem className="rounded-full">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 transition-colors duration-300 ${
              pathname === `/${slug}`
                ? "nav-item-active hover:nav-item-active"
                : "nav-item-inactive hover:nav-item-active"
            }`}
          >
            <Link
              href={`/${slug}`}
              className="text-sm font-medium transition-colors duration-300"
            >
              Início
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="rounded-full">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 transition-colors duration-300 ${
              pathname === `/${slug}/product` ||
              pathname === `/${slug}/product/${productId}`
                ? "nav-item-active hover:nav-item-active"
                : "nav-item-inactive hover:nav-item-active"
            }`}
          >
            <Link
              href={`/${slug}/product`}
              className="text-sm font-medium transition-colors duration-300"
            >
              Produtos
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="rounded-full">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 transition-colors duration-300 ${
              pathname === `/${slug}/categorias` ||
              pathname === `/${slug}/categorias/${categorySlug}`
                ? "nav-item-active hover:nav-item-active"
                : "nav-item-inactive hover:nav-item-active"
            }`}
          >
            <Link
              href={`/${slug}/categorias`}
              className="text-sm font-medium transition-colors duration-300"
            >
              Categorias
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem className="rounded-full">
          <NavigationMenuLink
            asChild
            className={`rounded-full px-4 py-2 transition-colors duration-300 ${
              pathname === `/${slug}/ofertas`
                ? "nav-item-active hover:nav-item-active"
                : "nav-item-inactive hover:nav-item-active"
            }`}
          >
            <Link
              href={`/${slug}/ofertas`}
              className="text-sm font-medium transition-colors duration-300"
            >
              Ofertas
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};

export default Nav;
