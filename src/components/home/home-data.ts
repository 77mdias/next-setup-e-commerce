import type {
  FeaturedProduct,
  FooterColumn,
  HomeContent,
  HomeFeaturedProductInput,
} from "@/components/home/types";

function buildBasePath(storeSlug: string) {
  return `/${storeSlug}`;
}

function buildFooterColumns(basePath: string): FooterColumn[] {
  return [
    {
      title: "Shop",
      links: [
        { label: "All Products", href: "/products" },
        { label: "Peripherals", href: `${basePath}/categorias` },
        { label: "Audio", href: "/products" },
        { label: "Accessories", href: "/products" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Order Status", href: `${basePath}/pedido` },
        { label: "Shipping & Returns", href: `${basePath}/suporte` },
        { label: "FAQ", href: `${basePath}/suporte` },
        { label: "Contact Us", href: `${basePath}/suporte` },
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
}

function buildFallbackProducts(basePath: string): FeaturedProduct[] {
  return [
    {
      id: "razer-basilisk-v3-pro",
      category: "Mice",
      name: "Razer Basilisk V3 Pro",
      price: "$159.99",
      rating: "4.8",
      imageSrc: "/images/home/card-razer-node.png",
      imageAlt: "Razer Basilisk V3 Pro mouse",
      href: "/products",
      badge: {
        label: "New",
        tone: "blue",
      },
    },
    {
      id: "logitech-g915-tkl",
      category: "Keyboards",
      name: "Logitech G915 TKL",
      price: "$229.99",
      previousPrice: "$249.99",
      rating: "4.9",
      imageSrc: "/images/home/card-logitech-node.png",
      imageAlt: "Logitech G915 TKL keyboard",
      href: "/products",
      badge: {
        label: "Sale",
        tone: "pink",
      },
    },
    {
      id: "steelseries-arctis-nova-pro",
      category: "Audio",
      name: "SteelSeries Arctis Nova Pro",
      price: "$349.99",
      rating: "4.7",
      imageSrc: "/images/home/card-steelseries-node.png",
      imageAlt: "SteelSeries Arctis Nova Pro headset",
      href: "/products",
    },
    {
      id: "samsung-odyssey-g9",
      category: "Monitors",
      name: "Samsung Odyssey G9",
      price: "$1299.99",
      rating: "4.6",
      imageSrc: "/images/home/card-samsung-node.png",
      imageAlt: "Samsung Odyssey G9 monitor",
      href: "/products",
      badge: {
        label: "New",
        tone: "blue",
      },
    },
  ];
}

function mapFeaturedProducts(
  basePath: string,
  products?: HomeFeaturedProductInput[],
): FeaturedProduct[] {
  if (!products || products.length === 0) {
    return buildFallbackProducts(basePath);
  }

  return products.map((product) => {
    const badge = product.isOnSale
      ? { label: "Sale", tone: "pink" as const }
      : product.isFeatured
        ? { label: "New", tone: "blue" as const }
        : undefined;

    return {
      id: product.id,
      category: product.category,
      name: product.name,
      price: product.price,
      previousPrice: product.previousPrice,
      rating: product.rating,
      imageSrc: product.imageSrc,
      imageAlt: product.imageAlt,
      href: product.href || `/product/${product.id}`,
      badge,
    };
  });
}

export function buildHomeContent(
  storeSlug: string,
  featuredProducts?: HomeFeaturedProductInput[],
): HomeContent {
  const basePath = buildBasePath(storeSlug);

  return {
    navigation: {
      links: [
        { label: "Home", href: basePath, isActive: true },
        { label: "Products", href: "/products" },
        { label: "Categories", href: `${basePath}/categorias` },
        { label: "Orders", href: `${basePath}/pedido` },
      ],
      searchHref: "/products",
      wishlistHref: `${basePath}/wishlist`,
      cartHref: `${basePath}/carrinho`,
      profileHref: `${basePath}/perfil`,
    },
    hero: {
      badge: "New Collection 2026",
      title: {
        lineOne: "ELEVATE YOUR",
        lineTwo: "DIGITAL REALITY",
      },
      description:
        "Premium gaming peripherals designed for the modern melancholic aesthetic. Precision engineering meets minimalist design.",
      actions: [
        {
          label: "Shop Now",
          href: "/products",
          variant: "primary",
        },
        {
          label: "View Collections",
          href: `${basePath}/categorias`,
          variant: "secondary",
        },
      ],
    },
    featured: {
      title: "Featured Gear",
      subtitle: "Curated selection for the elite.",
      viewAllHref: "/products",
      products: mapFeaturedProducts(basePath, featuredProducts),
    },
    story: {
      title: {
        lineOne: "Forged in Shadows,",
        lineTwo: "Defined by Light.",
      },
      description:
        "Nexus isn't just a store. It's a statement. We believe that your setup reflects your soul. Our products are chosen not just for their specs, but for their ability to transform your environment into a sanctuary.",
      bullets: [
        { id: "materials", label: "Premium Materials & Build Quality" },
        { id: "rgb", label: "Immersive RGB Integration" },
        { id: "ergonomic", label: "Ergonomic Design for Marathon Sessions" },
        { id: "warranty", label: "2-Year Warranty on All Products" },
      ],
      action: {
        label: "Discover Our Story",
        href: `${basePath}/suporte`,
      },
    },
    promo: {
      title: "Level Up Your Setup",
      description:
        "Get up to 30% off on selected mechanical keyboards this week. Don't miss out on the ultimate typing experience.",
      actions: [
        {
          label: "Shop Sale",
          href: `${basePath}/ofertas`,
          variant: "primary",
        },
        {
          label: "Learn More",
          href: `${basePath}/suporte`,
          variant: "secondary",
        },
      ],
    },
    footer: {
      description:
        "Premium gaming gear for the modern player. Elevate your setup with our curated collection of high-performance peripherals.",
      columns: buildFooterColumns(basePath),
      copyright: "© 2026 Nexus Gaming. All rights reserved.",
      legalLinks: [
        { label: "Privacy Policy", href: `${basePath}/suporte` },
        { label: "Terms of Service", href: `${basePath}/suporte` },
      ],
    },
  };
}
