import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="space-y-6 text-center">
        <h1 className="text-foreground text-4xl font-bold">
          🍔 Meu Sistema de Pedidos
        </h1>
        <p className="text-muted-foreground text-xl">
          Sistema moderno de pedidos para restaurantes
        </p>
        <div className="space-y-4">
          <Link
            href="/meu-restaurante"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-block rounded-lg px-8 py-3 font-medium transition-colors"
          >
            🚀 Acessar Restaurante
          </Link>
          <div className="text-muted-foreground text-sm">
            <p>✅ Next.js 15.1.6 configurado</p>
            <p>✅ TypeScript + Tailwind CSS</p>
            <p>✅ Prisma + PostgreSQL</p>
            <p>✅ Stripe para pagamentos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
