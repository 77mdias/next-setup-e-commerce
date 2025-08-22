import type { Metadata } from "next";
import "./globals.scss";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "My Store - E-commerce de Eletrônicos",
  description: "Plataforma completa de e-commerce para eletrônicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
        <Toaster />
      </body>
    </html>
  );
}
