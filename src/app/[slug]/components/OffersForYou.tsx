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
import { useState, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

const OffersForYou = ({ slug, store }: { slug: string; store: Product[] }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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

  return (
    <div className="container mx-auto px-4 py-3 text-white">
      <h2 className="mb-3 text-xl font-bold">Ofertas para você</h2>
      <Carousel className="relative" setApi={setApi}>
        <CarouselContent className="flex gap-1 pl-5">
          {sortedProducts.map((product) => (
            <CarouselItem
              key={product.id}
              className="basis-1/3 rounded-lg bg-[var(--card-product)] p-2"
            >
              <Link
                href={`/${slug}/product/${product.id}`}
                className="flex h-full flex-col items-center justify-between gap-3"
              >
                <div className="flex flex-1 items-center justify-center">
                  <div className="relative h-[82px] w-[100px]">
                    <Image
                      src={product.images[0] || ""}
                      alt={product.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <p className="text-muted-foreground text-xs font-extralight line-through opacity-50">
                    {formatCurrency(product.originalPrice || 0)}
                  </p>
                  <p
                    className={`${styles.price} text-muted-foreground text-sm font-bold tracking-tighter text-[var(--text-price)]`}
                  >
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        {canScrollPrev && (
          <CarouselPrevious className="left-0 size-8 bg-black/50 text-white hover:bg-black/70" />
        )}
        {canScrollNext && (
          <CarouselNext className="right-0 size-8 bg-black/50 text-white hover:bg-black/70" />
        )}
      </Carousel>
    </div>
  );
};

export default OffersForYou;
