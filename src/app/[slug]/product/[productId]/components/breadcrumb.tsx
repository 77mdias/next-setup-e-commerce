"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface BreadcrumbProps {
  slug: string;
  productName: string;
}

export function Breadcrumb({ slug, productName }: BreadcrumbProps) {
  return (
    <div className="border-b border-gray-800 bg-gray-900/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link
            href={`/${slug}`}
            className="transition-colors hover:text-white"
          >
            Início
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <Link
            href={`/${slug}/categorias`}
            className="transition-colors hover:text-white"
          >
            Categorias
          </Link>
          <ChevronLeft className="h-4 w-4" />
          <span className="text-white">{productName}</span>
        </div>
      </div>
    </div>
  );
}
