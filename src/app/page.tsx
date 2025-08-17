import { db } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const store = await db.store.findFirst();

  if (!store) {
    return <div>Loja não encontrada</div>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-500">
      <div className="flex flex-col items-center justify-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">💻 NeXT Store</h1>
        <p className="text-xl text-gray-600">
          E-commerce moderno de eletrônicos e periféricos
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4 p-4 text-center text-white">
        <h1 className="text-2xl font-bold">
          Sua nova loja online de forma rápida e fácil
        </h1>
        <p className="text-sm">
          Acesse agora a loja criada com Next.js 15.1.6 e Prisma 5.1.1
        </p>
        <Link href={`/${store.slug}`}>
          <button className="cursor-pointer rounded-md bg-white p-2 text-black transition-colors hover:bg-blue-600 hover:text-white">
            Acessar loja
          </button>
        </Link>
      </div>
    </div>
  );
}
