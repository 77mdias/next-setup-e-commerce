import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Meu Sistema de Pedidos",
  description: "Sistema moderno de pedidos para restaurantes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
