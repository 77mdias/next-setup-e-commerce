import { redirect } from "next/navigation";

interface LegacySlugSupportPageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacySlugSupportPage({
  params,
}: LegacySlugSupportPageProps) {
  const { slug } = await params;
  const fromPath = encodeURIComponent(`/${slug}/suporte`);

  redirect(`/status?reason=development&from=${fromPath}`);
}
