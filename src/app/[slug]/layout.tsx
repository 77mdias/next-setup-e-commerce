import { CartProvider } from "@/context/cart";

export default function LegacySlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartProvider>{children}</CartProvider>;
}
