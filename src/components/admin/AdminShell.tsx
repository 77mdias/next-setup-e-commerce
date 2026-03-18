"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  getAdminBreadcrumbs,
  getAdminRouteMeta,
} from "@/components/admin/admin-navigation";

export type AdminShellContext = {
  actorName: string;
  roleLabel: string;
  scopeDescription: string;
  scopeLabel: string;
};

type AdminShellProps = {
  children: ReactNode;
  context: AdminShellContext;
};

export default function AdminShell({ children, context }: AdminShellProps) {
  const pathname = usePathname() || "/admin";
  const route = getAdminRouteMeta(pathname);
  const breadcrumbs = getAdminBreadcrumbs(pathname);

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#f1f3f5]">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-10 xl:px-12">
        <AdminSidebar {...context} />

        <div className="flex-1 space-y-6">
          <header className="overflow-hidden rounded-2xl border border-white/6 bg-[#171a21]">
            <div className="border-b border-white/6 px-4 py-3 sm:px-5">
              <nav
                aria-label="Breadcrumbs do painel"
                className="flex flex-wrap items-center gap-2 [font-family:var(--font-arimo)] text-sm text-[#6a7282]"
              >
                {breadcrumbs.map((breadcrumb, index) => (
                  <span
                    key={breadcrumb.href}
                    className="inline-flex items-center gap-2"
                  >
                    {index > 0 ? (
                      <ChevronRight className="h-4 w-4 text-[#6a7282]" />
                    ) : null}
                    <Link
                      className={`transition hover:text-[#f1f3f5] ${
                        index === breadcrumbs.length - 1
                          ? "text-[#f1f3f5]"
                          : ""
                      }`}
                      href={breadcrumb.href}
                    >
                      {breadcrumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
            </div>

            <div className="px-4 py-5 sm:px-5 sm:py-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-rose-200 uppercase">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {route.eyebrow}
                </div>

                <h1 className="[font-family:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-[#f1f3f5] sm:text-3xl">
                  {route.heading}
                </h1>
                <p className="max-w-2xl [font-family:var(--font-arimo)] text-sm leading-relaxed text-[#6a7282] sm:text-base">
                  {route.description}
                </p>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
