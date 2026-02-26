import type { CSSProperties } from "react";

import { FeaturedSection } from "@/components/home/featured-section";
import { HeroSection } from "@/components/home/hero-section";
import { buildHomeContent } from "@/components/home/home-data";
import { PromoSection } from "@/components/home/promo-section";
import { StorySection } from "@/components/home/story-section";
import type { HomeFeaturedProductInput } from "@/components/home/types";
import { cn } from "@/lib/utils";

import styles from "./home-page-content.module.scss";

const fontVariablesStyle = {
  "--font-arimo": '"Arimo", "Segoe UI", Arial, sans-serif',
  "--font-space-grotesk": '"Space Grotesk", "Arial Black", sans-serif',
} as CSSProperties;

type HomePageContentProps = {
  featuredProducts: HomeFeaturedProductInput[];
};

export function HomePageContent({ featuredProducts }: HomePageContentProps) {
  const content = buildHomeContent(featuredProducts);

  return (
    <div
      style={fontVariablesStyle}
      className={cn(
        styles.pageBackdrop,
        "relative min-h-screen overflow-hidden bg-[#f6f8ff] text-[#0f172a] dark:bg-[#0b0d10] dark:text-[#f1f3f5]",
      )}
    >
      <div className={styles.mesh} aria-hidden />

      <main className="relative z-10 flex flex-col gap-16 pb-14 sm:gap-20 sm:pb-16">
        <HeroSection
          badge={content.hero.badge}
          title={content.hero.title}
          description={content.hero.description}
          actions={content.hero.actions}
          className={styles.reveal}
        />

        <FeaturedSection
          title={content.featured.title}
          subtitle={content.featured.subtitle}
          viewAllHref={content.featured.viewAllHref}
          products={content.featured.products}
          className={cn(styles.reveal, styles.delayOne)}
        />

        <StorySection
          title={content.story.title}
          description={content.story.description}
          bullets={content.story.bullets}
          action={content.story.action}
          className={cn(styles.reveal, styles.delayTwo)}
        />

        <PromoSection
          title={content.promo.title}
          description={content.promo.description}
          actions={content.promo.actions}
          className={cn(styles.reveal, styles.delayThree)}
        />
      </main>
    </div>
  );
}
