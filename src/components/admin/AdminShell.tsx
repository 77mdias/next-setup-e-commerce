"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldCheck, Store, UserRound } from "lucide-react";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        <AdminSidebar {...context} />

        <div className="flex-1 space-y-6">
          <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/[0.65] shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="border-b border-white/[0.08] bg-white/[0.06] px-5 py-4 sm:px-6">
              <nav
                aria-label="Breadcrumbs do painel"
                className="flex flex-wrap items-center gap-2 text-sm text-slate-300"
              >
                {breadcrumbs.map((breadcrumb, index) => (
                  <span
                    key={breadcrumb.href}
                    className="inline-flex items-center gap-2"
                  >
                    {index > 0 ? (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    ) : null}
                    <Link
                      className={`transition hover:text-white ${
                        index === breadcrumbs.length - 1 ? "text-white" : ""
                      }`}
                      href={breadcrumb.href}
                    >
                      {breadcrumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/35 bg-rose-500/10 px-3 py-1 text-xs font-semibold tracking-[0.28em] text-rose-100 uppercase">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {route.eyebrow}
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                      {route.heading}
                    </h1>
                    <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                      {route.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
                  Shell administrativo protegido pelo layout server-side e pelo
                  mesmo contrato de acesso do middleware.
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-white/10 p-2 text-cyan-100">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                        Operador
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {context.actorName}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-white/10 p-2 text-cyan-100">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                        Papel ativo
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {context.roleLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-white/10 p-2 text-cyan-100">
                      <Store className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                        Escopo
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {context.scopeLabel}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {context.scopeDescription}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
