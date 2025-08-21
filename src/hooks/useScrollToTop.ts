import { useState, useEffect } from "react";

interface UseScrollToTopOptions {
  threshold?: number; // Distância mínima para mostrar o botão
  smooth?: boolean; // Se deve usar scroll suave
  useScrollArea?: boolean; // Se deve monitorar ScrollArea
}

export function useScrollToTop(options: UseScrollToTopOptions = {}) {
  const { threshold = 2400, smooth = true, useScrollArea = false } = options;
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      let scrollTop = 0;

      if (useScrollArea) {
        // Tentar encontrar o ScrollArea
        const scrollArea = document.querySelector(
          "[data-radix-scroll-area-viewport]",
        ) as HTMLElement;
        if (scrollArea) {
          scrollTop = scrollArea.scrollTop;
        } else {
          scrollTop = window.scrollY || document.documentElement.scrollTop;
        }
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
      }

      const shouldShow = scrollTop > threshold;
      setShowScrollToTop(shouldShow);
    };

    // Adicionar listener de scroll
    if (useScrollArea) {
      const scrollArea = document.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollArea) {
        scrollArea.addEventListener("scroll", handleScroll);
        handleScroll(); // Verificar posição inicial
        return () => scrollArea.removeEventListener("scroll", handleScroll);
      }
    }

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Verificar posição inicial

    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold, useScrollArea]);

  const scrollToTop = () => {
    if (useScrollArea) {
      const scrollArea = document.querySelector(
        "[data-radix-scroll-area-viewport]",
      ) as HTMLElement;
      if (scrollArea) {
        scrollArea.scrollTo({
          top: 0,
          behavior: smooth ? "smooth" : "auto",
        });
        return;
      }
    }

    window.scrollTo({
      top: 0,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return {
    showScrollToTop,
    scrollToTop,
  };
}
