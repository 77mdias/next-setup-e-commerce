import { redirect } from "next/navigation";

interface OfertasRedirectPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OfertasRedirectPage({
  params,
}: OfertasRedirectPageProps) {
  await params;

  redirect("/explore");
}
