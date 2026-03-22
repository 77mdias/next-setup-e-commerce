import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Cpu, Flame, Monitor, Shield } from "lucide-react";

import { formatCurrency } from "@/helpers/format-currency";
import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";
import { cn } from "@/lib/utils";

export type ExploreAccent = "pink" | "blue";

export type ExploreProductCardData = {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  href: string;
};

export type ExploreSectionData = {
  id: string;
  intro: string;
  heading: string;
  subheading: string;
  accent: ExploreAccent;
  backgroundSrc: string;
  mediaOnLeft: boolean;
  products: ExploreProductCardData[];
  ctaHref: string;
};

type ExplorePageContentProps = {
  sections: ExploreSectionData[];
  hasProducts: boolean;
  productListHref?: string;
  categoriesHref?: string;
};

const sectionIcons: Record<string, LucideIcon> = {
  "cyber-warfare": Flame,
  "stealth-ops": Shield,
  "neon-city": Monitor,
  "future-tech": Cpu,
};

const accentMap: Record<
  ExploreAccent,
  {
    border: string;
    text: string;
    badge: string;
    dot: string;
    button: string;
    icon: string;
  }
> = {
  pink: {
    border: "border-[#916130] dark:border-[#d6a56f]",
    text: "text-[#7b5429] dark:text-[#d6a56f]",
    badge: "bg-[#7b5429]/22 dark:bg-[#d6a56f]/24",
    dot: "bg-[#916130] dark:bg-[#d6a56f]",
    button:
      "hover:border-[#916130]/55 hover:bg-[#916130]/10 dark:hover:border-[#d6a56f]/45 dark:hover:bg-[#d6a56f]/10",
    icon: "text-[#7b5429] dark:text-[#d6a56f]",
  },
  blue: {
    border: "border-[#59627a] dark:border-[#9ca4ba]",
    text: "text-[#50586c] dark:text-[#b7bed1]",
    badge: "bg-[#59627a]/22 dark:bg-[#8f98af]/22",
    dot: "bg-[#59627a] dark:bg-[#b7bed1]",
    button:
      "hover:border-[#59627a]/55 hover:bg-[#59627a]/9 dark:hover:border-[#9ca4ba]/50 dark:hover:bg-[#9ca4ba]/10",
    icon: "text-[#59627a] dark:text-[#b7bed1]",
  },
};

function ExploreProductCard({
  product,
  accent,
}: {
  product: ExploreProductCardData;
  accent: ExploreAccent;
}) {
  const accentStyles = accentMap[accent];
  const imageSrc = normalizeProductImageSrc(
    product.imageUrl,
    "/images/home/card-razer-node.png",
  );

  return (
    <article>
      <Link href={product.href} className="group block">
        <div className="relative overflow-hidden rounded-[20px] border border-[#11100d]/14 bg-[#f6f2e9] shadow-[0_18px_34px_-24px_rgba(17,16,13,0.9)] dark:border-[#f2eee8]/12 dark:bg-[#17140f] dark:shadow-[0_18px_34px_-24px_rgba(0,0,0,0.95)]">
          <div className="relative aspect-[320/180]">
            <Image
              src={imageSrc}
              alt={`Imagem do produto ${product.name}`}
              fill
              className="object-cover opacity-92 transition-transform duration-500 group-hover:scale-105 dark:opacity-72"
              unoptimized={shouldUseUnoptimizedImage(imageSrc)}
              sizes="(min-width: 1280px) 320px, (min-width: 768px) 30vw, 95vw"
            />
          </div>

          <span className="absolute top-2 right-2 rounded-full border border-[#f2eee8]/30 bg-[#11100d]/80 px-2.5 py-1 [font-family:var(--font-arimo)] text-[11px] text-[#f2eee8]">
            {formatCurrency(product.price)}
          </span>

          {product.originalPrice && product.originalPrice > product.price && (
            <span
              className={cn(
                "absolute top-2 left-2 rounded-full border px-2.5 py-1 [font-family:var(--font-arimo)] text-[10px] tracking-[0.12em] text-[#f2eee8] uppercase",
                accentStyles.badge,
              )}
            >
              SALE
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <h4 className="line-clamp-1 [font-family:var(--font-space-grotesk)] text-lg font-semibold text-[#11100d] transition-colors group-hover:text-[#2e2a24] dark:text-[#f2eee8] dark:group-hover:text-[#d6cfc4]">
            {product.name}
          </h4>
          <p className="font-mono text-xs tracking-[0.08em] text-[#655a4e] uppercase dark:text-[#9f9383]">
            {product.categoryName}
          </p>
        </div>
      </Link>
    </article>
  );
}

function ExploreSection({ section }: { section: ExploreSectionData }) {
  const accentStyles = accentMap[section.accent];
  const sectionIcon = sectionIcons[section.id] ?? Flame;
  const Icon = sectionIcon;

  const contentBlock = (
    <div className="border-t border-[#11100d]/12 bg-[#f4efe5] p-7 sm:p-10 lg:border-t-0 lg:p-14 dark:border-[#f2eee8]/12 dark:bg-[#16130f]">
      <div className="flex h-full flex-col gap-10">
        <p
          className={cn(
            "border-l-2 pl-5 [font-family:var(--font-arimo)] text-base leading-relaxed text-[#403930] dark:text-[#b8ad9f]",
            accentStyles.border,
          )}
        >
          {section.intro}
        </p>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <h3 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold tracking-[-0.01em] text-[#11100d] sm:text-[24px] dark:text-[#f2eee8]">
              FEATURED ARTIFACTS
            </h3>
            <ArrowRight className={cn("h-5 w-5", accentStyles.icon)} />
          </div>

          {section.products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {section.products.map((product) => (
                <ExploreProductCard
                  key={product.id}
                  product={product}
                  accent={section.accent}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[#11100d]/14 bg-[#f8f4ec] p-6 [font-family:var(--font-arimo)] text-sm text-[#403930] dark:border-[#f2eee8]/12 dark:bg-[#1b1712] dark:text-[#b8ad9f]">
              Nenhum produto disponivel para esta colecao no momento.
            </div>
          )}

          <Link
            href={section.ctaHref}
            className={cn(
              "inline-flex h-12 items-center gap-2 rounded-full border border-[#11100d]/28 bg-transparent px-6 [font-family:var(--font-space-grotesk)] text-sm tracking-[0.12em] text-[#11100d] uppercase transition-colors hover:bg-[#11100d]/6 dark:border-[#f2eee8]/22 dark:text-[#f2eee8] dark:hover:bg-[#f2eee8]/10",
              accentStyles.button,
            )}
          >
            Explore Collection
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  const mediaBlock = (
    <div className="relative min-h-[360px] overflow-hidden border-y border-[#11100d]/12 sm:min-h-[520px] dark:border-[#f2eee8]/10">
      <Image
        src={section.backgroundSrc}
        alt={`Background da secao ${section.heading}`}
        fill
        className="object-cover"
        sizes="(min-width: 1280px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-black/36 dark:bg-black/48" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#11100d]/52 via-transparent to-[#11100d]/22 dark:from-black/62 dark:to-black/36" />

      <div className="absolute right-6 bottom-6 left-6 max-w-[480px] rounded-[18px] border border-[#f2eee8]/20 bg-[#11100d]/62 p-4 backdrop-blur-md sm:bottom-12 sm:left-12 sm:p-5 dark:border-[#f2eee8]/14 dark:bg-black/56">
        <span
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full",
            accentStyles.badge,
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </span>

        <h3 className="[font-family:var(--font-space-grotesk)] text-3xl leading-none font-bold tracking-[-0.04em] text-[#f2eee8] uppercase sm:text-5xl">
          {section.heading}
        </h3>

        <p
          className={cn(
            "mt-2 [font-family:var(--font-arimo)] text-xs font-bold tracking-[0.2em] uppercase",
            accentStyles.text,
          )}
        >
          {section.subheading}
        </p>

        <span
          className={cn("mt-3 block h-1 w-20 rounded-full", accentStyles.dot)}
        />
      </div>
    </div>
  );

  return (
    <section className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10">
      <div className="grid overflow-hidden rounded-[28px] border border-[#11100d]/14 bg-[#f4efe5] shadow-[0_28px_52px_-42px_rgba(17,16,13,0.95)] lg:grid-cols-2 dark:border-[#f2eee8]/10 dark:bg-[#14110d] dark:shadow-[0_28px_58px_-46px_rgba(0,0,0,0.98)]">
        {section.mediaOnLeft ? (
          <>
            {mediaBlock}
            {contentBlock}
          </>
        ) : (
          <>
            {contentBlock}
            {mediaBlock}
          </>
        )}
      </div>
    </section>
  );
}

export function ExplorePageContent({
  sections,
  hasProducts,
  productListHref = "/products",
  categoriesHref = "/products",
}: ExplorePageContentProps) {
  return (
    <main className="bg-[#efebe3] text-[#11100d] dark:bg-[#11100d] dark:text-[#f2eee8]">
      <section className="relative min-h-[460px] overflow-hidden border-y border-[#11100d]/14 sm:min-h-[520px] dark:border-[#f2eee8]/10">
        <Image
          src="/images/explore/explore-hero-bg.png"
          alt="Hero explore"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#11100d]/52 dark:bg-black/56" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#11100d]/72 via-[#11100d]/25 to-[#11100d]/74 dark:from-black/78 dark:via-black/30 dark:to-black/78" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_28%,rgba(214,165,111,0.2),transparent_58%)] dark:bg-[radial-gradient(circle_at_52%_28%,rgba(214,165,111,0.28),transparent_58%)]" />

        <div className="relative mx-auto flex min-h-[460px] max-w-[900px] flex-col items-center justify-center px-6 pt-12 pb-14 text-center sm:min-h-[520px]">
          <p className="[font-family:var(--font-arimo)] text-xs tracking-[0.2em] text-[#d7c6b0] uppercase">
            Curated Collections
          </p>
          <h1 className="mt-3 [font-family:var(--font-space-grotesk)] text-4xl font-bold tracking-[-0.05em] text-[#f2eee8] uppercase drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
            THE NEXUS ARCHIVES
          </h1>
          <p className="mt-4 max-w-[760px] [font-family:var(--font-arimo)] text-lg leading-relaxed tracking-[0.02em] text-[#d7cdc1] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] sm:text-xl dark:text-[#b8ad9f]">
            Curated collections of high-performance gear for the digital
            avant-garde.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={productListHref}
              className="inline-flex h-11 items-center rounded-full border border-[#f2eee8]/18 bg-[#11100d] px-6 [font-family:var(--font-space-grotesk)] text-sm tracking-[0.08em] text-[#f2eee8] uppercase transition-colors hover:bg-[#2b2721]"
            >
              Shop Products
            </Link>
            <Link
              href={categoriesHref}
              className="inline-flex h-11 items-center rounded-full border border-[#f2eee8]/40 bg-[#f2eee8]/10 px-6 [font-family:var(--font-space-grotesk)] text-sm tracking-[0.08em] text-[#f2eee8] uppercase transition-colors hover:bg-[#f2eee8]/20 dark:border-[#f2eee8]/28 dark:bg-transparent dark:hover:bg-[#f2eee8]/12"
            >
              View Categories
            </Link>
          </div>

          {!hasProducts && (
            <p className="mt-6 rounded-full border border-[#f2eee8]/30 bg-[#11100d]/62 px-4 py-2 [font-family:var(--font-arimo)] text-sm text-[#e8dfd2] dark:border-[#f2eee8]/18 dark:bg-black/45 dark:text-[#b8ad9f]">
              Nenhum produto ativo encontrado no banco para montar as secoes.
            </p>
          )}
        </div>
      </section>

      <div className="space-y-10 py-10 sm:space-y-12 sm:py-12">
        {sections.map((section) => (
          <ExploreSection key={section.id} section={section} />
        ))}
      </div>
    </main>
  );
}
