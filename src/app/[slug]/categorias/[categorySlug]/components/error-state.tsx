"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  slug: string;
}

export function ErrorState({ slug }: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--all-black)]">
      <div className="text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h3 className="mb-2 text-xl font-semibold text-white">
          Categoria não encontrada
        </h3>
        <p className="mb-6 text-gray-400">
          A categoria que você está procurando não existe
        </p>
        <Link href={`/${slug}/categorias`}>
          <Button className="bg-[var(--button-primary)] hover:bg-[var(--text-price-secondary)]">
            Voltar às Categorias
          </Button>
        </Link>
      </div>
    </div>
  );
}
