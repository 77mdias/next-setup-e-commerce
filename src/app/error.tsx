"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-destructive text-6xl font-bold">Erro</h1>
        <h2 className="text-foreground text-2xl font-semibold">
          Algo deu errado!
        </h2>
        <p className="text-muted-foreground max-w-md">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o
          suporte.
        </p>
        <button
          onClick={() => reset()}
          className="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
