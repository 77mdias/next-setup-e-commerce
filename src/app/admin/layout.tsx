import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { resolveAdminPageAccess } from "@/lib/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const access = await resolveAdminPageAccess({
    fromPath: "/admin",
  });

  if (!access.allowed) {
    redirect(access.feedbackPath);
  }

  return children;
}
