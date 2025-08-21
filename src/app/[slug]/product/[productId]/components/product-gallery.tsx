"use client";

import { useState } from "react";

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

  return (
    <div className="space-y-4">
      {/* Imagem Principal */}
      <div className="relative h-96 overflow-hidden rounded-xl">
        <img
          src={images[selectedImage] || images[0]}
          alt={productName}
          className="h-full w-full object-contain transition-transform duration-300 hover:scale-102"
        />
        {isOnSale && (
          <div className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
            PROMOÇÃO
          </div>
        )}
        {isFeatured && (
          <div className="absolute top-4 right-4 rounded-full bg-yellow-500 px-3 py-1 text-sm font-bold text-black">
            DESTAQUE
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                selectedImage === index
                  ? "border-[var(--button-primary)]"
                  : "border-gray-700 hover:border-gray-600"
              }`}
            >
              <img
                src={image}
                alt={`${productName} - Imagem ${index + 1}`}
                className="h-20 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
