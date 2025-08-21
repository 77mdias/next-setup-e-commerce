"use client";

import { Star } from "lucide-react";

interface ProductHeaderProps {
  name: string;
  brandName?: string;
  shortDesc?: string | null;
  rating: number;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
}

export function ProductHeader({
  name,
  brandName,
  shortDesc,
  rating,
  reviewCount,
  soldCount,
  viewCount,
}: ProductHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Título e Marca */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm text-gray-400">Marca:</span>
          <span className="rounded-full bg-gray-800 px-3 py-1 text-sm font-medium text-white">
            {brandName || "Sem marca"}
          </span>
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white">{name}</h1>
        <p className="text-gray-400">{shortDesc}</p>
      </div>

      {/* Avaliações */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < Math.floor(rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-400">
          {rating.toFixed(1)} ({reviewCount} avaliações)
        </span>
        <span className="text-sm text-gray-400">• {soldCount} vendidos</span>
        <span className="text-sm text-gray-400">
          • {viewCount} visualizações
        </span>
      </div>
    </div>
  );
}
