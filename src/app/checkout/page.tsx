import { notFound, redirect } from "next/navigation";

import { resolveStoreBySlugOrActive } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function CheckoutRedirectPage() {
  const store = await resolveStoreBySlugOrActive();

  if (!store) {
    notFound();
  }

  redirect(`/${store.slug}/checkout`);
}
