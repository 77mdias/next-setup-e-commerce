"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Store, Product } from "@prisma/client";
import Image from "next/image";
import { formatCurrency } from "@/helpers/format-currency";
import styles from "../scss/page.module.scss";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

const OffersForYou = ({ slug, store }: { slug: string; store: Product[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  //PRECISO MUDAR A ORDEM DOS PRODUTOS
  const sortedProducts = store.sort((a, b) => {
    return (b.originalPrice || 0) - (a.originalPrice || 0);
  });

  useEffect(() => {
    if (!api) {
      return;
    }

    const updateScrollButtons = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    updateScrollButtons();
    api.on("select", updateScrollButtons);

    return () => {
      api.off("select", updateScrollButtons);
    };
  }, [api]);

  // Adicionar scroll do mouse
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || !api) return;

    const handleWheel = (e: Event) => {
      const wheelEvent = e as WheelEvent;

      // Só previne o scroll se o mouse estiver sobre o carousel
      const rect = carousel.getBoundingClientRect();
      const isOverCarousel =
        wheelEvent.clientX >= rect.left &&
        wheelEvent.clientX <= rect.right &&
        wheelEvent.clientY >= rect.top &&
        wheelEvent.clientY <= rect.bottom;

      if (!isOverCarousel) return;

      // Previne o scroll vertical da página quando estiver sobre o carousel
      wheelEvent.preventDefault();

      // Detecta direção do scroll (horizontal ou vertical)
      const scrollAmount =
        Math.abs(wheelEvent.deltaX) > Math.abs(wheelEvent.deltaY)
          ? wheelEvent.deltaX
          : wheelEvent.deltaY;

      if (scrollAmount > 0) {
        // Scroll para a direita/baixo - próximo slide
        if (api.canScrollNext()) {
          api.scrollNext();
        }
      } else if (scrollAmount < 0) {
        // Scroll para a esquerda/cima - slide anterior
        if (api.canScrollPrev()) {
          api.scrollPrev();
        }
      }
    };

    // Adiciona o listener diretamente no elemento do carousel
    carousel.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      carousel.removeEventListener("wheel", handleWheel);
    };
  }, [api]);

  return (
    <div className="container mx-auto px-4 py-4 text-white">
      <h2 className="mb-4 text-xl font-bold md:text-2xl">Ofertas para você</h2>
      <div ref={carouselRef} className="cursor-grab active:cursor-grabbing">
        <Carousel className="relative" setApi={setApi}>
          <CarouselContent className="flex gap-2 pl-6">
            {sortedProducts.map((product) => (
              <CarouselItem
                key={product.id}
                className="basis-1/2 rounded-xl bg-[var(--card-product)] p-4 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
              >
                <Link
                  href={`/${slug}/product/${product.id}`}
                  className="flex h-full flex-col items-center justify-between gap-4"
                >
                  <div className="flex flex-1 items-center justify-center">
                    <div className="relative h-[120px] w-[140px] sm:h-[100px] sm:w-[120px] md:h-[110px] md:w-[130px]">
                      <Image
                        src={product.images[0] || ""}
                        alt={product.name}
                        fill
                        className="object-contain transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Nome do produto */}
                  <div className="w-full text-center">
                    <h3 className="line-clamp-2 text-xs font-medium text-white sm:text-sm">
                      {product.name}
                    </h3>
                  </div>

                  {/* Preços */}
                  <div className="flex flex-col items-center gap-1">
                    {product.originalPrice &&
                      product.originalPrice > product.price && (
                        <p className="text-xs font-extralight text-gray-400 line-through opacity-60">
                          {formatCurrency(product.originalPrice)}
                        </p>
                      )}
                    <p
                      className={`${styles.price} text-sm font-bold tracking-tighter text-[var(--text-price)] sm:text-base`}
                    >
                      {formatCurrency(product.price)}
                    </p>

                    {/* Badge de desconto */}
                    {product.originalPrice &&
                      product.originalPrice > product.price && (
                        <div className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                          {Math.round(
                            ((product.originalPrice - product.price) /
                              product.originalPrice) *
                              100,
                          )}
                          % OFF
                        </div>
                      )}
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          {canScrollPrev && (
            <CarouselPrevious className="left-0 size-10 bg-black/60 text-white hover:bg-black/80" />
          )}
          {canScrollNext && (
            <CarouselNext className="right-0 size-10 bg-black/60 text-white hover:bg-black/80" />
          )}
        </Carousel>
      </div>
    </div>
  );
};

export default OffersForYou;
