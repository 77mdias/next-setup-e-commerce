import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Toaster } from "sonner";

import AppChrome from "@/components/layout/app-chrome";
import { CartProvider } from "@/context/cart";
import SessionProvider from "@/components/providers/SessionProvider";
import ThemeProvider from "@/components/providers/ThemeProvider";

import "./globals.scss";

export const metadata: Metadata = {
  title: "My Store - E-commerce de Eletrônicos",
  description: "Plataforma completa de e-commerce para eletrônicos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fontVariablesStyle = {
    "--font-arimo": '"Arimo", "Segoe UI", Arial, sans-serif',
    "--font-space-grotesk": '"Space Grotesk", "Arial Black", sans-serif',
  } as CSSProperties;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased" style={fontVariablesStyle}>
        <ThemeProvider>
          <SessionProvider>
            <CartProvider>
              <AppChrome>{children}</AppChrome>
            </CartProvider>
          </SessionProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
