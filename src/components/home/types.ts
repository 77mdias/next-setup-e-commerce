export type NavigationLink = {
  label: string;
  href: string;
  isActive?: boolean;
};

export type HeroAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type FeaturedProduct = {
  id: string;
  category: string;
  name: string;
  price: string;
  previousPrice?: string;
  rating: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  badge?: {
    label: string;
    tone: "pink" | "blue";
  };
};

export type HomeFeaturedProductInput = {
  id: string;
  category: string;
  name: string;
  price: string;
  previousPrice?: string;
  rating: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
  isOnSale?: boolean;
  isFeatured?: boolean;
};

export type StoryBullet = {
  id: string;
  label: string;
};

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export type HomeContent = {
  navigation: {
    links: NavigationLink[];
    searchHref: string;
    wishlistHref: string;
    cartHref: string;
    profileHref: string;
  };
  hero: {
    badge: string;
    title: {
      lineOne: string;
      lineTwo: string;
    };
    description: string;
    actions: HeroAction[];
  };
  featured: {
    title: string;
    subtitle: string;
    viewAllHref: string;
    products: FeaturedProduct[];
  };
  story: {
    title: {
      lineOne: string;
      lineTwo: string;
    };
    description: string;
    bullets: StoryBullet[];
    action: {
      label: string;
      href: string;
    };
  };
  promo: {
    title: string;
    description: string;
    actions: HeroAction[];
  };
  footer: {
    description: string;
    columns: FooterColumn[];
    copyright: string;
    legalLinks: FooterLink[];
  };
};
