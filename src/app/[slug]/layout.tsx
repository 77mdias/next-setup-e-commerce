import Footer from "./components/Menu";
import Header from "./components/Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";

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
    <div>
      <Header slug={slug} store={store} />
      <ScrollArea className="h-[calc(100vh-6.12rem)]">{children}</ScrollArea>
      <Footer />
    </div>
  );
}
