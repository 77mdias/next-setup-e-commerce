import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-foreground text-6xl font-bold">404</h1>
        <h2 className="text-muted-foreground text-2xl font-semibold">
          Página não encontrada
        </h2>
        <p className="text-muted-foreground max-w-md">
          A página que você está procurando não existe ou foi removida.
        </p>
        <Link
          href="/"
          className="ring-offset-background focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
