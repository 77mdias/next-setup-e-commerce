"use client";

import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";

interface ScrollToTopProps {
  threshold?: number;
  smooth?: boolean;
  className?: string;
  useScrollArea?: boolean;
}

export function ScrollToTop({
  threshold = 2400,
  smooth = true,
  className = "",
  useScrollArea = false,
}: ScrollToTopProps = {}) {
  const { showScrollToTop, scrollToTop } = useScrollToTop({
    threshold,
    smooth,
    useScrollArea,
  });

  return (
    <div
      className={`fixed right-6 bottom-6 z-50 transition-all duration-700 ease-out ${
        showScrollToTop
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-75 opacity-0"
      } `}
    >
      <Button
        onClick={scrollToTop}
        className={`group scroll-to-top-float scroll-to-top-pulse relative h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-[var(--button-primary)] via-[var(--button-primary)] to-[var(--text-price-secondary)] p-0 shadow-2xl backdrop-blur-sm transition-all duration-500 ease-out hover:scale-110 hover:shadow-[0_25px_50px_rgba(220,38,127,0.5)] active:scale-95 ${className} `}
        aria-label="Voltar ao topo"
      >
        {/* Efeito de partículas animadas */}
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div
            className="scroll-to-top-sparkle absolute top-1/4 left-1/4 h-1 w-1 rounded-full bg-white/60"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="scroll-to-top-sparkle absolute top-1/3 right-1/3 h-1 w-1 rounded-full bg-white/40"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="scroll-to-top-sparkle absolute bottom-1/3 left-1/3 h-1 w-1 rounded-full bg-white/50"
            style={{ animationDelay: "0.4s" }}
          />
        </div>

        {/* Efeito de brilho */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Efeito de borda pulsante */}
        <div className="absolute inset-0 rounded-full border-2 border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:border-white/40" />

        {/* Ícone com animação */}
        <ChevronUp className="relative z-10 h-7 w-7 text-white transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110" />

        {/* Tooltip moderno */}
        <div className="pointer-events-none absolute right-0 bottom-full mb-4 rounded-xl border border-gray-700/50 bg-gray-900/95 px-4 py-2 text-sm whitespace-nowrap text-white opacity-0 shadow-xl backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
          <span className="font-medium">Voltar ao topo</span>
          <div className="absolute top-full right-5 h-0 w-0 border-t-4 border-r-4 border-l-4 border-transparent border-t-gray-900/95" />
        </div>

        {/* Efeito de ondas */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[var(--button-primary)] to-[var(--text-price-secondary)] opacity-0 transition-all duration-700 ease-out group-hover:scale-150 group-hover:opacity-20" />
      </Button>
    </div>
  );
}
