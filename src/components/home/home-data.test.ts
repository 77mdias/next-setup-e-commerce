import { describe, expect, it } from "vitest";

import { buildHomeContent } from "@/components/home/home-data";
import { ROUTE_PATHS } from "@/lib/routes";

describe("home content builder", () => {
  it("keeps critical public navigation and action links", () => {
    const content = buildHomeContent();

    expect(content.navigation.links.map((link) => link.href)).toEqual([
      ROUTE_PATHS.home,
      ROUTE_PATHS.products,
      ROUTE_PATHS.products,
      ROUTE_PATHS.orders,
    ]);
    expect(content.navigation.wishlistHref).toBe(ROUTE_PATHS.wishlist);
    expect(content.navigation.cartHref).toBe(ROUTE_PATHS.cart);
    expect(content.navigation.profileHref).toBe(ROUTE_PATHS.profile);

    expect(content.hero.actions.map((action) => action.href)).toEqual([
      ROUTE_PATHS.products,
      ROUTE_PATHS.products,
    ]);
    expect(content.featured.viewAllHref).toBe(ROUTE_PATHS.products);
    expect(content.promo.actions[0]?.href).toBe(ROUTE_PATHS.explore);
  });

  it("uses fallback featured products when no dynamic products are provided", () => {
    const content = buildHomeContent([]);

    expect(content.featured.products).toHaveLength(4);
    expect(content.featured.products[0]?.id).toBe("razer-basilisk-v3-pro");
    expect(content.featured.products[1]?.badge?.label).toBe("Sale");
  });

  it("maps dynamic featured products without losing canonical route and badge data", () => {
    const content = buildHomeContent([
      {
        id: "prod-1",
        category: "Mice",
        name: "Precision Mouse",
        price: "$100.00",
        previousPrice: "$120.00",
        rating: "4.9",
        imageSrc: "/images/custom.png",
        imageAlt: "Mouse image",
        href: "/product/prod-1",
        isOnSale: true,
        isFeatured: true,
      },
      {
        id: "prod-2",
        category: "Audio",
        name: "Studio Headset",
        price: "$240.00",
        rating: "4.7",
        imageSrc: "/images/custom-2.png",
        imageAlt: "Headset image",
        href: "/unexpected-path",
        isFeatured: true,
      },
    ]);

    const [first, second] = content.featured.products;

    expect(first?.href).toBe("/product/prod-1");
    expect(first?.badge).toEqual({ label: "Sale", tone: "pink" });

    expect(second?.href).toBe("/product/prod-2");
    expect(second?.badge).toEqual({ label: "New", tone: "blue" });
  });
});
