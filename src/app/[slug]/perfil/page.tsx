"use client";

import { useParams } from "next/navigation";

import { ProfilePageContent } from "@/components/profile/profile-page-content";

export default function PerfilPage() {
  const params = useParams();
  const slug = params.slug as string | undefined;
  const signOutCallbackUrl = slug ? `/${slug}` : "/";

  return <ProfilePageContent signOutCallbackUrl={signOutCallbackUrl} />;
}
