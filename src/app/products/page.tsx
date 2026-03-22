import { Suspense } from "react";
import type { CSSProperties } from "react";

import { ProductsCatalog } from "@/components/products/products-catalog";

const fontVariablesStyle = {
  "--font-arimo": '"Arimo", "Segoe UI", Arial, sans-serif',
  "--font-space-grotesk": '"Space Grotesk", "Arial Black", sans-serif',
} as CSSProperties;

export default function ProductsPage() {
  return (
    <main
      style={fontVariablesStyle}
      className="min-h-screen bg-[#efebe3] px-4 py-14 text-[#11100d] sm:px-6 sm:py-16 lg:px-8 dark:bg-[#11100d] dark:text-[#f2eee8]"
    >
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-[1536px] rounded-2xl border border-[#d8cfbf] bg-[#f4efe5] p-7 text-sm text-[#655a4e] sm:p-8 dark:border-white/10 dark:bg-[#1b1712] dark:text-[#b8ad9f]">
            Carregando produtos...
          </div>
        }
      >
        <ProductsCatalog />
      </Suspense>
    </main>
  );
}
