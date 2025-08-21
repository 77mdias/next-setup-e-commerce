import Menu from "./components/Menu";
import Header from "./components/Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Nav from "./components/Nav";
import { CartProvider } from "./context/cart";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

const prisma = new PrismaClient();

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Buscar a loja pelo slug
  const store = await prisma.store.findUnique({
    where: {
      slug: slug,
    },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <div className="bg-background bg-[var(--all-black)]">
      <Header slug={slug} store={store} />
      <ScrollArea className="h-[calc(100vh-6.12rem)]">
        <Nav />
        <CartProvider>{children}</CartProvider>
      </ScrollArea>
      <Menu />
      <ScrollToTop useScrollArea={true} threshold={800} />
    </div>
  );
}
