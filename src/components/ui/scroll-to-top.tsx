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
  threshold = 300,
  smooth = true,
  className = "",
  useScrollArea = false,
}: ScrollToTopProps = {}) {
  const { showScrollToTop, scrollToTop } = useScrollToTop({
    threshold,
    smooth,
    useScrollArea,
  });

  if (!showScrollToTop) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={`fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full bg-[var(--button-primary)] p-0 shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[var(--text-price-secondary)] ${className}`}
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="h-6 w-6" />
    </Button>
  );
}
