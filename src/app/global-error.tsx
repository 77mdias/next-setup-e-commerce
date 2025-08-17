"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="bg-background flex min-h-screen flex-col items-center justify-center">
          <div className="space-y-4 text-center">
            <h1 className="text-destructive text-6xl font-bold">Erro Global</h1>
            <h2 className="text-foreground text-2xl font-semibold">
              Erro crítico do sistema
            </h2>
            <p className="text-muted-foreground max-w-md">
              Ocorreu um erro crítico. Por favor, recarregue a página.
            </p>
            <button
              onClick={() => reset()}
              className="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
            >
              Recarregar página
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
