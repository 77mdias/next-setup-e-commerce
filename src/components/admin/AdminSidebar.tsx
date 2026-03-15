"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";

import {
  ADMIN_NAV_ITEMS,
  isAdminNavigationItemActive,
} from "@/components/admin/admin-navigation";

type AdminSidebarProps = {
  actorName: string;
  roleLabel: string;
  scopeDescription: string;
  scopeLabel: string;
};

const adminIcons = {
  "/admin": LayoutDashboard,
  "/admin/audit": ScrollText,
  "/admin/catalog": Boxes,
  "/admin/customers": Users,
  "/admin/orders": ShoppingCart,
} as const;

function AdminSidebarLink({
  href,
  description,
  isActive,
  label,
}: {
  description: string;
  href: string;
  isActive: boolean;
  label: string;
}) {
  const Icon = adminIcons[href as keyof typeof adminIcons] ?? LayoutDashboard;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`group flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
        isActive
          ? "border-rose-400/70 bg-rose-500/[0.18] text-white shadow-[0_18px_40px_rgba(244,63,94,0.18)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-white"
      }`}
      href={href}
    >
      <span
        className={`mt-0.5 rounded-xl p-2 ${
          isActive
            ? "bg-white/[0.14] text-rose-100"
            : "bg-slate-950/40 text-cyan-100"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="space-y-1">
        <span className="block text-sm font-semibold tracking-wide">
          {label}
        </span>
        <span className="block text-xs leading-5 text-slate-300">
          {description}
        </span>
      </span>
    </Link>
  );
}

export default function AdminSidebar({
  actorName,
  roleLabel,
  scopeDescription,
  scopeLabel,
}: AdminSidebarProps) {
  const pathname = usePathname() || "/admin";

  return (
    <>
      <nav
        aria-label="Navegação administrativa"
        className="overflow-x-auto pb-1 lg:hidden"
      >
        <div className="flex min-w-max gap-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = isAdminNavigationItemActive(item.href, pathname);

            return (
              <Link
                key={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "border-rose-400/70 bg-rose-500/[0.18] text-white"
                    : "border-white/10 bg-white/[0.06] text-slate-200"
                }`}
                href={item.href}
              >
                {item.shortLabel}
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="hidden w-full max-w-sm shrink-0 lg:block">
        <div className="sticky top-6 space-y-5 rounded-[2rem] border border-white/10 bg-slate-950/75 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3 py-1 text-xs font-semibold tracking-[0.28em] text-cyan-100 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              Operação interna
            </div>

            <div className="space-y-2">
              <p className="text-2xl font-semibold tracking-tight text-white">
                Painel admin
              </p>
              <p className="text-sm leading-6 text-slate-300">
                Navegação única para monitorar rotinas críticas, escopo de loja
                e módulos operacionais da Sprint 06.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase">
              Contexto atual
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-slate-400">Operador</p>
                <p className="text-base font-semibold text-white">
                  {actorName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Perfil</p>
                <p className="text-base font-semibold text-white">
                  {roleLabel}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Escopo</p>
                <p className="text-base font-semibold text-white">
                  {scopeLabel}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {scopeDescription}
                </p>
              </div>
            </div>
          </div>

          <nav aria-label="Módulos administrativos" className="space-y-3">
            {ADMIN_NAV_ITEMS.map((item) => (
              <AdminSidebarLink
                key={item.href}
                description={item.description}
                href={item.href}
                isActive={isAdminNavigationItemActive(item.href, pathname)}
                label={item.label}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
