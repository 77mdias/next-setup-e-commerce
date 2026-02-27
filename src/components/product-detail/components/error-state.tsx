"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  categoriesPath?: string;
  error?: string;
}

export function ErrorState({
  categoriesPath = "/products",
  error,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f8ff] dark:bg-[#0b0d10]">
      <div className="text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h1 className="mb-2 text-2xl font-bold text-[#0f172a] dark:text-white">
          Produto não encontrado
        </h1>
        <p className="mb-6 text-[#64748b] dark:text-gray-400">
          {error || "O produto solicitado não existe"}
        </p>
        <Link href={categoriesPath}>
          <Button className="bg-[#ff2e63] text-white hover:bg-[#ff4c7a] dark:text-[#0b0d10]">
            Voltar aos produtos
          </Button>
        </Link>
      </div>
    </div>
  );
}
