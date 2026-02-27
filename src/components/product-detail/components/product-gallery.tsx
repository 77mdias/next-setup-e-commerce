"use client";

import { useState } from "react";
import Image from "next/image";

import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  isOnSale: boolean;
  isFeatured: boolean;
}

export function ProductGallery({
  images,
  productName,
  isOnSale,
  isFeatured,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const safeImages =
    images.length > 0 ? images : ["/images/home/card-razer-node.png"];
  const mainImage = normalizeProductImageSrc(
    safeImages[selectedImage] ?? safeImages[0],
    "/images/home/card-razer-node.png",
  );
  const useUnoptimizedMain = shouldUseUnoptimizedImage(mainImage);

  return (
    <div className="space-y-5">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#dbe4ff] bg-[#edf2ff] dark:border-white/10 dark:bg-[#080b10]">
        <div className="relative h-full w-full">
          <Image
            src={mainImage}
            alt={productName}
            fill
            unoptimized={useUnoptimizedMain}
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
        {(isFeatured || isOnSale) && (
          <div className="absolute top-4 left-4 rounded-[10px] bg-[#5c7cfa] px-3 py-1 [font-family:var(--font-arimo)] text-xs font-bold tracking-[0.05em] text-white uppercase">
            {isOnSale ? "Sale" : "New"}
          </div>
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.slice(0, 4).map((image, index) => {
            const thumbnailImage = normalizeProductImageSrc(
              image,
              "/images/home/card-razer-node.png",
            );

            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`overflow-hidden rounded-xl border bg-white p-0.5 transition-all dark:bg-[#12151a] ${
                  selectedImage === index
                    ? "border-[#ff2e63]"
                    : "border-[#dbe4ff] hover:border-[#bfcff7] dark:border-white/10 dark:hover:border-white/20"
                }`}
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={thumbnailImage}
                    alt={`${productName} - Imagem ${index + 1}`}
                    fill
                    unoptimized={shouldUseUnoptimizedImage(thumbnailImage)}
                    className="rounded-[10px] object-cover"
                    sizes="120px"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
