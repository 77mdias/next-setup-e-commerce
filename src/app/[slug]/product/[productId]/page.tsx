import { redirect } from "next/navigation";

interface LegacyProductDetailRedirectPageProps {
  params: Promise<{ productId: string }>;
}

export default async function LegacyProductDetailRedirectPage({
  params,
}: LegacyProductDetailRedirectPageProps) {
  const { productId } = await params;
  redirect(`/product/${encodeURIComponent(productId)}`);
}
