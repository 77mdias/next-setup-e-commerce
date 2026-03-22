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
    <div className="flex min-h-screen items-center justify-center bg-[#efebe3] dark:bg-[#11100d]">
      <div className="text-center">
        <div className="mb-4 text-6xl">❌</div>
        <h1 className="mb-2 text-2xl font-bold text-[#11100d] dark:text-white">
          Produto não encontrado
        </h1>
        <p className="mb-6 text-[#655a4e] dark:text-gray-400">
          {error || "O produto solicitado não existe"}
        </p>
        <Link href={categoriesPath}>
          <Button className="bg-[#916130] text-white hover:bg-[#a4753f] dark:text-[#11100d]">
            Voltar aos produtos
          </Button>
        </Link>
      </div>
    </div>
  );
}
