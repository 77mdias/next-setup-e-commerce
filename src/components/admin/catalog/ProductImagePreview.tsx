"use client";

import Image from "next/image";

import {
  normalizeProductImageSrc,
  shouldUseUnoptimizedImage,
} from "@/lib/product-image";

export function ProductImagePreview({ alt, src }: { alt: string; src: string }) {
  const normalizedSrc = normalizeProductImageSrc(src);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/6 bg-[#1b1712]">
      <Image
        alt={alt}
        className="h-28 w-full object-cover"
        height={160}
        src={normalizedSrc}
        unoptimized={shouldUseUnoptimizedImage(normalizedSrc) || true}
        width={240}
      />
    </div>
  );
}
