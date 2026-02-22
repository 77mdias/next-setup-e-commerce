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
    border: "border-[#ff2e63]",
    text: "text-[#ff2e63]",
    badge: "bg-[#ff2e63]/20",
    dot: "bg-[#ff2e63]",
    button: "hover:border-[#ff2e63]/55 hover:bg-[#ff2e63]/10",
    icon: "text-[#ff2e63]",
  },
  blue: {
    border: "border-[#5c7cfa]",
    text: "text-[#5c7cfa]",
    badge: "bg-[#5c7cfa]/20",
    dot: "bg-[#5c7cfa]",
    button: "hover:border-[#5c7cfa]/55 hover:bg-[#5c7cfa]/10",
    icon: "text-[#5c7cfa]",
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
        <div className="relative overflow-hidden rounded-lg border border-[#c4d3f8] bg-white shadow-[0_10px_30px_rgba(74,108,190,0.12)] dark:border-white/8 dark:bg-[#101828] dark:shadow-none">
          <div className="relative aspect-[320/180]">
            <Image
              src={imageSrc}
              alt={`Imagem do produto ${product.name}`}
              fill
              className="object-cover opacity-95 transition-transform duration-500 group-hover:scale-105 dark:opacity-75"
              unoptimized={shouldUseUnoptimizedImage(imageSrc)}
              sizes="(min-width: 1280px) 320px, (min-width: 768px) 30vw, 95vw"
            />
          </div>

          <span className="absolute top-2 right-2 rounded-md border border-white/20 bg-black/75 px-2 py-1 font-mono text-xs text-white">
            {formatCurrency(product.price)}
          </span>

          {product.originalPrice && product.originalPrice > product.price && (
            <span
              className={cn(
                "absolute top-2 left-2 rounded-md px-2 py-1 font-mono text-[11px] tracking-[0.08em] text-[#0b0d10] uppercase",
                accentStyles.badge,
              )}
            >
              SALE
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <h4 className="line-clamp-1 [font-family:var(--font-space-grotesk)] text-lg font-normal text-[#0f172a] transition-colors group-hover:text-[#334155] dark:text-white dark:group-hover:text-[#dbe4ff]">
            {product.name}
          </h4>
          <p className="font-mono text-xs tracking-[0.08em] text-[#64748b] uppercase dark:text-[#6a7282]">
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
    <div className="bg-gradient-to-b from-[#f8faff] to-[#eef2ff] p-7 sm:p-10 lg:p-14 dark:from-[#0b0d10] dark:to-[#0b0d10]">
      <div className="flex h-full flex-col gap-10">
        <p
          className={cn(
            "border-l-2 pl-5 [font-family:var(--font-arimo)] text-base leading-relaxed text-[#334155] dark:text-[#99a1af]",
            accentStyles.border,
          )}
        >
          {section.intro}
        </p>

        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <h3 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold text-[#0f172a] sm:text-[24px] dark:text-white">
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
            <div className="rounded-xl border border-[#c4d3f8] bg-white p-6 [font-family:var(--font-arimo)] text-sm text-[#334155] dark:border-white/10 dark:bg-white/2 dark:text-[#99a1af]">
              Nenhum produto disponivel para esta colecao no momento.
            </div>
          )}

          <Link
            href={section.ctaHref}
            className={cn(
              "inline-flex h-12 items-center gap-2 rounded-md border border-[#a7bce9] bg-white/75 px-6 [font-family:var(--font-space-grotesk)] text-sm tracking-[0.12em] text-[#0f172a] uppercase transition-colors hover:bg-white dark:border-white/20 dark:bg-transparent dark:text-white dark:hover:bg-white/10",
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
    <div className="relative min-h-[420px] overflow-hidden border-y border-[#dbe4ff] sm:min-h-[520px] dark:border-white/5">
      <Image
        src={section.backgroundSrc}
        alt={`Background da secao ${section.heading}`}
        fill
        className="object-cover"
        sizes="(min-width: 1280px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-black/22 dark:bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/35 via-transparent to-transparent dark:from-[#0b0d10] dark:via-transparent" />

      <div className="absolute right-6 bottom-6 left-6 max-w-[480px] rounded-xl border border-white/20 bg-[#0f172a]/65 p-4 backdrop-blur-sm sm:bottom-12 sm:left-12 sm:p-5 dark:border-white/10 dark:bg-black/55">
        <span
          className={cn(
            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg",
            accentStyles.badge,
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </span>

        <h3 className="[font-family:var(--font-space-grotesk)] text-3xl leading-none font-bold tracking-[-0.04em] text-white uppercase sm:text-5xl">
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
    <section className="grid border-t border-[#dbe4ff] lg:grid-cols-2 dark:border-white/5">
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
    <main className="bg-[#eef2ff] text-[#0f172a] dark:bg-[#0b0d10] dark:text-white">
      <section className="relative min-h-[460px] overflow-hidden border-t border-[#dbe4ff] sm:min-h-[520px] dark:border-white/5">
        <Image
          src="/images/explore/explore-hero-bg.png"
          alt="Hero explore"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0f172a]/38 dark:bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/52 via-[#0f172a]/22 to-[#e8edff]/82 dark:from-[#0b0d10]/70 dark:via-transparent dark:to-[#0b0d10]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,46,99,0.16),transparent_58%),radial-gradient(circle_at_50%_35%,rgba(92,124,250,0.16),transparent_68%)] dark:bg-[radial-gradient(circle_at_50%_35%,rgba(255,46,99,0.22),transparent_58%),radial-gradient(circle_at_50%_35%,rgba(92,124,250,0.16),transparent_68%)]" />

        <div className="relative mx-auto flex min-h-[460px] max-w-[900px] flex-col items-center justify-center px-6 pt-12 pb-14 text-center sm:min-h-[520px]">
          <h1 className="[font-family:var(--font-space-grotesk)] text-4xl font-bold tracking-[-0.05em] text-white uppercase drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] sm:text-6xl lg:text-7xl">
            THE NEXUS ARCHIVES
          </h1>
          <p className="mt-4 max-w-[760px] [font-family:var(--font-arimo)] text-lg leading-relaxed tracking-[0.02em] text-[#e2e8f0] drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)] sm:text-xl dark:text-[#99a1af]">
            Curated collections of high-performance gear for the digital
            avant-garde.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={productListHref}
              className="inline-flex h-11 items-center rounded-md bg-[#ff2e63] px-6 [font-family:var(--font-space-grotesk)] text-sm tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#e42859]"
            >
              Shop Products
            </Link>
            <Link
              href={categoriesHref}
              className="inline-flex h-11 items-center rounded-md border border-white/35 bg-white/12 px-6 [font-family:var(--font-space-grotesk)] text-sm tracking-[0.08em] text-white uppercase transition-colors hover:bg-white/18 dark:border-white/25 dark:bg-transparent dark:text-white dark:hover:bg-white/10"
            >
              View Categories
            </Link>
          </div>

          {!hasProducts && (
            <p className="mt-6 rounded-lg border border-[#c4d3f8] bg-white/85 px-4 py-2 [font-family:var(--font-arimo)] text-sm text-[#334155] dark:border-white/10 dark:bg-black/35 dark:text-[#99a1af]">
              Nenhum produto ativo encontrado no banco para montar as secoes.
            </p>
          )}
        </div>
      </section>

      {sections.map((section) => (
        <ExploreSection key={section.id} section={section} />
      ))}
    </main>
  );
}
