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
      className="min-h-screen bg-[#f6f8ff] px-4 py-14 text-[#0f172a] sm:px-6 sm:py-16 lg:px-8 dark:bg-[#0b0d10] dark:text-[#f1f3f5]"
    >
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-[1536px] rounded-2xl border border-[#dbe4ff] bg-[#edf2ff] p-7 text-sm text-[#64748b] sm:p-8 dark:border-white/10 dark:bg-[#171a21] dark:text-[#99a1af]">
            Carregando produtos...
          </div>
        }
      >
        <ProductsCatalog />
      </Suspense>
    </main>
  );
}
