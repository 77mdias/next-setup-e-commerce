import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CartProvider } from "./context/cart";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Buscar a loja pelo slug
  const store = await db.store.findUnique({
    where: {
      slug: slug,
    },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return <CartProvider>{children}</CartProvider>;
}
